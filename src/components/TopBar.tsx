import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { t } from '../utils/i18n';
import { generateExecutionPlan, generateClaudeCodeInstructions } from '../services/workflowEngine';
import ModeSwitch from './ModeSwitch';
import ExecutionPlanPreview, { PlanPreviewCompact } from './ExecutionPlanPreview';
import HelpGuide from './HelpGuide';
import ClaudeCodeModal from './ClaudeCodeModal';

export function TopBar() {
  const { state, dispatch } = useApp();
  const [showPlanPreview, setShowPlanPreview] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [showClaudeCodeModal, setShowClaudeCodeModal] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  // Generate plan when nodes/connections/connectors/mode change
  useEffect(() => {
    if (state.nodes.length > 0 || state.connectorNodes.length > 0) {
      const plan = generateExecutionPlan(
        state.nodes,
        state.connections,
        state.executionMode,
        state.appCreated,
        state.currentRevision,
        state.connectorNodes,
        state.connectors
      );
      dispatch({ type: 'SET_EXECUTION_PLAN', payload: plan });
    } else {
      dispatch({ type: 'SET_EXECUTION_PLAN', payload: null });
    }
  }, [state.nodes, state.connections, state.connectorNodes, state.connectors, state.executionMode, state.appCreated, state.currentRevision, dispatch]);

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

  const handleLanguageToggle = () => {
    dispatch({ type: 'SET_LANGUAGE', payload: state.language === 'ja' ? 'en' : 'ja' });
  };

  const handleImplement = async () => {
    if (state.nodes.length === 0 && state.connectorNodes.length === 0) {
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: state.language === 'ja' ? 'ノードがありません。' : 'No nodes to implement.',
          type: 'warning',
        },
      });
      return;
    }

    // Generate Claude Code instructions from workflow
    const { prompt } = generateClaudeCodeInstructions(
      state.nodes,
      state.connections,
      state.connectorNodes,
      state.connectors,
      state.language
    );

    setGeneratedPrompt(prompt);
    setShowClaudeCodeModal(true);

    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        message: state.language === 'ja'
          ? 'Claude Code用の指示を生成しました'
          : 'Generated instructions for Claude Code',
        type: 'success',
      },
    });
  };

  return (
    <div className="topbar">
      {/* Mode Switch */}
      <ModeSwitch />

      {/* Help Button - next to batch button */}
      <button
        className="topbar-btn help-btn"
        onClick={() => setShowHelpGuide(true)}
        title={state.language === 'ja' ? '使い方ガイド' : 'Help Guide'}
      >
        ❓
      </button>

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
        <button
          className={`topbar-btn implement ${state.isImplementing ? 'implementing' : ''} ${state.executionMode}`}
          onClick={handleImplement}
          disabled={state.nodes.length === 0 || state.isImplementing || (state.executionPlan?.runCount === 0)}
          title={state.language === 'ja'
            ? `${t('createMode', state.language)}モードで実行`
            : `Execute in ${state.executionMode} mode`}
        >
          {state.isImplementing ? '⏳' : (state.executionMode === 'create' ? '✨' : '🔧')}
          {' '}
          {state.isImplementing
            ? t('executing', state.language)
            : (state.executionMode === 'create' ? t('execute', state.language) : t('applyPatch', state.language))}
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

      {/* Help Guide Modal */}
      {showHelpGuide && (
        <HelpGuide onClose={() => setShowHelpGuide(false)} />
      )}

      {/* Claude Code Instructions Modal */}
      {showClaudeCodeModal && (
        <ClaudeCodeModal
          prompt={generatedPrompt}
          onClose={() => setShowClaudeCodeModal(false)}
        />
      )}
    </div>
  );
}
