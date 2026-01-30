import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import type { FlowNode, Connection } from '../types';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 165;

// Port circle position: footer padding (12px) + half of port circle height (6px) = 18px from bottom
// But we need to account for the visual center of the port area in the footer
const PORT_OFFSET_FROM_BOTTOM = 30;

function getNodeCenter(node: FlowNode, portType: 'input' | 'output'): { x: number; y: number } {
  const portY = node.position.y + NODE_HEIGHT - PORT_OFFSET_FROM_BOTTOM;

  if (portType === 'input') {
    // Input port: left side, 16px padding + 6px (half of port circle)
    return { x: node.position.x + 22, y: portY };
  } else {
    // Output port: right side, width - 16px padding - 6px (half of port circle)
    return { x: node.position.x + NODE_WIDTH - 22, y: portY };
  }
}

function createBezierPath(start: { x: number; y: number }, end: { x: number; y: number }): string {
  const dx = end.x - start.x;
  const controlOffset = Math.min(Math.abs(dx) * 0.5, 150);

  return `M ${start.x} ${start.y} C ${start.x + controlOffset} ${start.y}, ${end.x - controlOffset} ${end.y}, ${end.x} ${end.y}`;
}

export function ConnectionsLayer() {
  const { state, dispatch } = useApp();

  const nodesMap = useMemo(() => {
    const map = new Map<string, FlowNode>();
    state.nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [state.nodes]);

  const handleConnectionClick = (e: React.MouseEvent, connectionId: string) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_CONNECTION', payload: connectionId });
  };

  const handleConnectionContextMenu = (e: React.MouseEvent, connectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({
      type: 'SET_CONTEXT_MENU',
      payload: {
        x: e.clientX,
        y: e.clientY,
        type: 'connection',
        targetId: connectionId,
      },
    });
  };

  // Render connections
  const renderConnection = (connection: Connection) => {
    const fromNode = nodesMap.get(connection.from);
    const toNode = nodesMap.get(connection.to);

    if (!fromNode || !toNode) return null;

    const start = getNodeCenter(fromNode, 'output');
    const end = getNodeCenter(toNode, 'input');
    const path = createBezierPath(start, end);
    const isSelected = state.selectedConnectionId === connection.id;

    return (
      <g key={connection.id}>
        {/* Invisible wider path for easier clicking */}
        <path
          d={path}
          fill="none"
          stroke="transparent"
          strokeWidth="20"
          style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
          onClick={(e) => handleConnectionClick(e, connection.id)}
          onContextMenu={(e) => handleConnectionContextMenu(e, connection.id)}
        />
        {/* Visible connection line */}
        <path
          d={path}
          className={`connection-line ${connection.active ? 'active' : 'inactive'} ${isSelected ? 'selected' : ''}`}
          onClick={(e) => handleConnectionClick(e, connection.id)}
          onContextMenu={(e) => handleConnectionContextMenu(e, connection.id)}
          style={{ pointerEvents: 'stroke' }}
        />
        {/* Data packets for active connections */}
        {connection.active && (
          <>
            <circle r="5" className="data-packet">
              <animateMotion dur="2.5s" repeatCount="indefinite" path={path} />
            </circle>
            <circle r="5" className="data-packet">
              <animateMotion dur="2.5s" repeatCount="indefinite" path={path} begin="0.8s" />
            </circle>
            <circle r="5" className="data-packet">
              <animateMotion dur="2.5s" repeatCount="indefinite" path={path} begin="1.6s" />
            </circle>
          </>
        )}
      </g>
    );
  };

  // Render ghost line during connection creation
  const renderGhostLine = () => {
    if (!state.isCreatingConnection || !state.connectionStartNodeId || !state.ghostLineEnd) {
      return null;
    }

    const startNode = nodesMap.get(state.connectionStartNodeId);
    if (!startNode) return null;

    const start = getNodeCenter(startNode, 'output');
    const path = createBezierPath(start, state.ghostLineEnd);

    return (
      <path d={path} className="ghost-line" />
    );
  };

  return (
    <svg className="connections-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {state.connections.map(renderConnection)}
      {renderGhostLine()}
    </svg>
  );
}
