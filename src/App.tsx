import { useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import {
  Sidebar,
  Canvas,
  TopBar,
  NodeModal,
  SaveWorkflowModal,
  ContextMenu,
  Toast,
  StatusBar,
} from './components';
import { ConnectorModal } from './components/ConnectorModal';
import { Onboarding } from './components/Onboarding';
import { autoInitializeFirebase, onAuthChange } from './services/firebase';
import {
  githubConnector,
  claudeConnector,
  geminiConnector,
  loadConnectorConfig
} from './services/connectors';
import './styles/index.css';

function AppContent() {
  const { state, dispatch } = useApp();

  // Initialize Firebase and connectors on mount
  useEffect(() => {
    const initializeServices = async () => {
      // Try to auto-initialize Firebase
      await autoInitializeFirebase();

      // Listen for auth changes
      const unsubscribe = onAuthChange((user) => {
        if (user) {
          // Update Firebase connector status
          const firebaseConnector = state.connectors.find(c => c.id === 'firebase');
          if (firebaseConnector && firebaseConnector.status !== 'connected') {
            dispatch({
              type: 'UPDATE_CONNECTOR',
              payload: { ...firebaseConnector, status: 'connected' },
            });
          }
        }
      });

      // Load saved connector configurations
      const githubConfig = loadConnectorConfig<{ token: string }>('github');
      if (githubConfig?.token) {
        githubConnector.setToken(githubConfig.token);
        const githubConn = state.connectors.find(c => c.id === 'github');
        if (githubConn) {
          dispatch({ type: 'UPDATE_CONNECTOR', payload: { ...githubConn, status: 'connected' } });
        }
      }

      const claudeConfig = loadConnectorConfig<{ token: string }>('claude-code');
      if (claudeConfig?.token) {
        claudeConnector.setApiKey(claudeConfig.token);
        const claudeConn = state.connectors.find(c => c.id === 'claude-code');
        if (claudeConn) {
          dispatch({ type: 'UPDATE_CONNECTOR', payload: { ...claudeConn, status: 'connected' } });
        }
      }

      const geminiConfig = loadConnectorConfig<{ token: string }>('gemini');
      if (geminiConfig?.token) {
        geminiConnector.setApiKey(geminiConfig.token);
        const geminiConn = state.connectors.find(c => c.id === 'gemini');
        if (geminiConn) {
          dispatch({ type: 'UPDATE_CONNECTOR', payload: { ...geminiConn, status: 'connected' } });
        }
      }

      return () => unsubscribe();
    };

    initializeServices();
  }, []);

  return (
    <div className="app">
      <Sidebar />
      <main className="main-content">
        <TopBar />
        <div className="canvas-container">
          <Canvas />
          <StatusBar />
        </div>
      </main>

      {/* Modals */}
      {state.isAddNodeModalOpen && (
        <NodeModal
          mode="add"
          onClose={() => dispatch({ type: 'CLOSE_ADD_NODE_MODAL' })}
        />
      )}

      {state.isEditNodeModalOpen && state.editingNodeId && (
        <NodeModal
          mode="edit"
          nodeId={state.editingNodeId}
          onClose={() => dispatch({ type: 'CLOSE_EDIT_NODE_MODAL' })}
        />
      )}

      {state.isSaveWorkflowModalOpen && (
        <SaveWorkflowModal
          onClose={() => dispatch({ type: 'CLOSE_SAVE_WORKFLOW_MODAL' })}
        />
      )}

      {state.isConnectorModalOpen && (
        <ConnectorModal
          connectorId={state.editingConnectorId}
          onClose={() => dispatch({ type: 'CLOSE_CONNECTOR_MODAL' })}
        />
      )}

      {/* Context Menu */}
      <ContextMenu />

      {/* Toast Notifications */}
      <Toast />

      {/* Onboarding Tutorial */}
      <Onboarding />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
