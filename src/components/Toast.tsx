import { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

export function Toast() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    if (state.toast) {
      const timer = setTimeout(() => {
        dispatch({ type: 'HIDE_TOAST' });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [state.toast, dispatch]);

  if (!state.toast) return null;

  const toast = state.toast;

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="toast-container">
      <div className={`toast ${toast.type}`}>
        <span>{getIcon()}</span>
        <span className="toast-message">{toast.message}</span>
      </div>
    </div>
  );
}
