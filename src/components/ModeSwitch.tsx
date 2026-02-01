import { useApp } from '../contexts/AppContext';
import type { ExecutionMode } from '../types';
import { useTranslation } from '../utils/i18n';

export default function ModeSwitch() {
  const { state, dispatch } = useApp();
  const { t } = useTranslation(state.language);

  const handleModeChange = (mode: ExecutionMode) => {
    // Guard: If app is created and trying to switch to Create mode, show warning
    if (mode === 'create' && state.appCreated) {
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: t('createModeBlocked') || 'App already created. Use Patch mode for modifications.',
          type: 'warning',
        },
      });
      return;
    }
    dispatch({ type: 'SET_EXECUTION_MODE', payload: mode });
  };

  return (
    <div className="mode-switch">
      <button
        className={`mode-switch-btn ${state.executionMode === 'create' ? 'active' : ''} ${state.appCreated ? 'disabled' : ''}`}
        onClick={() => handleModeChange('create')}
        disabled={state.appCreated}
        title={state.appCreated ? (t('createModeBlocked') || 'App already created') : (t('createModeDesc') || 'Create new app from scratch')}
      >
        <span className="mode-icon">+</span>
        <span className="mode-label">{t('createMode') || 'Create'}</span>
      </button>
      <button
        className={`mode-switch-btn ${state.executionMode === 'patch' ? 'active' : ''}`}
        onClick={() => handleModeChange('patch')}
        title={t('patchModeDesc') || 'Modify existing app with targeted patches'}
      >
        <span className="mode-icon">/</span>
        <span className="mode-label">{t('patchMode') || 'Patch'}</span>
      </button>
    </div>
  );
}
