import { v4 as uuidv4 } from 'uuid';
import type { Workflow, Folder, Connector, AppSettings, CustomCategory, FlowNode, Connection } from '../types';
import { DEFAULT_FOLDERS, DEFAULT_CONNECTORS, DEFAULT_CATEGORIES } from '../types';

const STORAGE_KEYS = {
  WORKFLOWS: 'flowna_workflows',
  FOLDERS: 'flowna_folders',
  CONNECTORS: 'flowna_connectors',
  SETTINGS: 'flowna_settings',
  CATEGORIES: 'flowna_categories',
  CURRENT_WORKFLOW: 'flowna_current_workflow',
};

export function generateId(): string {
  return uuidv4();
}

// Workflow operations
export function saveWorkflow(workflow: Workflow): void {
  const workflows = getWorkflows();
  const existingIndex = workflows.findIndex(w => w.id === workflow.id);

  workflow.updatedAt = Date.now();

  if (existingIndex >= 0) {
    workflows[existingIndex] = workflow;
  } else {
    workflow.createdAt = Date.now();
    workflows.push(workflow);
  }

  localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows));
}

export function getWorkflows(): Workflow[] {
  const data = localStorage.getItem(STORAGE_KEYS.WORKFLOWS);
  return data ? JSON.parse(data) : [];
}

export function getWorkflowById(id: string): Workflow | null {
  const workflows = getWorkflows();
  return workflows.find(w => w.id === id) || null;
}

export function deleteWorkflow(id: string): void {
  const workflows = getWorkflows().filter(w => w.id !== id);
  localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows));
}

export function getWorkflowsByFolder(folderId: string): Workflow[] {
  return getWorkflows().filter(w => w.folderId === folderId);
}

// Current workflow (unsaved state)
export function saveCurrentWorkflowState(nodes: FlowNode[], connections: Connection[], viewport: { panX: number; panY: number; scale: number }): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_WORKFLOW, JSON.stringify({ nodes, connections, viewport }));
}

export function getCurrentWorkflowState(): { nodes: FlowNode[]; connections: Connection[]; viewport: { panX: number; panY: number; scale: number } } | null {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_WORKFLOW);
  return data ? JSON.parse(data) : null;
}

export function clearCurrentWorkflowState(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_WORKFLOW);
}

// Folder operations
export function saveFolders(folders: Folder[]): void {
  localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
}

export function getFolders(): Folder[] {
  const data = localStorage.getItem(STORAGE_KEYS.FOLDERS);
  if (data) {
    return JSON.parse(data);
  }
  // Return default folders if none exist
  saveFolders(DEFAULT_FOLDERS);
  return DEFAULT_FOLDERS;
}

export function addFolder(folder: Folder): void {
  const folders = getFolders();
  folders.push(folder);
  saveFolders(folders);
}

export function updateFolder(folder: Folder): void {
  const folders = getFolders();
  const index = folders.findIndex(f => f.id === folder.id);
  if (index >= 0) {
    folders[index] = { ...folder, updatedAt: Date.now() };
    saveFolders(folders);
  }
}

export function deleteFolder(id: string): void {
  const folders = getFolders().filter(f => f.id !== id);
  saveFolders(folders);
  // Also delete workflows in this folder
  const workflows = getWorkflows().filter(w => w.folderId !== id);
  localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows));
}

// Connector operations
export function saveConnectors(connectors: Connector[]): void {
  localStorage.setItem(STORAGE_KEYS.CONNECTORS, JSON.stringify(connectors));
}

export function getConnectors(): Connector[] {
  const data = localStorage.getItem(STORAGE_KEYS.CONNECTORS);
  if (data) {
    const stored: Connector[] = JSON.parse(data);
    // Merge with DEFAULT_CONNECTORS to get updated icons while preserving user config
    const merged = DEFAULT_CONNECTORS.map(defaultConn => {
      const storedConn = stored.find(s => s.id === defaultConn.id);
      if (storedConn) {
        // Keep user's config/status but update icon from defaults
        return { ...storedConn, icon: defaultConn.icon };
      }
      return defaultConn;
    });
    return merged;
  }
  // Return default connectors if none exist
  saveConnectors(DEFAULT_CONNECTORS);
  return DEFAULT_CONNECTORS;
}

export function updateConnector(connector: Connector): void {
  const connectors = getConnectors();
  const index = connectors.findIndex(c => c.id === connector.id);
  if (index >= 0) {
    connectors[index] = connector;
    saveConnectors(connectors);
  }
}

// Settings operations
export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getSettings(): AppSettings {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (data) {
    return JSON.parse(data);
  }
  const defaultSettings: AppSettings = {
    language: 'en',
    theme: 'dark',
    sidebarWidth: 280,
    defaultFolder: 'folder-config',
    autoSave: true,
    syncInterval: 30000,
  };
  saveSettings(defaultSettings);
  return defaultSettings;
}

// Custom categories
export function saveCategories(categories: CustomCategory[]): void {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
}

export function getCategories(): CustomCategory[] {
  const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (data) {
    return JSON.parse(data);
  }
  saveCategories(DEFAULT_CATEGORIES);
  return DEFAULT_CATEGORIES;
}

export function addCategory(category: CustomCategory): void {
  const categories = getCategories();
  categories.push(category);
  saveCategories(categories);
}

// Generate thumbnail from canvas
export async function generateThumbnail(_canvasElement: HTMLElement): Promise<string> {
  // Simple implementation - in production would use html2canvas or similar
  // The canvasElement parameter will be used when implementing actual thumbnail generation
  return '';
}
