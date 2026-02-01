import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { t } from '../utils/i18n';
import { executeWorkflow, validateWorkflow } from '../services/workflowEngine';

export function TopBar() {
  const { state, dispatch } = useApp();
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = useCallback((query: string) => {
    setSearchValue(query);
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });

    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      const matchedNodeIds = state.nodes
        .filter(node =>
          node.title.toLowerCase().includes(lowerQuery) ||
          node.displayName.toLowerCase().includes(lowerQuery) ||
          node.description.toLowerCase().includes(lowerQuery) ||
          node.memo.toLowerCase().includes(lowerQuery) ||
          node.category.toLowerCase().includes(lowerQuery)
        )
        .map(node => node.id);

      dispatch({ type: 'SET_HIGHLIGHTED_NODES', payload: matchedNodeIds });

      // Pan to first result
      if (matchedNodeIds.length > 0) {
        const firstNode = state.nodes.find(n => n.id === matchedNodeIds[0]);
        if (firstNode) {
          dispatch({
            type: 'SET_VIEWPORT',
            payload: {
              ...state.viewport,
              panX: -firstNode.position.x + window.innerWidth / 2 - 110,
              panY: -firstNode.position.y + window.innerHeight / 2 - 80,
            },
          });
        }
      }
    } else {
      dispatch({ type: 'SET_HIGHLIGHTED_NODES', payload: [] });
    }
  }, [state.nodes, state.viewport, dispatch]);

  const handleAddNode = () => {
    dispatch({ type: 'OPEN_ADD_NODE_MODAL' });
  };

  const handleSaveWorkflow = () => {
    dispatch({ type: 'OPEN_SAVE_WORKFLOW_MODAL' });
  };

  const handleFitToScreen = () => {
    if (state.nodes.length === 0) return;

    const minX = Math.min(...state.nodes.map(n => n.position.x));
    const maxX = Math.max(...state.nodes.map(n => n.position.x + 220));
    const minY = Math.min(...state.nodes.map(n => n.position.y));
    const maxY = Math.max(...state.nodes.map(n => n.position.y + 165));

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const canvasWidth = window.innerWidth - 280;
    const canvasHeight = window.innerHeight - 60;

    const scaleX = (canvasWidth - 100) / contentWidth;
    const scaleY = (canvasHeight - 100) / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    const panX = (canvasWidth - contentWidth * scale) / 2 - minX * scale;
    const panY = (canvasHeight - contentHeight * scale) / 2 - minY * scale;

    dispatch({
      type: 'SET_VIEWPORT',
      payload: { panX, panY, scale },
    });
  };

  // Clear search on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchValue) {
        handleSearch('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchValue, handleSearch]);

  const handleLanguageToggle = () => {
    dispatch({ type: 'SET_LANGUAGE', payload: state.language === 'ja' ? 'en' : 'ja' });
  };

  const handleImplement = async () => {
    if (state.nodes.length === 0) {
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: state.language === 'ja' ? 'ノードがありません。' : 'No nodes to implement.',
          type: 'warning',
        },
      });
      return;
    }

    if (state.isImplementing) {
      return; // Already implementing
    }

    // Validate workflow
    const errors = validateWorkflow(state.nodes, state.connections);
    if (errors.length > 0) {
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: state.language === 'ja' ? 'ワークフローにエラーがあります' : 'Workflow has validation errors',
          type: 'error',
        },
      });
      return;
    }

    // Reset node statuses before starting
    dispatch({ type: 'RESET_NODE_STATUSES' });
    dispatch({ type: 'SET_IMPLEMENTING', payload: true });

    // Show implementation progress
    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        message: state.language === 'ja' ? 'ワークフローを実装中...' : 'Implementing workflow...',
        type: 'info',
      },
    });

    try {
      const result = await executeWorkflow(
        state.nodes,
        state.connections,
        // Progress callback
        (progress) => {
          if (progress.status === 'running') {
            const node = state.nodes.find(n => n.id === progress.currentNodeId);
            if (node) {
              dispatch({
                type: 'SHOW_TOAST',
                payload: {
                  message: state.language === 'ja'
                    ? `実行中: ${node.title} (${progress.completedCount + 1}/${progress.totalCount})`
                    : `Executing: ${node.title} (${progress.completedCount + 1}/${progress.totalCount})`,
                  type: 'info',
                },
              });
            }
          }
        },
        // Node update callback
        (nodeResult) => {
          dispatch({
            type: 'UPDATE_NODE_STATUS',
            payload: {
              nodeId: nodeResult.nodeId,
              status: nodeResult.status,
            },
          });
        }
      );

      dispatch({ type: 'SET_IMPLEMENTING', payload: false });

      if (result.success) {
        dispatch({
          type: 'SHOW_TOAST',
          payload: {
            message: state.language === 'ja' ? '実装が完了しました' : 'Implementation completed successfully',
            type: 'success',
          },
        });
      } else {
        const errorCount = result.results.filter(r => r.status === 'error').length;
        dispatch({
          type: 'SHOW_TOAST',
          payload: {
            message: state.language === 'ja'
              ? `実装完了 (${errorCount}件のエラー)`
              : `Implementation completed with ${errorCount} error(s)`,
            type: 'warning',
          },
        });
      }
    } catch (error) {
      dispatch({ type: 'SET_IMPLEMENTING', payload: false });
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: state.language === 'ja' ? '実装中にエラーが発生しました' : 'Error occurred during implementation',
          type: 'error',
        },
      });
      console.error('Implementation error:', error);
    }
  };

  return (
    <div className="topbar">
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder={t('searchPlaceholder', state.language)}
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="topbar-actions">
        <button className="topbar-btn" onClick={handleFitToScreen}>
          📐 {state.language === 'ja' ? 'フィット' : 'Fit'}
        </button>
        <button className="topbar-btn" onClick={handleAddNode}>
          ➕ {t('addNode', state.language)}
        </button>
        <button
          className={`topbar-btn implement ${state.isImplementing ? 'implementing' : ''}`}
          onClick={handleImplement}
          disabled={state.nodes.length === 0 || state.isImplementing}
          title={state.language === 'ja' ? 'ワークフローを実装' : 'Implement workflow'}
        >
          {state.isImplementing ? '⏳' : '🚀'} {state.language === 'ja' ? (state.isImplementing ? '実装中...' : '実装') : (state.isImplementing ? 'Running...' : 'Implement')}
        </button>
        <button className="topbar-btn primary" onClick={handleSaveWorkflow}>
          💾 {t('save', state.language)}
        </button>
        <button
          className="topbar-btn language-btn"
          onClick={handleLanguageToggle}
          title={state.language === 'ja' ? 'Switch to English' : '日本語に切り替え'}
        >
          🌐 {state.language === 'ja' ? '日本語' : 'EN'}
        </button>
      </div>
    </div>
  );
}
