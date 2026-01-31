import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { t } from '../utils/i18n';
import { generateId } from '../utils/storage';
import type { Workflow, Connector, FlowNode, ConnectorNode, CustomCategory } from '../types';

export function Sidebar() {
  const { state, dispatch } = useApp();
  const [workflowsExpanded, setWorkflowsExpanded] = useState(false);
  const [nodePaletteExpanded, setNodePaletteExpanded] = useState(false);
  const [connectorsExpanded, setConnectorsExpanded] = useState(false);

  const handleWorkflowClick = (workflow: Workflow) => {
    dispatch({ type: 'LOAD_WORKFLOW', payload: workflow });
    dispatch({
      type: 'SHOW_TOAST',
      payload: { message: `Loaded "${workflow.name}"`, type: 'success' },
    });
  };

  const handleConnectorConfigClick = (connector: Connector) => {
    dispatch({ type: 'OPEN_CONNECTOR_MODAL', payload: connector.id });
  };

  // Click to add node to canvas
  const handlePaletteItemClick = (category: CustomCategory) => {
    const newNode: FlowNode = {
      id: generateId(),
      title: category.displayName,
      displayName: category.displayName,
      description: '',
      category: category.name,
      categoryDisplayName: category.displayName,
      icon: category.icon,
      color: category.color,
      url: '',
      status: 'todo',
      memo: '',
      position: {
        x: Math.max(0, (window.innerWidth / 2 - 280 - 110 - state.viewport.panX) / state.viewport.scale),
        y: Math.max(0, (window.innerHeight / 2 - 80 - state.viewport.panY) / state.viewport.scale),
      },
      connectorLinks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    dispatch({ type: 'ADD_NODE', payload: newNode });
    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        message: state.language === 'ja' ? `${category.displayName}ノードを追加しました` : `Added ${category.displayName} node`,
        type: 'success',
      },
    });
  };

  // Click to add connector node to canvas
  const handleConnectorClick = (connector: Connector) => {
    const newConnectorNode: ConnectorNode = {
      id: `cnode-${Date.now()}`,
      connectorId: connector.id,
      position: {
        x: Math.max(0, (window.innerWidth / 2 - 280 - 32 - state.viewport.panX) / state.viewport.scale),
        y: Math.max(0, (window.innerHeight / 2 - 32 - state.viewport.panY) / state.viewport.scale),
      },
      createdAt: Date.now(),
    };

    dispatch({ type: 'ADD_CONNECTOR_NODE', payload: newConnectorNode });
    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        message: state.language === 'ja' ? `${connector.name}を追加しました` : `Added ${connector.name}`,
        type: 'success',
      },
    });
  };

  const handleDeleteWorkflow = (e: React.MouseEvent, workflowId: string) => {
    e.stopPropagation();
    if (confirm(state.language === 'ja' ? 'このワークフローを削除しますか？' : 'Delete this workflow?')) {
      dispatch({ type: 'DELETE_WORKFLOW', payload: workflowId });
    }
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">F</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">
            {state.language === 'ja' ? 'フローナ' : 'FLOWNA'}
          </span>
          <span className="sidebar-logo-subtitle">
            {state.language === 'ja' ? '設定ビジュアライザー' : 'CONFIG VISUALIZER'}
          </span>
        </div>
      </div>

      {/* Saved Workflows Section - Dropdown */}
      <div className="sidebar-section">
        <div
          className="sidebar-section-header clickable"
          onClick={() => setWorkflowsExpanded(!workflowsExpanded)}
        >
          <span className="sidebar-section-title">
            {state.language === 'ja' ? '保存済みワークフロー' : 'Saved Workflows'}
          </span>
          <span className={`sidebar-section-toggle ${!workflowsExpanded ? 'collapsed' : ''}`}>
            ▾
          </span>
        </div>
        <div className={`sidebar-section-content ${!workflowsExpanded ? 'collapsed' : ''}`}>
          {state.workflows.length === 0 ? (
            <div className="sidebar-empty-message">
              {state.language === 'ja' ? 'ワークフローがありません' : 'No saved workflows'}
            </div>
          ) : (
            state.workflows.map(workflow => (
              <div
                key={workflow.id}
                className="workflow-item"
                onClick={() => handleWorkflowClick(workflow)}
              >
                <span className="workflow-item-icon">📁</span>
                <span className="workflow-item-title">{workflow.name}</span>
                <button
                  className="workflow-delete-btn"
                  onClick={(e) => handleDeleteWorkflow(e, workflow.id)}
                  title={state.language === 'ja' ? '削除' : 'Delete'}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Node Palette - Dropdown */}
      <div className="sidebar-section">
        <div
          className="sidebar-section-header clickable"
          onClick={() => setNodePaletteExpanded(!nodePaletteExpanded)}
        >
          <span className="sidebar-section-title">
            {state.language === 'ja' ? 'ノードパレット' : 'Node Palette'}
          </span>
          <span className={`sidebar-section-toggle ${!nodePaletteExpanded ? 'collapsed' : ''}`}>
            ▾
          </span>
        </div>
        <div className={`sidebar-section-content ${!nodePaletteExpanded ? 'collapsed' : ''}`}>
          <div className="node-palette">
            {state.categories.map(category => (
              <div
                key={category.id}
                className={`palette-item ${category.name.toLowerCase()}`}
                onClick={() => handlePaletteItemClick(category)}
              >
                <span className="palette-item-icon">{category.icon}</span>
                <span className="palette-item-text">
                  {state.language === 'ja' ? getCategoryJapaneseName(category.name) : category.displayName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connectors Section - Dropdown (collapsed by default) */}
      <div className="sidebar-section">
        <div
          className="sidebar-section-header clickable"
          onClick={() => setConnectorsExpanded(!connectorsExpanded)}
        >
          <span className="sidebar-section-title">
            {t('connectors', state.language)}
          </span>
          <span className={`sidebar-section-toggle ${!connectorsExpanded ? 'collapsed' : ''}`}>
            ▾
          </span>
        </div>
        <div className={`sidebar-section-content ${!connectorsExpanded ? 'collapsed' : ''}`}>
          {state.connectors.map(connector => (
            <div
              key={connector.id}
              className="connector-item"
              onClick={() => handleConnectorClick(connector)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleConnectorConfigClick(connector);
              }}
              title={state.language === 'ja' ? 'クリックで追加 / 右クリックで設定' : 'Click to add / Right-click for settings'}
            >
              <span className="connector-item-icon">{connector.icon}</span>
              <span className="connector-item-name">{connector.name}</span>
              <span className={`connector-item-status ${connector.status}`} />
            </div>
          ))}
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
