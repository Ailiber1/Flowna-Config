import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type {
  FlowNode, Connection, Folder, Connector, CustomCategory, Workflow, AppSettings, Viewport, ConnectorNode,
  ExecutionMode, ExecutionPlan, RunLogEntry, NodeAction
} from '../types';
import { DEFAULT_FOLDERS, DEFAULT_CONNECTORS, DEFAULT_CATEGORIES } from '../types';
import * as storage from '../utils/storage';
import type { Language } from '../utils/i18n';

// History entry for undo functionality
interface HistoryEntry {
  nodes: FlowNode[];
  connections: Connection[];
  connectorNodes: ConnectorNode[];
}

const MAX_HISTORY_SIZE = 50;

interface AppState {
  // Canvas state
  nodes: FlowNode[];
  connections: Connection[];
  connectorNodes: ConnectorNode[];
  viewport: Viewport;
  selectedNodeIds: string[];
  selectedConnectionId: string | null;
  selectedConnectorNodeIds: string[];

  // Clipboard
  clipboard: { nodes: FlowNode[]; connections: Connection[] } | null;

  // App data
  folders: Folder[];
  workflows: Workflow[];
  connectors: Connector[];
  categories: CustomCategory[];

  // Settings
  settings: AppSettings;
  language: Language;

  // UI state
  isAddNodeModalOpen: boolean;
  isEditNodeModalOpen: boolean;
  editingNodeId: string | null;
  isSaveWorkflowModalOpen: boolean;
  isConnectorModalOpen: boolean;
  editingConnectorId: string | null;
  contextMenu: { x: number; y: number; type: 'node' | 'connection' | 'canvas'; targetId: string | null } | null;
  searchQuery: string;
  highlightedNodeIds: string[];

  // Drag state
  isDraggingNode: boolean;
  isCreatingConnection: boolean;
  connectionStartNodeId: string | null;
  ghostLineEnd: { x: number; y: number } | null;

  // Toast
  toast: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;

  // Implementation state
  isImplementing: boolean;

  // Create/Patch mode system
  executionMode: ExecutionMode;
  appCreated: boolean;
  executionPlan: ExecutionPlan | null;
  runLogs: RunLogEntry[];
  currentRevision: number;
  isActionMenuOpen: boolean;
  actionMenuNodeId: string | null;
  actionMenuPosition: { x: number; y: number } | null;

  // Undo history
  history: HistoryEntry[];

  // Current loaded workflow tracking (for overwrite save)
  currentWorkflowId: string | null;
  currentWorkflowName: string | null;
}

