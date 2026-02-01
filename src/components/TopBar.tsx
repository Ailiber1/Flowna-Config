import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { t } from '../utils/i18n';
import { executeWithPlan, validateWorkflow, generateExecutionPlan } from '../services/workflowEngine';
import ModeSwitch from './ModeSwitch';
import ExecutionPlanPreview, { PlanPreviewCompact } from './ExecutionPlanPreview';

export function TopBar() {
  const { state, dispatch } = useApp();
  const [searchValue, setSearchValue] = useState('');
  const [showPlanPreview, setShowPlanPreview] = useState(false);

  // Generate plan when nodes/connections/mode change
  useEffect(() => {
    if (state.nodes.length > 0) {
      const plan = generateExecutionPlan(
        state.nodes,
        state.connections,
        state.executionMode,
        state.appCreated,
        state.currentRevision
      );
      dispatch({ type: 'SET_EXECUTION_PLAN', payload: plan });
    } else {
      dispatch({ type: 'SET_EXECUTION_PLAN', payload: null });
    }
  }, [state.nodes, state.connections, state.executionMode, state.appCreated, state.currentRevision, dispatch]);

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

    // Check Create mode guard
    if (state.executionMode === 'create' && state.appCreated) {
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: state.language === 'ja'
            ? 'アプリは既に作成済みです。Patchモードに切り替えてください。'
            : 'App already created. Please switch to Patch mode.',
          type: 'warning',
        },
      });
      return;
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

    // Check if plan exists and has nodes to run
    if (!state.executionPlan || state.executionPlan.runCount === 0) {
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: state.language === 'ja'
            ? '実行するノードがありません'
            : 'No nodes to execute',
          type: 'info',
        },
      });
      return;
    }

    // Reset node statuses before starting
    dispatch({ type: 'RESET_NODE_STATUSES' });
    dispatch({ type: 'SET_IMPLEMENTING', payload: true });

    // Show implementation progress with mode info
    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        message: state.language === 'ja'
          ? `${state.executionMode === 'create' ? 'Create' : 'Patch'}モードで実行中... (${state.executionPlan.runCount}ノード)`
          : `Running in ${state.executionMode} mode... (${state.executionPlan.runCount} nodes)`,
        type: 'info',
      },
    });

    try {
      const result = await executeWithPlan(
        state.executionPlan,
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
          // Update node's lastRun info for idempotency
          if (nodeResult.inputHash) {
            dispatch({
              type: 'UPDATE_NODE_LAST_RUN',
              payload: {
                nodeId: nodeResult.nodeId,
                inputHash: nodeResult.inputHash,
                revision: state.currentRevision,
                result: nodeResult.status === 'done' ? 'success' : 'error',
              },
            });
          }
        }
      );

      dispatch({ type: 'SET_IMPLEMENTING', payload: false });

      // If Create mode and successful, mark app as created
      if (result.success && state.executionMode === 'create') {
        dispatch({ type: 'SET_APP_CREATED', payload: true });
        dispatch({
          type: 'SHOW_TOAST',
          payload: {
            message: state.language === 'ja'
              ? 'アプリが作成されました。今後は Patch モードをご利用ください。'
              : 'App created! Use Patch mode for future modifications.',
            type: 'success',
          },
        });
      } else if (result.success) {
        dispatch({
          type: 'SHOW_TOAST',
          payload: {
            message: state.language === 'ja' ? 'パッチが適用されました' : 'Patch applied successfully',
            type: 'success',
          },
        });
      } else {
        const errorCount = result.results.filter(r => r.status === 'error').length;
        dispatch({
          type: 'SHOW_TOAST',
          payload: {
            message: state.language === 'ja'
              ? `実行完了 (${errorCount}件のエラー)`
              : `Execution completed with ${errorCount} error(s)`,
            type: 'warning',
          },
        });
      }

      // Increment revision and add to run log
      dispatch({ type: 'INCREMENT_REVISION' });
      dispatch({
        type: 'ADD_RUN_LOG',
        payload: {
          id: `run-${Date.now()}`,
          revision: state.currentRevision,
          mode: state.executionMode,
          executedNodes: result.executedNodeIds,
          skippedNodes: result.results.filter(r => r.status === 'done' && !result.executedNodeIds.includes(r.nodeId)).map(r => r.nodeId),
          errorNodes: result.results.filter(r => r.status === 'error').map(r => r.nodeId),
          startedAt: Date.now() - 1000, // Approximate
          completedAt: Date.now(),
        },
      });
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
      {/* Mode Switch */}
      <ModeSwitch />

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
        {/* Plan Preview (compact) */}
        <button
          className="topbar-btn plan-preview-btn"
          onClick={() => setShowPlanPreview(true)}
          title={state.language === 'ja' ? '実行プランを表示' : 'Show execution plan'}
        >
          <PlanPreviewCompact />
        </button>

        <button className="topbar-btn" onClick={handleFitToScreen}>
          📐 {state.language === 'ja' ? 'フィット' : 'Fit'}
        </button>
        <button className="topbar-btn" onClick={handleAddNode}>
          ➕ {t('addNode', state.language)}
        </button>
        <button
          className={`topbar-btn implement ${state.isImplementing ? 'implementing' : ''} ${state.executionMode}`}
          onClick={handleImplement}
          disabled={state.nodes.length === 0 || state.isImplementing || (state.executionPlan?.runCount === 0)}
          title={state.language === 'ja'
            ? `${state.executionMode === 'create' ? 'Create' : 'Patch'}モードで実行`
            : `Execute in ${state.executionMode} mode`}
        >
          {state.isImplementing ? '⏳' : (state.executionMode === 'create' ? '✨' : '🔧')}
          {' '}
          {state.language === 'ja'
            ? (state.isImplementing
                ? '実行中...'
                : (state.executionMode === 'create' ? 'Create' : 'Patch'))
            : (state.isImplementing
                ? 'Running...'
                : (state.executionMode === 'create' ? 'Create' : 'Patch'))}
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

      {/* Plan Preview Modal */}
      {showPlanPreview && (
        <div className="plan-preview-modal-overlay" onClick={() => setShowPlanPreview(false)}>
          <div onClick={e => e.stopPropagation()}>
            <ExecutionPlanPreview
              plan={state.executionPlan}
              onClose={() => setShowPlanPreview(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
