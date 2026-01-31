import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { t } from '../utils/i18n';
import type { Workflow, Connector } from '../types';

export function Sidebar() {
  const { state, dispatch } = useApp();
  const [workflowsExpanded, setWorkflowsExpanded] = useState(false);
  const [connectorsExpanded, setConnectorsExpanded] = useState(false);

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
          <span className="sidebar-logo-title">フローナ</span>
          <span className="sidebar-logo-subtitle">設定ビジュアライザー</span>
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

      {/* Node Palette */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="sidebar-section-title">
            {state.language === 'ja' ? 'ノードパレット' : 'Node Palette'}
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
