import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { t } from '../utils/i18n';
import type { Folder, Workflow, Connector } from '../types';

export function Sidebar() {
  const { state, dispatch } = useApp();
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [connectorsExpanded, setConnectorsExpanded] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['folder-config']));

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleWorkflowClick = (workflow: Workflow) => {
    dispatch({ type: 'LOAD_WORKFLOW', payload: workflow });
    dispatch({
      type: 'SHOW_TOAST',
      payload: { message: `Loaded "${workflow.name}"`, type: 'success' },
    });
  };

  const handleConnectorClick = (connector: Connector) => {
    dispatch({ type: 'OPEN_CONNECTOR_MODAL', payload: connector.id });
  };

  const handleLanguageChange = (lang: 'en' | 'ja') => {
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">F</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">FLOWNA</span>
          <span className="sidebar-logo-subtitle">CONFIG VISUALIZER</span>
        </div>
      </div>

      {/* Folders Section */}
      <div className="sidebar-section">
        <div
          className="sidebar-section-header"
          onClick={() => setFoldersExpanded(!foldersExpanded)}
        >
          <span className="sidebar-section-title">
            {t('folders', state.language)}
          </span>
          <span className={`sidebar-section-toggle ${!foldersExpanded ? 'collapsed' : ''}`}>
            ▾
          </span>
        </div>
        <div className={`sidebar-section-content ${!foldersExpanded ? 'collapsed' : ''}`}>
          {state.folders.map(folder => (
            <FolderItem
              key={folder.id}
              folder={folder}
              workflows={state.workflows.filter(w => w.folderId === folder.id)}
              isExpanded={expandedFolders.has(folder.id)}
              onToggle={() => toggleFolder(folder.id)}
              onWorkflowClick={handleWorkflowClick}
            />
          ))}
        </div>
      </div>

      {/* Node Palette */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="sidebar-section-title">
            ノードパレット
          </span>
        </div>
        <div className="node-palette">
          {state.categories.map(category => (
            <div
              key={category.id}
              className={`palette-item ${category.name.toLowerCase()}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('category', JSON.stringify(category));
              }}
            >
              <span className="palette-item-icon">{category.icon}</span>
              <span className="palette-item-text">
                {state.language === 'ja' ? getCategoryJapaneseName(category.name) : category.displayName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Connectors Section */}
      <div className="sidebar-section">
        <div
          className="sidebar-section-header"
          onClick={() => setConnectorsExpanded(!connectorsExpanded)}
        >
          <span className="sidebar-section-title">
            {t('connectors', state.language)}
          </span>
          <button
            className="sidebar-add-btn"
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: 'OPEN_CONNECTOR_MODAL', payload: null });
            }}
          >
            +
          </button>
        </div>
        <div className={`sidebar-section-content ${!connectorsExpanded ? 'collapsed' : ''}`}>
          {state.connectors.map(connector => (
            <div
              key={connector.id}
              className="connector-item"
              onClick={() => handleConnectorClick(connector)}
            >
              <span className="connector-item-icon">{connector.icon}</span>
              <span className="connector-item-name">{connector.name}</span>
              <span className={`connector-item-status ${connector.status}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Language Toggle */}
      <div className="language-toggle">
        <div className="language-toggle-container">
          <button
            className={`language-toggle-btn ${state.language === 'en' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('en')}
          >
            EN
          </button>
          <button
            className={`language-toggle-btn ${state.language === 'ja' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('ja')}
          >
            JP
          </button>
        </div>
      </div>
    </aside>
  );
}

function getCategoryJapaneseName(name: string): string {
  const nameMap: Record<string, string> = {
    'AGENT': 'エージェント（紫）',
    'LOGIC': 'ロジック（ブルー）',
    'SYSTEM': 'システム（オレンジ）',
    'RULE': 'ルール（緑）',
  };
  return nameMap[name] || name;
}

interface FolderItemProps {
  folder: Folder;
  workflows: Workflow[];
  isExpanded: boolean;
  onToggle: () => void;
  onWorkflowClick: (workflow: Workflow) => void;
}

function FolderItem({ folder, workflows, isExpanded, onToggle, onWorkflowClick }: FolderItemProps) {
  return (
    <div>
      <div
        className={`folder-item ${isExpanded ? 'selected' : ''}`}
        onClick={onToggle}
      >
        <span className="folder-item-icon">{folder.icon}</span>
        <span className="folder-item-name">{folder.name}</span>
        {workflows.length > 0 && (
          <span className="folder-item-count">{workflows.length}</span>
        )}
      </div>
      {isExpanded && workflows.length > 0 && (
        <div>
          {workflows.map(workflow => (
            <div
              key={workflow.id}
              className="workflow-item"
              onClick={() => onWorkflowClick(workflow)}
            >
              <span className="workflow-item-title">{workflow.name}</span>
              <span className="workflow-item-meta">
                {workflow.nodes.length} nodes, {workflow.connections.length} edges
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
