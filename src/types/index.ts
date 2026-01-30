export type NodeStatus = 'todo' | 'doing' | 'done';
export type NodeCategory = 'AGENT' | 'LOGIC' | 'SYSTEM' | 'RULE' | string;
export type ConnectorType = 'cicd' | 'ai' | 'storage' | 'custom';
export type ConnectorStatus = 'connected' | 'disconnected' | 'error';

export interface Position {
  x: number;
  y: number;
}

export interface ConnectorLink {
  connectorId: string;
  resourceId: string;
  resourceName: string;
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
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  active: boolean;
  label: string;
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

export const DEFAULT_FOLDERS: Folder[] = [
  { id: 'folder-config', name: '構成', parentId: null, icon: '📁', order: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'folder-connect', name: '接続', parentId: null, icon: '📁', order: 2, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'folder-module', name: 'モジュール', parentId: null, icon: '📁', order: 3, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'folder-input', name: 'Data Input', parentId: null, icon: '📁', order: 4, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'folder-user', name: 'ユーザード', parentId: null, icon: '📁', order: 5, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'folder-owner', name: 'オーナー', parentId: null, icon: '📁', order: 6, createdAt: Date.now(), updatedAt: Date.now() },
];

export const DEFAULT_CONNECTORS: Connector[] = [
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
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
    icon: '⚡',
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
