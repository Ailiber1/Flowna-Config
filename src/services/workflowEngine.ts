/**
 * Workflow Execution Engine
 * Handles the execution of workflow nodes in topological order
 * Supports Create/Patch modes with execution plans and idempotency
 */

import type {
  FlowNode, Connection, NodeStatus, ExecutionMode, ExecutionPlan, ExecutionPlanItem, PlanNodeStatus
} from '../types';
import { githubConnector, claudeConnector, geminiConnector } from './connectors';

export interface ExecutionResult {
  nodeId: string;
  status: NodeStatus;
  message?: string;
  data?: unknown;
  inputHash?: string;
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
 * Calculate a hash of node inputs for idempotency checking
 */
export function calculateInputHash(node: FlowNode, connections: Connection[]): string {
  // Get incoming connections
  const incomingConnections = connections.filter(c => c.to === node.id && c.active);

  // Create a deterministic string representation
  const hashInput = JSON.stringify({
    nodeId: node.id,
    title: node.title,
    description: node.description,
    category: node.category,
    actions: node.actions || [],
    connectorLinks: node.connectorLinks,
    incomingNodeIds: incomingConnections.map(c => c.from).sort(),
    // Include memo and other relevant fields
    memo: node.memo,
    url: node.url,
  });

  // Simple hash function (for production, use a proper hash library)
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Check if a node has a Patch Target action
 */
export function isPatchTarget(node: FlowNode): boolean {
  return (node.actions || []).some(
    action => action.type === 'patch-target' && action.enabled
  );
}

/**
 * Check if node should run based on mode and conditions
 */
export function shouldNodeRun(
  node: FlowNode,
  mode: ExecutionMode,
  connections: Connection[],
  appCreated: boolean
): { status: PlanNodeStatus; reason: string } {
  // RULE nodes are always skipped (they're informational)
  if (node.category.toUpperCase() === 'RULE') {
    return { status: 'skip', reason: 'Rule node - informational only' };
  }

  // Create mode logic
  if (mode === 'create') {
    if (appCreated) {
      return { status: 'blocked', reason: 'App already created - switch to Patch mode' };
    }
    return { status: 'run', reason: 'Create mode - will execute' };
  }

  // Patch mode logic
  if (mode === 'patch') {
    // Check if run toggle is manually set
    if (node.runToggle === false) {
      return { status: 'skip', reason: 'Manually toggled to SKIP' };
    }

    // If manually set to run, always run
    if (node.runToggle === true) {
      return { status: 'run', reason: 'Manually toggled to RUN' };
    }

    // Check if node is a patch target (default behavior when not manually toggled)
    if (!isPatchTarget(node)) {
      // Non-patch-target nodes are skipped by default
      return { status: 'skip', reason: 'Not a patch target' };
    }

    // Check input hash for idempotency
    const currentHash = calculateInputHash(node, connections);
    if (node.lastRun && node.lastRun.inputHash === currentHash) {
      return { status: 'skip', reason: 'Input unchanged since last run' };
    }

    return { status: 'run', reason: 'Patch target with changed input' };
  }

  return { status: 'run', reason: 'Default' };
}

/**
 * Generate an execution plan without actually running anything
 */
export function generateExecutionPlan(
  nodes: FlowNode[],
  connections: Connection[],
  mode: ExecutionMode,
  appCreated: boolean,
  currentRevision: number
): ExecutionPlan {
  const sortedNodes = topologicalSort(nodes, connections);
  const items: ExecutionPlanItem[] = [];
  let runCount = 0;
  let skipCount = 0;
  let blockedCount = 0;

  for (const node of sortedNodes) {
    const { status, reason } = shouldNodeRun(node, mode, connections, appCreated);
    const inputHash = calculateInputHash(node, connections);

    items.push({
      nodeId: node.id,
      nodeName: node.title,
      status,
      reason,
      inputHash,
      previousHash: node.lastRun?.inputHash,
      actions: node.actions || [],
    });

    switch (status) {
      case 'run': runCount++; break;
      case 'skip': skipCount++; break;
      case 'blocked': blockedCount++; break;
    }
  }

  return {
    id: `plan-${Date.now()}`,
    mode,
    revision: currentRevision,
    items,
    createdAt: Date.now(),
    runCount,
    skipCount,
    blockedCount,
  };
}

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

/**
 * Execute workflow based on a pre-generated plan
 * This provides better control and prevents mid-execution changes
 */
export async function executeWithPlan(
  plan: ExecutionPlan,
  nodes: FlowNode[],
  _connections: Connection[], // Reserved for future dependency validation
  onProgress: ProgressCallback,
  onNodeUpdate: NodeUpdateCallback
): Promise<{ success: boolean; results: ExecutionResult[]; executedNodeIds: string[] }> {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const results: ExecutionResult[] = [];
  const executedNodeIds: string[] = [];
  let hasError = false;

  // Only process items marked as 'run'
  const itemsToRun = plan.items.filter(item => item.status === 'run');
  const totalCount = itemsToRun.length;

  for (let i = 0; i < itemsToRun.length; i++) {
    const planItem = itemsToRun[i];
    const node = nodeMap.get(planItem.nodeId);

    if (!node) {
      results.push({
        nodeId: planItem.nodeId,
        status: 'error',
        message: 'Node not found',
      });
      hasError = true;
      continue;
    }

    // Report progress
    onProgress({
      currentNodeId: node.id,
      completedCount: i,
      totalCount,
      status: 'running',
    });

    // Execute the node
    const result = await executeNode(node);
    result.inputHash = planItem.inputHash;
    results.push(result);
    executedNodeIds.push(node.id);

    // Report node update
    onNodeUpdate(result);

    if (result.status === 'error') {
      hasError = true;
    }
  }

  // Report skipped items
  for (const planItem of plan.items) {
    if (planItem.status !== 'run') {
      results.push({
        nodeId: planItem.nodeId,
        status: planItem.status === 'blocked' ? 'error' : 'done',
        message: planItem.reason,
        inputHash: planItem.inputHash,
      });
    }
  }

  // Final progress report
  onProgress({
    currentNodeId: '',
    completedCount: totalCount,
    totalCount,
    status: hasError ? 'error' : 'completed',
  });

  return {
    success: !hasError,
    results,
    executedNodeIds,
  };
}

/**
 * Get available actions for a node type (UE Blueprint style)
 */
export interface AvailableAction {
  type: string;
  name: string;
  icon: string;
  description: string;
  category: string;
}

export function getAvailableActions(): AvailableAction[] {
  return [
    // プロジェクト作成
    {
      type: 'firebase-create',
      name: 'Firebase Project',
      icon: '🔥',
      description: 'Create Firebase project',
      category: 'Project Setup',
    },
    {
      type: 'github-repo',
      name: 'GitHub Repository',
      icon: '🐙',
      description: 'Create GitHub repository',
      category: 'Project Setup',
    },
    // 開発
    {
      type: 'claude-develop',
      name: 'Claude Code Dev',
      icon: '🤖',
      description: 'Develop app with Claude Code',
      category: 'Development',
    },
    // デプロイ
    {
      type: 'github-deploy',
      name: 'Deploy',
      icon: '🚀',
      description: 'Deploy to GitHub Pages',
      category: 'Deploy',
    },
    // 更新
    {
      type: 'github-pr',
      name: 'Update (PR)',
      icon: '🔄',
      description: 'Create PR for updates',
      category: 'Update',
    },
  ];
}

/**
 * Create a new action with default values
 */
export function createAction(
  type: string,
  availableActions: AvailableAction[]
): import('../types').NodeAction | null {
  const actionDef = availableActions.find(a => a.type === type);
  if (!actionDef) return null;

  // Map type to ActionCategory
  let actionCategory: import('../types').ActionCategory = 'connector-invoke';
  if (type.startsWith('firebase-') || type.startsWith('github-repo')) {
    actionCategory = 'connector-invoke';
  } else if (type.startsWith('claude-')) {
    actionCategory = 'connector-invoke';
  } else if (type.startsWith('github-')) {
    actionCategory = 'connector-invoke';
  }

  return {
    id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: actionCategory,
    name: actionDef.name,
    icon: actionDef.icon,
    enabled: true,
    config: getDefaultConfig(type),
    createdAt: Date.now(),
  };
}

function getDefaultConfig(type: string): Record<string, unknown> {
  switch (type) {
    case 'firebase-create':
      return {
        connectorId: 'firebase',
        actionType: 'create-project',
        parameters: {
          projectName: '',
        },
      };
    case 'github-repo':
      return {
        connectorId: 'github',
        actionType: 'create-repo',
        parameters: {
          repoName: '',
          private: false,
        },
      };
    case 'claude-develop':
      return {
        connectorId: 'claude-code',
        actionType: 'develop',
        parameters: {
          specFile: '',
        },
      };
    case 'github-deploy':
      return {
        connectorId: 'github',
        actionType: 'deploy-pages',
        parameters: {
          branch: 'main',
        },
      };
    case 'github-pr':
      return {
        connectorId: 'github',
        actionType: 'create-pr',
        parameters: {
          title: '',
          body: '',
          baseBranch: 'main',
        },
      };
    default:
      return {};
  }
}
