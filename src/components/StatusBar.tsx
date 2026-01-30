
import { useApp } from '../contexts/AppContext';

export function StatusBar() {
  const { state } = useApp();

  const zoomPercentage = Math.round(state.viewport.scale * 100);

  return (
    <div className="status-bar">
      <div className="status-item">
        <span>📊</span>
        <span>{state.nodes.length} {state.language === 'ja' ? 'ノード' : 'nodes'}</span>
      </div>
      <div className="status-item">
        <span>🔗</span>
        <span>{state.connections.length} {state.language === 'ja' ? '接続' : 'connections'}</span>
      </div>
      <div className="status-item">
        <span>🔍</span>
        <span>{zoomPercentage}%</span>
      </div>
      <div className="status-item">
        <span>📍</span>
        <span>X: {Math.round(state.viewport.panX)} Y: {Math.round(state.viewport.panY)}</span>
      </div>
      {state.selectedNodeIds.length > 0 && (
        <div className="status-item">
          <span>✓</span>
          <span>{state.selectedNodeIds.length} {state.language === 'ja' ? '選択中' : 'selected'}</span>
        </div>
      )}
    </div>
  );
}
