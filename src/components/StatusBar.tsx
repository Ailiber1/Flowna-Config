
import { useApp } from '../contexts/AppContext';

export function StatusBar() {
  const { state } = useApp();

  const zoomPercentage = Math.round(state.viewport.scale * 100);

  // Count only valid connections (both endpoints exist)
  const validConnections = state.connections.filter(conn => {
    const fromNode = state.nodes.find(n => n.id === conn.from);
    const fromConnector = state.connectorNodes.find(cn => cn.id === conn.from);
    const toNode = state.nodes.find(n => n.id === conn.to);
    const toConnector = state.connectorNodes.find(cn => cn.id === conn.to);
    return (fromNode || fromConnector) && (toNode || toConnector);
  });

  // Total items on canvas: nodes + connectorNodes
  const totalNodes = state.nodes.length;
  const totalConnectors = state.connectorNodes.length;

  return (
    <div className="status-bar">
      <div className="status-item">
        <span>📊</span>
        <span>{totalNodes} {state.language === 'ja' ? 'ノード' : 'nodes'}</span>
      </div>
      {totalConnectors > 0 && (
        <div className="status-item">
          <span>🔌</span>
          <span>{totalConnectors} {state.language === 'ja' ? 'コネクタ' : 'connectors'}</span>
        </div>
      )}
      <div className="status-item">
        <span>🔗</span>
        <span>{validConnections.length} {state.language === 'ja' ? '接続' : 'connections'}</span>
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