type AppAction =
  | { type: 'SET_NODES'; payload: FlowNode[] }
  | { type: 'ADD_NODE'; payload: FlowNode }
  | { type: 'UPDATE_NODE'; payload: FlowNode }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'MOVE_NODE'; payload: { id: string; position: { x: number; y: number } } }
  | { type: 'MOVE_SELECTED_NODES'; payload: { dx: number; dy: number } }
  | { type: 'SET_CONNECTIONS'; payload: Connection[] }
  | { type: 'ADD_CONNECTION'; payload: Connection }
  | { type: 'DELETE_CONNECTION'; payload: string }
  | { type: 'TOGGLE_CONNECTION_ACTIVE'; payload: string }
  | { type: 'SET_VIEWPORT'; payload: Viewport }
  | { type: 'PAN_VIEWPORT'; payload: { dx: number; dy: number } }
  | { type: 'ZOOM_VIEWPORT'; payload: { scale: number; centerX: number; centerY: number } }
  | { type: 'SELECT_NODE'; payload: string }
  | { type: 'SELECT_NODES'; payload: string[] }
  | { type: 'DESELECT_ALL' }
  | { type: 'SELECT_CONNECTION'; payload: string | null }
  | { type: 'SET_FOLDERS'; payload: Folder[] }
  | { type: 'ADD_FOLDER'; payload: Folder }
  | { type: 'UPDATE_FOLDER'; payload: Folder }
  | { type: 'DELETE_FOLDER'; payload: string }
  | { type: 'SET_WORKFLOWS'; payload: Workflow[] }
  | { type: 'ADD_WORKFLOW'; payload: Workflow }
  | { type: 'UPDATE_WORKFLOW'; payload: Workflow }
  | { type: 'DELETE_WORKFLOW'; payload: string }
  | { type: 'SET_CONNECTORS'; payload: Connector[] }
  | { type: 'UPDATE_CONNECTOR'; payload: Connector }
  | { type: 'SET_CATEGORIES'; payload: CustomCategory[] }
  | { type: 'ADD_CATEGORY'; payload: CustomCategory }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'OPEN_ADD_NODE_MODAL' }
  | { type: 'CLOSE_ADD_NODE_MODAL' }
  | { type: 'OPEN_EDIT_NODE_MODAL'; payload: string }
  | { type: 'CLOSE_EDIT_NODE_MODAL' }
  | { type: 'OPEN_SAVE_WORKFLOW_MODAL' }
  | { type: 'CLOSE_SAVE_WORKFLOW_MODAL' }
  | { type: 'OPEN_CONNECTOR_MODAL'; payload: string | null }
  | { type: 'CLOSE_CONNECTOR_MODAL' }
  | { type: 'SET_CONTEXT_MENU'; payload: AppState['contextMenu'] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_HIGHLIGHTED_NODES'; payload: string[] }
  | { type: 'START_DRAGGING_NODE' }
  | { type: 'STOP_DRAGGING_NODE' }
  | { type: 'START_CONNECTION'; payload: string }
  | { type: 'UPDATE_GHOST_LINE'; payload: { x: number; y: number } | null }
  | { type: 'CANCEL_CONNECTION' }
  | { type: 'SHOW_TOAST'; payload: AppState['toast'] }
  | { type: 'HIDE_TOAST' }
  | { type: 'LOAD_WORKFLOW'; payload: Workflow }
  | { type: 'SELECT_ALL_NODES' }
  | { type: 'COPY_SELECTED_NODES' }
  | { type: 'PASTE_NODES' }
  | { type: 'ADD_CONNECTOR_NODE'; payload: ConnectorNode }
  | { type: 'MOVE_CONNECTOR_NODE'; payload: { id: string; position: { x: number; y: number } } }
  | { type: 'MOVE_SELECTED_CONNECTOR_NODES'; payload: { dx: number; dy: number } }
  | { type: 'MOVE_ALL_SELECTED'; payload: { dx: number; dy: number } }
  | { type: 'DELETE_CONNECTOR_NODE'; payload: string }
  | { type: 'DELETE_ALL_SELECTED' }
  | { type: 'SELECT_CONNECTOR_NODE'; payload: string }
  | { type: 'SELECT_CONNECTOR_NODES'; payload: string[] }
  | { type: 'SELECT_ALL' }
  | { type: 'IMPLEMENT_NODES'; payload: { success: boolean; errorNodeIds?: string[] } }
  | { type: 'UPDATE_NODE_STATUS'; payload: { nodeId: string; status: 'waiting' | 'running' | 'done' | 'error' } }
  | { type: 'RESET_NODE_STATUSES' }
  | { type: 'SET_IMPLEMENTING'; payload: boolean }
  // Create/Patch mode actions
  | { type: 'SET_EXECUTION_MODE'; payload: ExecutionMode }
  | { type: 'SET_APP_CREATED'; payload: boolean }
  | { type: 'SET_EXECUTION_PLAN'; payload: ExecutionPlan | null }
  | { type: 'ADD_RUN_LOG'; payload: RunLogEntry }
  | { type: 'CLEAR_RUN_LOGS' }
  | { type: 'INCREMENT_REVISION' }
  | { type: 'TOGGLE_NODE_RUN'; payload: string }
  | { type: 'TOGGLE_CONNECTOR_RUN'; payload: string }
  | { type: 'ADD_NODE_ACTION'; payload: { nodeId: string; action: NodeAction } }
  | { type: 'REMOVE_NODE_ACTION'; payload: { nodeId: string; actionId: string } }
  | { type: 'UPDATE_NODE_ACTION'; payload: { nodeId: string; action: NodeAction } }
  | { type: 'UPDATE_NODE_LAST_RUN'; payload: { nodeId: string; inputHash: string; revision: number; result: 'success' | 'error' | 'skipped' } }
  | { type: 'OPEN_ACTION_MENU'; payload: { nodeId: string; position: { x: number; y: number } } }
  | { type: 'CLOSE_ACTION_MENU' }
  // Current workflow tracking
  | { type: 'SET_CURRENT_WORKFLOW'; payload: { id: string; name: string } | null }
  // Undo
  | { type: 'UNDO' };

const initialState: AppState = {
  nodes: [],
  connections: [],
  connectorNodes: [],
  viewport: { panX: 0, panY: 0, scale: 1 },
  selectedNodeIds: [],
  selectedConnectionId: null,
  selectedConnectorNodeIds: [],
  clipboard: null,
  folders: DEFAULT_FOLDERS,
  workflows: [],
  connectors: DEFAULT_CONNECTORS,
  categories: DEFAULT_CATEGORIES,
  settings: {
    language: 'ja',
    theme: 'dark',
    sidebarWidth: 280,
    defaultFolder: 'folder-workflows',
    autoSave: true,
    syncInterval: 30000,
  },
  language: 'ja',
  isAddNodeModalOpen: false,
  isEditNodeModalOpen: false,
  editingNodeId: null,
  isSaveWorkflowModalOpen: false,
  isConnectorModalOpen: false,
  editingConnectorId: null,
  contextMenu: null,
  searchQuery: '',
  highlightedNodeIds: [],
  isDraggingNode: false,
  isCreatingConnection: false,
  connectionStartNodeId: null,
  ghostLineEnd: null,
  toast: null,
  isImplementing: false,
  // Create/Patch mode system
  executionMode: 'create',
  appCreated: false,
  executionPlan: null,
  runLogs: [],
  currentRevision: 0,
  isActionMenuOpen: false,
  actionMenuNodeId: null,
  actionMenuPosition: null,
  // Undo history
  history: [],
  // Current loaded workflow tracking
  currentWorkflowId: null,
  currentWorkflowName: null,
};

// Helper to push current state to history
function pushHistory(state: AppState): HistoryEntry[] {
  const entry: HistoryEntry = {
    nodes: JSON.parse(JSON.stringify(state.nodes)),
    connections: JSON.parse(JSON.stringify(state.connections)),
    connectorNodes: JSON.parse(JSON.stringify(state.connectorNodes)),
  };
  const newHistory = [...state.history, entry];
  // Keep history size limited
  if (newHistory.length > MAX_HISTORY_SIZE) {
    return newHistory.slice(-MAX_HISTORY_SIZE);
  }
  return newHistory;
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // ===== UNDO =====
    case 'UNDO': {
      if (state.history.length === 0) return state;
      const newHistory = [...state.history];
      const lastEntry = newHistory.pop()!;
      return {
        ...state,
        nodes: lastEntry.nodes,
        connections: lastEntry.connections,
        connectorNodes: lastEntry.connectorNodes,
        selectedNodeIds: [],
        selectedConnectorNodeIds: [],
        selectedConnectionId: null,
        history: newHistory,
      };
    }

    case 'SET_NODES':
      return { ...state, nodes: action.payload };

    case 'ADD_NODE': {
      const history = pushHistory(state);
      return { ...state, nodes: [...state.nodes, action.payload], history };
    }

    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === action.payload.id ? { ...action.payload, updatedAt: Date.now() } : n
        ),
      };

    case 'DELETE_NODE': {
      const history = pushHistory(state);
      return {
        ...state,
        nodes: state.nodes.filter(n => n.id !== action.payload),
        connections: state.connections.filter(
          c => c.from !== action.payload && c.to !== action.payload
        ),
        selectedNodeIds: state.selectedNodeIds.filter(id => id !== action.payload),
        history,
      };
    }

    case 'MOVE_NODE':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === action.payload.id
            ? {
                ...n,
                position: {
                  x: action.payload.position.x,
                  y: action.payload.position.y,
                },
                updatedAt: Date.now(),
              }
            : n
        ),
      };

    case 'MOVE_SELECTED_NODES':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          state.selectedNodeIds.includes(n.id)
            ? {
                ...n,
                position: {
                  x: n.position.x + action.payload.dx,
                  y: n.position.y + action.payload.dy,
                },
                updatedAt: Date.now(),
              }
            : n
        ),
      };

    case 'SET_CONNECTIONS':
      return { ...state, connections: action.payload };

    case 'ADD_CONNECTION': {
      const history = pushHistory(state);
      return { ...state, connections: [...state.connections, action.payload], history };
    }

    case 'DELETE_CONNECTION': {
      const history = pushHistory(state);
      return {
        ...state,
        connections: state.connections.filter(c => c.id !== action.payload),
        selectedConnectionId: state.selectedConnectionId === action.payload ? null : state.selectedConnectionId,
        history,
      };
    }

    case 'TOGGLE_CONNECTION_ACTIVE':
      return {
        ...state,
        connections: state.connections.map(c =>
          c.id === action.payload ? { ...c, active: !c.active } : c
        ),
      };

    case 'SET_VIEWPORT':
      return { ...state, viewport: action.payload };

    case 'PAN_VIEWPORT':
      return {
        ...state,
        viewport: {
          ...state.viewport,
          panX: state.viewport.panX + action.payload.dx,
          panY: state.viewport.panY + action.payload.dy,
        },
      };

    case 'ZOOM_VIEWPORT': {
      const newScale = Math.min(2.0, Math.max(0.3, action.payload.scale));
      return {
        ...state,
        viewport: { ...state.viewport, scale: newScale },
      };
    }

    case 'SELECT_NODE':
      return {
        ...state,
        selectedNodeIds: state.selectedNodeIds.includes(action.payload)
          ? state.selectedNodeIds
          : [...state.selectedNodeIds, action.payload],
        selectedConnectionId: null,
      };

    case 'SELECT_NODES':
      return { ...state, selectedNodeIds: action.payload, selectedConnectionId: null };

    case 'DESELECT_ALL':
      return { ...state, selectedNodeIds: [], selectedConnectorNodeIds: [], selectedConnectionId: null };

    case 'SELECT_CONNECTION':
      return { ...state, selectedConnectionId: action.payload, selectedNodeIds: [], selectedConnectorNodeIds: [] };

    case 'SET_FOLDERS':
      return { ...state, folders: action.payload };

    case 'ADD_FOLDER':
      return { ...state, folders: [...state.folders, action.payload] };

    case 'UPDATE_FOLDER':
      return {
        ...state,
        folders: state.folders.map(f =>
          f.id === action.payload.id ? action.payload : f
        ),
      };

    case 'DELETE_FOLDER':
      return {
        ...state,
        folders: state.folders.filter(f => f.id !== action.payload),
        workflows: state.workflows.filter(w => w.folderId !== action.payload),
      };

    case 'SET_WORKFLOWS':
      return { ...state, workflows: action.payload };

    case 'ADD_WORKFLOW':
      return { ...state, workflows: [...state.workflows, action.payload] };

    case 'UPDATE_WORKFLOW':
      return {
        ...state,
        workflows: state.workflows.map(w =>
          w.id === action.payload.id ? action.payload : w
        ),
      };

    case 'DELETE_WORKFLOW':
      return { ...state, workflows: state.workflows.filter(w => w.id !== action.payload) };

    case 'SET_CONNECTORS':
      return { ...state, connectors: action.payload };

    case 'UPDATE_CONNECTOR':
      return {
        ...state,
        connectors: state.connectors.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };

    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };

    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };

    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.payload,
        settings: { ...state.settings, language: action.payload },
      };

    case 'SET_SETTINGS':
      return { ...state, settings: action.payload, language: action.payload.language };

    case 'OPEN_ADD_NODE_MODAL':
      return { ...state, isAddNodeModalOpen: true };

    case 'CLOSE_ADD_NODE_MODAL':
      return { ...state, isAddNodeModalOpen: false };

    case 'OPEN_EDIT_NODE_MODAL':
      return { ...state, isEditNodeModalOpen: true, editingNodeId: action.payload };

    case 'CLOSE_EDIT_NODE_MODAL':
      return { ...state, isEditNodeModalOpen: false, editingNodeId: null };

    case 'OPEN_SAVE_WORKFLOW_MODAL':
      return { ...state, isSaveWorkflowModalOpen: true };

    case 'CLOSE_SAVE_WORKFLOW_MODAL':
      return { ...state, isSaveWorkflowModalOpen: false };

    case 'OPEN_CONNECTOR_MODAL':
      return { ...state, isConnectorModalOpen: true, editingConnectorId: action.payload };

    case 'CLOSE_CONNECTOR_MODAL':
      return { ...state, isConnectorModalOpen: false, editingConnectorId: null };

    case 'SET_CONTEXT_MENU':
      return { ...state, contextMenu: action.payload };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };

    case 'SET_HIGHLIGHTED_NODES':
      return { ...state, highlightedNodeIds: action.payload };

    case 'START_DRAGGING_NODE':
      return { ...state, isDraggingNode: true };

    case 'STOP_DRAGGING_NODE':
      return { ...state, isDraggingNode: false };

    case 'START_CONNECTION':
      return {
        ...state,
        isCreatingConnection: true,
        connectionStartNodeId: action.payload,
      };

    case 'UPDATE_GHOST_LINE':
      return { ...state, ghostLineEnd: action.payload };

    case 'CANCEL_CONNECTION':
      return {
        ...state,
        isCreatingConnection: false,
        connectionStartNodeId: null,
        ghostLineEnd: null,
      };

    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };

    case 'HIDE_TOAST':
      return { ...state, toast: null };

    case 'LOAD_WORKFLOW':
      return {
        ...state,
        nodes: action.payload.nodes,
        connections: action.payload.connections,
        connectorNodes: action.payload.connectorNodes || [],
        viewport: action.payload.viewport,
        categories: [...DEFAULT_CATEGORIES, ...action.payload.customCategories],
        currentWorkflowId: action.payload.id,
        currentWorkflowName: action.payload.name,
      };

    case 'SELECT_ALL_NODES':
      return {
        ...state,
        selectedNodeIds: state.nodes.map(n => n.id),
        selectedConnectionId: null,
      };

    case 'COPY_SELECTED_NODES': {
      if (state.selectedNodeIds.length === 0) return state;

      const selectedNodes = state.nodes.filter(n => state.selectedNodeIds.includes(n.id));
      const selectedNodeIdSet = new Set(state.selectedNodeIds);

      // Copy connections that are between selected nodes
      const relevantConnections = state.connections.filter(
        c => selectedNodeIdSet.has(c.from) && selectedNodeIdSet.has(c.to)
      );

      return {
        ...state,
        clipboard: {
          nodes: selectedNodes,
          connections: relevantConnections,
        },
      };
    }

    case 'PASTE_NODES': {
      if (!state.clipboard || state.clipboard.nodes.length === 0) return state;

      const history = pushHistory(state);
      const now = Date.now();
      const idMap = new Map<string, string>();

      // Create new nodes with new IDs and offset positions
      const newNodes = state.clipboard.nodes.map((node, index) => {
        const newId = `node-${now}-${index}`;
        idMap.set(node.id, newId);
        return {
          ...node,
          id: newId,
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
          },
          createdAt: now,
          updatedAt: now,
        };
      });

      // Create new connections with mapped IDs
      const newConnections = state.clipboard.connections.map((conn, index) => ({
        ...conn,
        id: `conn-${now}-${index}`,
        from: idMap.get(conn.from) || conn.from,
        to: idMap.get(conn.to) || conn.to,
        createdAt: now,
      }));

      return {
        ...state,
        nodes: [...state.nodes, ...newNodes],
        connections: [...state.connections, ...newConnections],
        selectedNodeIds: newNodes.map(n => n.id),
        history,
      };
    }

    case 'ADD_CONNECTOR_NODE': {
      const history = pushHistory(state);
      return {
        ...state,
        connectorNodes: [...state.connectorNodes, action.payload],
        history,
      };
    }

    case 'MOVE_CONNECTOR_NODE':
      return {
        ...state,
        connectorNodes: state.connectorNodes.map(cn =>
          cn.id === action.payload.id
            ? {
                ...cn,
                position: {
                  x: action.payload.position.x,
                  y: action.payload.position.y,
                },
              }
            : cn
        ),
      };

    case 'MOVE_SELECTED_CONNECTOR_NODES':
      return {
        ...state,
        connectorNodes: state.connectorNodes.map(cn =>
          state.selectedConnectorNodeIds.includes(cn.id)
            ? {
                ...cn,
                position: {
                  x: cn.position.x + action.payload.dx,
                  y: cn.position.y + action.payload.dy,
                },
              }
            : cn
        ),
      };

    case 'MOVE_ALL_SELECTED':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          state.selectedNodeIds.includes(n.id)
            ? {
                ...n,
                position: {
                  x: n.position.x + action.payload.dx,
                  y: n.position.y + action.payload.dy,
                },
                updatedAt: Date.now(),
              }
            : n
        ),
        connectorNodes: state.connectorNodes.map(cn =>
          state.selectedConnectorNodeIds.includes(cn.id)
            ? {
                ...cn,
                position: {
                  x: cn.position.x + action.payload.dx,
                  y: cn.position.y + action.payload.dy,
                },
              }
            : cn
        ),
      };

    case 'DELETE_CONNECTOR_NODE': {
      const history = pushHistory(state);
      return {
        ...state,
        connectorNodes: state.connectorNodes.filter(cn => cn.id !== action.payload),
        connections: state.connections.filter(
          c => c.to !== action.payload && c.from !== action.payload
        ),
        selectedConnectorNodeIds: state.selectedConnectorNodeIds.filter(id => id !== action.payload),
        history,
      };
    }

    case 'DELETE_ALL_SELECTED': {
      const history = pushHistory(state);
      const nodeIdsToDelete = new Set(state.selectedNodeIds);
      const connectorIdsToDelete = new Set(state.selectedConnectorNodeIds);
      return {
        ...state,
        nodes: state.nodes.filter(n => !nodeIdsToDelete.has(n.id)),
        connectorNodes: state.connectorNodes.filter(cn => !connectorIdsToDelete.has(cn.id)),
        connections: state.connections.filter(
          c => !nodeIdsToDelete.has(c.from) && !nodeIdsToDelete.has(c.to) &&
               !connectorIdsToDelete.has(c.from) && !connectorIdsToDelete.has(c.to)
        ),
        selectedNodeIds: [],
        selectedConnectorNodeIds: [],
        selectedConnectionId: null,
        history,
      };
    }

    case 'SELECT_CONNECTOR_NODE':
      return {
        ...state,
        selectedConnectorNodeIds: state.selectedConnectorNodeIds.includes(action.payload)
          ? state.selectedConnectorNodeIds
          : [...state.selectedConnectorNodeIds, action.payload],
        selectedConnectionId: null,
      };

    case 'SELECT_CONNECTOR_NODES':
      return {
        ...state,
        selectedConnectorNodeIds: action.payload,
        selectedConnectionId: null,
      };

    case 'SELECT_ALL':
      return {
        ...state,
        selectedNodeIds: state.nodes.map(n => n.id),
        selectedConnectorNodeIds: state.connectorNodes.map(cn => cn.id),
        selectedConnectionId: null,
      };

    case 'IMPLEMENT_NODES': {
      const { success, errorNodeIds = [] } = action.payload;
      const errorNodeIdSet = new Set(errorNodeIds);
      return {
        ...state,
        nodes: state.nodes.map(n => {
          // Skip RULE nodes (they keep their 'done' status)
          if (n.category.toUpperCase() === 'RULE') return n;
          // Mark error nodes
          if (errorNodeIdSet.has(n.id)) {
            return { ...n, status: 'error' as const, updatedAt: Date.now() };
          }
          // Mark success nodes
          if (success) {
            return { ...n, status: 'done' as const, updatedAt: Date.now() };
          }
          return n;
        }),
      };
    }

    case 'UPDATE_NODE_STATUS':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === action.payload.nodeId
            ? { ...n, status: action.payload.status, updatedAt: Date.now() }
            : n
        ),
      };

    case 'RESET_NODE_STATUSES':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.category.toUpperCase() === 'RULE'
            ? n
            : { ...n, status: 'waiting' as const, updatedAt: Date.now() }
        ),
      };

    case 'SET_IMPLEMENTING':
      return { ...state, isImplementing: action.payload };

    // ===== Create/Patch Mode Actions =====
    case 'SET_EXECUTION_MODE':
      return { ...state, executionMode: action.payload };

    case 'SET_APP_CREATED':
      return { ...state, appCreated: action.payload };

    case 'SET_EXECUTION_PLAN':
      return { ...state, executionPlan: action.payload };

    case 'ADD_RUN_LOG':
      return { ...state, runLogs: [...state.runLogs, action.payload] };

    case 'CLEAR_RUN_LOGS':
      return { ...state, runLogs: [] };

    case 'INCREMENT_REVISION':
      return { ...state, currentRevision: state.currentRevision + 1 };

    case 'TOGGLE_NODE_RUN':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === action.payload
            ? { ...n, runToggle: n.runToggle === undefined ? false : !n.runToggle, updatedAt: Date.now() }
            : n
        ),
      };

    case 'TOGGLE_CONNECTOR_RUN':
      return {
        ...state,
        connectorNodes: state.connectorNodes.map(cn =>
          cn.id === action.payload
            ? { ...cn, runToggle: cn.runToggle === undefined ? false : !cn.runToggle }
            : cn
        ),
      };

    case 'ADD_NODE_ACTION':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === action.payload.nodeId
            ? {
                ...n,
                actions: [...(n.actions || []), action.payload.action],
                updatedAt: Date.now(),
              }
            : n
        ),
      };

    case 'REMOVE_NODE_ACTION':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === action.payload.nodeId
            ? {
                ...n,
                actions: (n.actions || []).filter(a => a.id !== action.payload.actionId),
                updatedAt: Date.now(),
              }
            : n
        ),
      };

    case 'UPDATE_NODE_ACTION':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === action.payload.nodeId
            ? {
                ...n,
                actions: (n.actions || []).map(a =>
                  a.id === action.payload.action.id ? action.payload.action : a
                ),
                updatedAt: Date.now(),
              }
            : n
        ),
      };

    case 'UPDATE_NODE_LAST_RUN':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === action.payload.nodeId
            ? {
                ...n,
                lastRun: {
                  inputHash: action.payload.inputHash,
                  revision: action.payload.revision,
                  executedAt: Date.now(),
                  result: action.payload.result,
                },
                updatedAt: Date.now(),
              }
            : n
        ),
      };

    case 'OPEN_ACTION_MENU':
      return {
        ...state,
        isActionMenuOpen: true,
        actionMenuNodeId: action.payload.nodeId,
        actionMenuPosition: action.payload.position,
      };

    case 'CLOSE_ACTION_MENU':
      return {
        ...state,
        isActionMenuOpen: false,
        actionMenuNodeId: null,
        actionMenuPosition: null,
      };

    case 'SET_CURRENT_WORKFLOW':
      return {
        ...state,
        currentWorkflowId: action.payload?.id || null,
        currentWorkflowName: action.payload?.name || null,
      };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from localStorage on mount (but NOT the current workflow - start fresh)
  useEffect(() => {
    const settings = storage.getSettings();
    const folders = storage.getFolders();
    const workflows = storage.getWorkflows();
    const connectors = storage.getConnectors();
    const categories = storage.getCategories();

    dispatch({ type: 'SET_SETTINGS', payload: settings });
    dispatch({ type: 'SET_FOLDERS', payload: folders });
    dispatch({ type: 'SET_WORKFLOWS', payload: workflows });
    dispatch({ type: 'SET_CONNECTORS', payload: connectors });
    dispatch({ type: 'SET_CATEGORIES', payload: categories });

    // Clear any previously saved current workflow state
    storage.clearCurrentWorkflowState();
  }, []);

  // Save settings when they change
  useEffect(() => {
    storage.saveSettings(state.settings);
  }, [state.settings]);

  // Save workflows to localStorage when they change
  useEffect(() => {
    // Save the current workflows list to localStorage
    localStorage.setItem('flowna_workflows', JSON.stringify(state.workflows));
  }, [state.workflows]);

  // Save folders to localStorage when they change
  useEffect(() => {
    storage.saveFolders(state.folders);
  }, [state.folders]);

  // Save categories to localStorage when they change
  useEffect(() => {
    storage.saveCategories(state.categories);
  }, [state.categories]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
