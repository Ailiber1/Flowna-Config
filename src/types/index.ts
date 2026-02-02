export type NodeStatus = 'waiting' | 'done' | 'error';
export type NodeCategory = 'AGENT' | 'LOGIC' | 'SYSTEM' | 'RULE' | string;
export type ConnectorType = 'cicd' | 'ai' | 'storage' | 'custom';
export type ConnectorStatus = 'connected' | 'disconnected' | 'error';

// ===== Create/Patch Mode System =====
export type ExecutionMode = 'create' | 'patch';
export type PlanNodeStatus = 'run' | 'skip' | 'blocked';
export type ActionCategory = 'conditions' | 'patch-target' | 'data-transform' | 'connector-invoke';

// Node Action - UE Blueprint style function assignment
export interface NodeAction {
  id: string;
  type: ActionCategory;
  name: string;
  icon: string;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: number;
}

// Predefined action types
export interface ConditionAction extends NodeAction {
  type: 'conditions';
  config: {
    operator: 'and' | 'or';
    conditions: Array<{
      field: string;
      comparator: '==' | '!=' | '>' | '<' | 'contains';
      value: string;
    }>;
  };
}

export interface PatchTargetAction extends NodeAction {
  type: 'patch-target';
  config: {
    isPatchTarget: boolean;
    targetFiles?: string[];
    targetRange?: string;
  };
}

export interface DataTransformAction extends NodeAction {
  type: 'data-transform';
  config: {
    transformType: 'extract' | 'format' | 'filter';
    expression: string;
  };
}

export interface ConnectorInvokeAction extends NodeAction {
  type: 'connector-invoke';
  config: {
    connectorId: string;
    actionType: string;
    parameters: Record<string, unknown>;
  };
}

// Node execution tracking for idempotency
export interface NodeRunInfo {
  inputHash: string;
  revision: number;
  executedAt: number;
  result: 'success' | 'error' | 'skipped';
}

// Execution plan item
export interface ExecutionPlanItem {
  nodeId: string;
  nodeName: string;
  status: PlanNodeStatus;
  reason: string;
  inputHash: string;
  previousHash?: string;
  actions: NodeAction[];
}

// Execution plan
export interface ExecutionPlan {
  id: string;
  mode: ExecutionMode;
  revision: number;
  items: ExecutionPlanItem[];
  createdAt: number;
  runCount: number;
  skipCount: number;
  blockedCount: number;
}

// Run log entry
export interface RunLogEntry {
  id: string;
  revision: number;
  mode: ExecutionMode;
  executedNodes: string[];
  skippedNodes: string[];
  errorNodes: string[];
  startedAt: number;
  completedAt: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface ConnectorLink {
  connectorId: string;
  resourceId: string;
  resourceName: string;
}

// Attached file to node
export interface AttachedFile {
  name: string;
  content: string;
  type: string; // 'txt' | 'md' | etc.
  uploadedAt: number;
}

export interface FlowNode {
  id: string;
  title: string;
  displayName: string;
  description: string;
  category: NodeCategory;
  categoryDisplayName: string;
  icon: string;
  color: string;
  url: string;
  status: NodeStatus;
  memo: string;
  position: Position;
  connectorLinks: ConnectorLink[];
  createdAt: number;
  updatedAt: number;
  // Create/Patch mode extensions
  actions?: NodeAction[];
  lastRun?: NodeRunInfo;
  runToggle?: boolean; // For Patch mode: ON/SKIP toggle
  // Attached file (specification, etc.)
  attachedFile?: AttachedFile;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  active: boolean;
  label: string;
  createdAt: number;
  type?: 'node-to-node' | 'node-to-connector';
}

export interface ConnectorNode {
  id: string;
  connectorId: string;
  position: Position;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  icon: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface CustomCategory {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  createdAt: number;
}

export interface Viewport {
  panX: number;
  panY: number;
  scale: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  folderId: string;
  nodes: FlowNode[];
  connections: Connection[];
  viewport: Viewport;
  customCategories: CustomCategory[];
  thumbnail: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number;
}

export interface ConnectorConfig {
  apiKey?: string;
  apiEndpoint?: string;
  webhookUrl?: string;
  [key: string]: string | undefined;
}

export interface Connector {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: ConnectorType;
  version: string;
  status: ConnectorStatus;
  config: ConnectorConfig;
  capabilities: string[];
  installedAt: number;
  lastUsedAt: number;
  url?: string;  // Optional URL for quick access (e.g., dashboard, docs)
}

export interface AppSettings {
  language: 'en' | 'ja';
  theme: 'dark';
  sidebarWidth: number;
  defaultFolder: string;
  autoSave: boolean;
  syncInterval: number;
}

export const DEFAULT_CATEGORIES: CustomCategory[] = [
  { id: 'agent', name: 'AGENT', displayName: 'Agent', icon: '🤖', color: '#a78bfa', createdAt: Date.now() },
  { id: 'logic', name: 'LOGIC', displayName: 'Logic', icon: '⚡', color: '#60a5fa', createdAt: Date.now() },
  { id: 'system', name: 'SYSTEM', displayName: 'System', icon: '⚙️', color: '#ff8800', createdAt: Date.now() },
  { id: 'rule', name: 'RULE', displayName: 'Rule', icon: '📋', color: '#4ade80', createdAt: Date.now() },
];

export const DEFAULT_FOLDERS: Folder[] = [];

export const DEFAULT_CONNECTORS: Connector[] = [
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐱',
    description: 'CI/CD integration with GitHub Actions',
    type: 'cicd',
    version: '1.0.0',
    status: 'disconnected',
    config: {},
    capabilities: ['import', 'export', 'sync', 'webhook', 'trigger'],
    installedAt: Date.now(),
    lastUsedAt: 0,
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    icon: '🦀',
    description: 'AI code assistant',
    type: 'ai',
    version: '1.0.0',
    status: 'disconnected',
    config: {},
    capabilities: ['import', 'export'],
    installedAt: Date.now(),
    lastUsedAt: 0,
  },
  {
    id: 'firebase',
    name: 'Firebase',
    icon: '☁️',
    description: 'Backend & data persistence',
    type: 'storage',
    version: '1.0.0',
    status: 'disconnected',
    config: {},
    capabilities: ['import', 'export', 'sync'],
    installedAt: Date.now(),
    lastUsedAt: 0,
  },
  {
    id: 'gemini',
    name: 'Gemini Code',
    icon: '💎',
    description: 'AI code assistance with Gemini',
    type: 'ai',
    version: '1.0.0',
    status: 'disconnected',
    config: {},
    capabilities: ['import', 'export'],
    installedAt: Date.now(),
    lastUsedAt: 0,
  },
  {
    id: 'custom-api',
    name: 'Custom API',
    icon: '🔗',
    description: 'Generic REST API connector',
    type: 'custom',
    version: '1.0.0',
    status: 'disconnected',
    config: {},
    capabilities: ['import', 'export'],
    installedAt: Date.now(),
    lastUsedAt: 0,
  },
];
