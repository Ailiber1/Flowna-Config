import { useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { t } from '../utils/i18n';
import { generateId } from '../utils/storage';

export function ContextMenu() {
  const { state, dispatch } = useApp();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dispatch]);

  if (!state.contextMenu) return null;

  const { x, y, type, targetId } = state.contextMenu;
  const node = targetId ? state.nodes.find(n => n.id === targetId) : null;
  const connectorNode = targetId ? state.connectorNodes.find(cn => cn.id === targetId) : null;
  // Connection is available for future use with connection-specific context menu items
  const _connection = targetId ? state.connections.find(c => c.id === targetId) : null;
  void _connection; // Suppress unused warning

  // Determine if this is a connector node context menu - don't show context menu for connectors
  const isConnectorNode = !node && connectorNode;
  if (type === 'node' && isConnectorNode) return null;

  const handleEdit = () => {
    if (targetId) {
      dispatch({ type: 'OPEN_EDIT_NODE_MODAL', payload: targetId });
    }
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  const handleDelete = () => {
    if (type === 'node' && targetId) {
      // Check if it's a connector node or regular node
      if (isConnectorNode) {
        dispatch({ type: 'DELETE_CONNECTOR_NODE', payload: targetId });
        dispatch({
          type: 'SHOW_TOAST',
          payload: { message: state.language === 'ja' ? 'コネクタを削除しました' : 'Connector deleted', type: 'info' },
        });
      } else {
        dispatch({ type: 'DELETE_NODE', payload: targetId });
        dispatch({
          type: 'SHOW_TOAST',
          payload: { message: state.language === 'ja' ? 'ノードを削除しました' : 'Node deleted', type: 'info' },
        });
      }
    } else if (type === 'connection' && targetId) {
      dispatch({ type: 'DELETE_CONNECTION', payload: targetId });
      dispatch({
        type: 'SHOW_TOAST',
        payload: { message: state.language === 'ja' ? '接続を削除しました' : 'Connection deleted', type: 'info' },
      });
    }
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  const handleDuplicate = () => {
    if (node) {
      const newNode = {
        ...node,
        id: generateId(),
        position: {
          x: node.position.x + 30,
          y: node.position.y + 30,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      dispatch({ type: 'ADD_NODE', payload: newNode });
      dispatch({
        type: 'SHOW_TOAST',
        payload: { message: state.language === 'ja' ? 'ノードを複製しました' : 'Node duplicated', type: 'success' },
      });
    }
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  const handleSetStatus = (status: 'waiting' | 'done' | 'error') => {
    if (node) {
      dispatch({
        type: 'UPDATE_NODE',
        payload: { ...node, status, updatedAt: Date.now() },
      });
    }
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  const handleOpenUrl = () => {
    if (node?.url) {
      window.open(node.url, '_blank');
    }
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  const handleToggleActive = () => {
    if (targetId) {
      dispatch({ type: 'TOGGLE_CONNECTION_ACTIVE', payload: targetId });
    }
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  const handleAddNode = () => {
    dispatch({ type: 'OPEN_ADD_NODE_MODAL' });
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  // Open NodeActionMenu (UE Blueprint style)
  const handleAddAction = () => {
    if (targetId) {
      dispatch({
        type: 'OPEN_ACTION_MENU',
        payload: { nodeId: targetId, position: { x: x + 20, y: y + 20 } },
      });
    }
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  // Toggle run for Patch mode
  const handleToggleRun = () => {
    if (targetId) {
      dispatch({ type: 'TOGGLE_NODE_RUN', payload: targetId });
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: state.language === 'ja'
            ? (node?.runToggle === false ? '実行を有効化しました' : '実行をスキップに設定しました')
            : (node?.runToggle === false ? 'Enabled execution' : 'Set to skip'),
          type: 'info',
        },
      });
    }
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  // Position adjustment to keep menu in viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {type === 'node' && !isConnectorNode && (
        <>
          <div className="context-menu-item" onClick={handleEdit}>
            ✏️ {t('edit', state.language)}
          </div>
          <div className="context-menu-item" onClick={handleDuplicate}>
            📋 {t('duplicateNode', state.language)}
          </div>
          <div className="context-menu-divider" />
          {/* UE Blueprint style - Add Action */}
          <div className="context-menu-item action-menu-trigger" onClick={handleAddAction}>
            🔍 {state.language === 'ja' ? 'アクションを追加...' : 'Add Action...'}
          </div>
          {/* Patch mode - Toggle Run/Skip */}
          {state.executionMode === 'patch' && (
            <div className="context-menu-item" onClick={handleToggleRun}>
              {node?.runToggle === false ? '▶️' : '⏸️'}
              {' '}
              {state.language === 'ja'
                ? (node?.runToggle === false ? 'RUN に設定' : 'SKIP に設定')
                : (node?.runToggle === false ? 'Set to RUN' : 'Set to SKIP')}
            </div>
          )}
          {node?.actions && node.actions.length > 0 && (
            <div className="context-menu-info">
              📌 {node.actions.length} {state.language === 'ja' ? 'アクション設定済み' : 'actions configured'}
            </div>
          )}
          <div className="context-menu-divider" />
          <div className="context-menu-item" onClick={() => handleSetStatus('waiting')}>
            ⬜ {t('waiting', state.language)}
          </div>
          <div className="context-menu-item" onClick={() => handleSetStatus('done')}>
            ✅ {t('done', state.language)}
          </div>
          <div className="context-menu-item" onClick={() => handleSetStatus('error')}>
            ❌ {t('error', state.language)}
          </div>
          <div className="context-menu-divider" />
          <div
            className={`context-menu-item ${!node?.url ? 'disabled' : ''}`}
            onClick={node?.url ? handleOpenUrl : undefined}
          >
            🔗 {t('openUrl', state.language)}
          </div>
          <div className="context-menu-divider" />
          <div className="context-menu-item danger" onClick={handleDelete}>
            🗑️ {t('deleteNode', state.language)}
          </div>
        </>
      )}


      {type === 'connection' && (
        <>
          <div className="context-menu-item" onClick={handleToggleActive}>
            ⚡ {t('toggleActive', state.language)}
          </div>
          <div className="context-menu-divider" />
          <div className="context-menu-item danger" onClick={handleDelete}>
            🗑️ {t('deleteConnection', state.language)}
          </div>
        </>
      )}

      {type === 'canvas' && (
        <>
          <div className="context-menu-item" onClick={handleAddNode}>
            ➕ {t('addNode', state.language)}
          </div>
        </>
      )}
    </div>
  );
}
