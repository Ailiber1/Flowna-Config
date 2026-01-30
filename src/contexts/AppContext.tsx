import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { FlowNode, Connection, Folder, Connector, CustomCategory, Workflow, AppSettings, Viewport } from '../types';
import { DEFAULT_FOLDERS, DEFAULT_CONNECTORS, DEFAULT_CATEGORIES } from '../types';
import * as storage from '../utils/storage';
import type { Language } from '../utils/i18n';

interface AppState {
  // Canvas state
  nodes: FlowNode[];
  connections: Connection[];
  viewport: Viewport;
  selectedNodeIds: string[];
  selectedConnectionId: string | null;

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
}

type AppAction =
  | { type: 'SET_NODES'; payload: FlowNode[] }
  | { type: 'ADD_NODE'; payload: FlowNode }
  | { type: 'UPDATE_NODE'; payload: FlowNode }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'MOVE_NODE'; payload: { id: string; position: { x: number; y: number } } }
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
  | { type: 'LOAD_WORKFLOW'; payload: Workflow };

const initialState: AppState = {
  nodes: [],
  connections: [],
  viewport: { panX: 0, panY: 0, scale: 1 },
  selectedNodeIds: [],
  selectedConnectionId: null,
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
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_NODES':
      return { ...state, nodes: action.payload };

    case 'ADD_NODE':
      return { ...state, nodes: [...state.nodes, action.payload] };

    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === action.payload.id ? { ...action.payload, updatedAt: Date.now() } : n
        ),
      };

    case 'DELETE_NODE':
      return {
        ...state,
        nodes: state.nodes.filter(n => n.id !== action.payload),
        connections: state.connections.filter(
          c => c.from !== action.payload && c.to !== action.payload
        ),
        selectedNodeIds: state.selectedNodeIds.filter(id => id !== action.payload),
      };

    case 'MOVE_NODE':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === action.payload.id ? { ...n, position: action.payload.position, updatedAt: Date.now() } : n
        ),
      };

    case 'SET_CONNECTIONS':
      return { ...state, connections: action.payload };

    case 'ADD_CONNECTION':
      return { ...state, connections: [...state.connections, action.payload] };

    case 'DELETE_CONNECTION':
      return {
        ...state,
        connections: state.connections.filter(c => c.id !== action.payload),
        selectedConnectionId: state.selectedConnectionId === action.payload ? null : state.selectedConnectionId,
      };

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
      return { ...state, selectedNodeIds: [], selectedConnectionId: null };

    case 'SELECT_CONNECTION':
      return { ...state, selectedConnectionId: action.payload, selectedNodeIds: [] };

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
        viewport: action.payload.viewport,
        categories: [...DEFAULT_CATEGORIES, ...action.payload.customCategories],
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

  // Load data from localStorage on mount
  useEffect(() => {
    const settings = storage.getSettings();
    const folders = storage.getFolders();
    const workflows = storage.getWorkflows();
    const connectors = storage.getConnectors();
    const categories = storage.getCategories();
    const currentWorkflow = storage.getCurrentWorkflowState();

    dispatch({ type: 'SET_SETTINGS', payload: settings });
    dispatch({ type: 'SET_FOLDERS', payload: folders });
    dispatch({ type: 'SET_WORKFLOWS', payload: workflows });
    dispatch({ type: 'SET_CONNECTORS', payload: connectors });
    dispatch({ type: 'SET_CATEGORIES', payload: categories });

    if (currentWorkflow) {
      dispatch({ type: 'SET_NODES', payload: currentWorkflow.nodes });
      dispatch({ type: 'SET_CONNECTIONS', payload: currentWorkflow.connections });
      dispatch({ type: 'SET_VIEWPORT', payload: currentWorkflow.viewport });
    }
  }, []);

  // Auto-save current state
  useEffect(() => {
    if (state.settings.autoSave && (state.nodes.length > 0 || state.connections.length > 0)) {
      storage.saveCurrentWorkflowState(state.nodes, state.connections, state.viewport);
    }
  }, [state.nodes, state.connections, state.viewport, state.settings.autoSave]);

  // Save settings when they change
  useEffect(() => {
    storage.saveSettings(state.settings);
  }, [state.settings]);

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
