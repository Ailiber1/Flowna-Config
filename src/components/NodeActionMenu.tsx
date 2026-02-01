import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from '../utils/i18n';
import { getAvailableActions, createAction, type AvailableAction } from '../services/workflowEngine';
import type { NodeAction } from '../types';

export default function NodeActionMenu() {
  const { state, dispatch } = useApp();
  const { t } = useTranslation(state.language);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const availableActions = useMemo(() => getAvailableActions(), []);

  // Get the current node
  const currentNode = useMemo(() => {
    if (!state.actionMenuNodeId) return null;
    return state.nodes.find(n => n.id === state.actionMenuNodeId);
  }, [state.actionMenuNodeId, state.nodes]);

  // Filter actions based on search
  const filteredActions = useMemo(() => {
    if (!searchQuery.trim()) return availableActions;
    const query = searchQuery.toLowerCase();
    return availableActions.filter(
      action =>
        action.name.toLowerCase().includes(query) ||
        action.description.toLowerCase().includes(query) ||
        action.category.toLowerCase().includes(query)
    );
  }, [searchQuery, availableActions]);

  // Group actions by category
  const groupedActions = useMemo(() => {
    const groups: Record<string, AvailableAction[]> = {};
    for (const action of filteredActions) {
      if (!groups[action.category]) {
        groups[action.category] = [];
      }
      groups[action.category].push(action);
    }
    return groups;
  }, [filteredActions]);

  // Focus input on open
  useEffect(() => {
    if (state.isActionMenuOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state.isActionMenuOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    if (state.isActionMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [state.isActionMenuOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.isActionMenuOpen) return;

      switch (e.key) {
        case 'Escape':
          handleClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filteredActions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredActions[selectedIndex]) {
            handleAddAction(filteredActions[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.isActionMenuOpen, filteredActions, selectedIndex]);

  const handleClose = () => {
    dispatch({ type: 'CLOSE_ACTION_MENU' });
    setSearchQuery('');
    setSelectedIndex(0);
  };

  const handleAddAction = (actionDef: AvailableAction) => {
    if (!state.actionMenuNodeId) return;

    const newAction = createAction(actionDef.type, availableActions);
    if (newAction) {
      dispatch({
        type: 'ADD_NODE_ACTION',
        payload: { nodeId: state.actionMenuNodeId, action: newAction },
      });
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: `${t('actionAdded') || 'Added'}: ${actionDef.name}`,
          type: 'success',
        },
      });
    }
    handleClose();
  };

  const handleRemoveAction = (actionId: string) => {
    if (!state.actionMenuNodeId) return;

    dispatch({
      type: 'REMOVE_NODE_ACTION',
      payload: { nodeId: state.actionMenuNodeId, actionId },
    });
    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        message: t('actionRemoved') || 'Action removed',
        type: 'info',
      },
    });
  };

  const handleToggleAction = (action: NodeAction) => {
    if (!state.actionMenuNodeId) return;

    dispatch({
      type: 'UPDATE_NODE_ACTION',
      payload: {
        nodeId: state.actionMenuNodeId,
        action: { ...action, enabled: !action.enabled },
      },
    });
  };

  if (!state.isActionMenuOpen || !state.actionMenuPosition) return null;

  const nodeActions = currentNode?.actions || [];

  return (
    <div
      ref={menuRef}
      className="node-action-menu"
      style={{
        left: state.actionMenuPosition.x,
        top: state.actionMenuPosition.y,
      }}
    >
      {/* Search Box */}
      <div className="action-search-box">
        <span className="search-icon">🔍</span>
        <input
          ref={inputRef}
          type="text"
          className="action-search-input"
          placeholder={t('searchActions') || 'Search actions...'}
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            setSelectedIndex(0);
          }}
        />
      </div>

      {/* Current Node Actions */}
      {nodeActions.length > 0 && (
        <div className="current-actions-section">
          <div className="section-header">
            <span className="section-icon">📌</span>
            <span>{t('currentActions') || 'Current Actions'}</span>
          </div>
          <div className="current-actions-list">
            {nodeActions.map(action => (
              <div key={action.id} className={`current-action-item ${action.enabled ? '' : 'disabled'}`}>
                <span className="action-icon">{action.icon}</span>
                <span className="action-name">{action.name}</span>
                <div className="action-controls">
                  <button
                    className="toggle-btn"
                    onClick={() => handleToggleAction(action)}
                    title={action.enabled ? 'Disable' : 'Enable'}
                  >
                    {action.enabled ? '✓' : '○'}
                  </button>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveAction(action.id)}
                    title={t('removeAction') || 'Remove'}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="action-menu-divider" />

      {/* Available Actions */}
      <div className="available-actions-section">
        <div className="section-header">
          <span className="section-icon">➕</span>
          <span>{t('addAction') || 'Add Action'}</span>
        </div>

        {Object.entries(groupedActions).map(([category, actions]) => (
          <div key={category} className="action-category">
            <div className="category-header">{category}</div>
            <div className="category-actions">
              {actions.map((action) => {
                const globalIndex = filteredActions.indexOf(action);
                return (
                  <div
                    key={action.type}
                    className={`action-option ${globalIndex === selectedIndex ? 'selected' : ''}`}
                    onClick={() => handleAddAction(action)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <span className="action-icon">{action.icon}</span>
                    <div className="action-info">
                      <span className="action-name">{action.name}</span>
                      <span className="action-desc">{action.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredActions.length === 0 && (
          <div className="no-actions-found">
            {t('noActionsFound') || 'No actions found'}
          </div>
        )}
      </div>
    </div>
  );
}
