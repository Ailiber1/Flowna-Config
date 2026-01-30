import React from 'react';
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
import './styles/index.css';

function AppContent() {
  const { state, dispatch } = useApp();

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

      {/* Context Menu */}
      <ContextMenu />

      {/* Toast Notifications */}
      <Toast />
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
