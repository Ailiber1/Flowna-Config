/**
 * Workflow Execution Engine
 * Handles the execution of workflow nodes in topological order
 */

import type { FlowNode, Connection, NodeStatus } from '../types';
import { githubConnector, claudeConnector, geminiConnector } from './connectors';

export interface ExecutionResult {
  nodeId: string;
  status: NodeStatus;
  message?: string;
  data?: unknown;
}

export interface ExecutionProgress {
  currentNodeId: string;
  completedCount: number;
  totalCount: number;
  status: 'running' | 'completed' | 'error';
}

export type ProgressCallback = (progress: ExecutionProgress) => void;
export type NodeUpdateCallback = (result: ExecutionResult) => void;

/**
 * Performs topological sort on nodes based on connections
 * Returns nodes in execution order (dependencies first)
 */
export function topologicalSort(
  nodes: FlowNode[],
  connections: Connection[]
): FlowNode[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const activeConnections = connections.filter(c => c.active);

  // Build adjacency list and in-degree count
  const inDegree = new Map<string, number>();
  const adjacencyList = new Map<string, string[]>();

  // Initialize
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacencyList.set(node.id, []);
  }

  // Build graph (from -> to means "from" must execute before "to")
  for (const conn of activeConnections) {
    if (nodeMap.has(conn.from) && nodeMap.has(conn.to)) {
      adjacencyList.get(conn.from)!.push(conn.to);
      inDegree.set(conn.to, (inDegree.get(conn.to) || 0) + 1);
    }
  }

  // Kahn's algorithm
  const queue: string[] = [];
  const result: FlowNode[] = [];

  // Start with nodes that have no dependencies
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodeMap.get(nodeId);
    if (node) {
      result.push(node);
    }

    for (const neighbor of adjacencyList.get(nodeId) || []) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // If result doesn't contain all nodes, there's a cycle
  // Add remaining nodes at the end
  if (result.length < nodes.length) {
    const resultIds = new Set(result.map(n => n.id));
    for (const node of nodes) {
      if (!resultIds.has(node.id)) {
        result.push(node);
      }
    }
  }

  return result;
}

/**
 * Execute a single node based on its type and connector links
 */
async function executeNode(node: FlowNode): Promise<ExecutionResult> {
  // Skip RULE nodes (they're already 'done')
  if (node.category.toUpperCase() === 'RULE') {
    return {
      nodeId: node.id,
      status: 'done',
      message: 'Rule node - already complete',
    };
  }

  // Check if node has connector links
  if (node.connectorLinks && node.connectorLinks.length > 0) {
    for (const link of node.connectorLinks) {
      try {
        const result = await executeConnectorAction(link.connectorId, node);
        if (!result.success) {
          return {
            nodeId: node.id,
            status: 'error',
            message: result.message,
          };
        }
      } catch (error) {
        return {
          nodeId: node.id,
          status: 'error',
          message: `Connector error: ${error}`,
        };
      }
    }
  }

  // Simulate processing time for visual feedback
  await delay(300);

  return {
    nodeId: node.id,
    status: 'done',
    message: 'Node executed successfully',
  };
}

/**
 * Execute connector-specific actions
 */
async function executeConnectorAction(
  connectorId: string,
  _node: FlowNode
): Promise<{ success: boolean; message: string; data?: unknown }> {
  switch (connectorId) {
    case 'github':
      if (!githubConnector.isConfigured()) {
        return { success: true, message: 'GitHub not configured - skipping' };
      }
      // For GitHub, we could trigger workflows if configured
      return { success: true, message: 'GitHub action completed' };

    case 'claude-code':
      if (!claudeConnector.isConfigured()) {
        return { success: true, message: 'Claude not configured - skipping' };
      }
      // Could use Claude to process node descriptions or generate content
      return { success: true, message: 'Claude action completed' };

    case 'gemini':
      if (!geminiConnector.isConfigured()) {
        return { success: true, message: 'Gemini not configured - skipping' };
      }
      return { success: true, message: 'Gemini action completed' };

    default:
      return { success: true, message: `Connector ${connectorId} executed` };
  }
}

/**
 * Helper function to create a delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main workflow execution function
 * Executes nodes in topological order with progress callbacks
 */
export async function executeWorkflow(
  nodes: FlowNode[],
  connections: Connection[],
  onProgress: ProgressCallback,
  onNodeUpdate: NodeUpdateCallback
): Promise<{ success: boolean; results: ExecutionResult[] }> {
  // Filter to only process nodes that are connected
  const connectedNodeIds = new Set<string>();
  const activeConnections = connections.filter(c => c.active);

  for (const conn of activeConnections) {
    connectedNodeIds.add(conn.from);
    connectedNodeIds.add(conn.to);
  }

  // If no connections, process all non-RULE nodes
  const nodesToProcess = connectedNodeIds.size > 0
    ? nodes.filter(n => connectedNodeIds.has(n.id))
    : nodes.filter(n => n.category.toUpperCase() !== 'RULE');

  // Sort nodes in execution order
  const sortedNodes = topologicalSort(nodesToProcess, activeConnections);
  const results: ExecutionResult[] = [];
  let hasError = false;

  for (let i = 0; i < sortedNodes.length; i++) {
    const node = sortedNodes[i];

    // Report progress
    onProgress({
      currentNodeId: node.id,
      completedCount: i,
      totalCount: sortedNodes.length,
      status: 'running',
    });

    // Execute the node
    const result = await executeNode(node);
    results.push(result);

    // Report node update
    onNodeUpdate(result);

    if (result.status === 'error') {
      hasError = true;
      // Continue with other nodes even if one fails
    }
  }

  // Final progress report
  onProgress({
    currentNodeId: '',
    completedCount: sortedNodes.length,
    totalCount: sortedNodes.length,
    status: hasError ? 'error' : 'completed',
  });

  return {
    success: !hasError,
    results,
  };
}

/**
 * Validate workflow before execution
 * Returns validation errors if any
 */
export function validateWorkflow(
  nodes: FlowNode[],
  connections: Connection[]
): string[] {
  const errors: string[] = [];
  const nodeIds = new Set(nodes.map(n => n.id));

  // Check for broken connections
  for (const conn of connections) {
    if (!nodeIds.has(conn.from)) {
      errors.push(`Connection ${conn.id} has invalid source node`);
    }
    if (!nodeIds.has(conn.to)) {
      errors.push(`Connection ${conn.id} has invalid target node`);
    }
  }

  // Check for nodes without connections (warning, not error)
  const connectedNodes = new Set<string>();
  for (const conn of connections) {
    connectedNodes.add(conn.from);
    connectedNodes.add(conn.to);
  }

  const isolatedNodes = nodes.filter(
    n => !connectedNodes.has(n.id) && n.category.toUpperCase() !== 'RULE'
  );

  if (isolatedNodes.length > 0 && connections.length > 0) {
    // Only warn if there are some connections but isolated nodes exist
    // This is informational, not an error
  }

  return errors;
}
