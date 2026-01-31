import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import type { FlowNode, Connection, ConnectorNode } from '../types';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 150; // Visual min-height of node
const CONNECTOR_NODE_SIZE = 64; // Size of connector node circle

// Port circle position - measured from screenshot
// The green port circles (🟢) are approximately 45px from the bottom of the node
// and 19px from the left/right edge
const PORT_OFFSET_FROM_BOTTOM = 45;
const PORT_OFFSET_X = 19;

function getNodeCenter(node: FlowNode, portType: 'input' | 'output'): { x: number; y: number } {
  const portY = node.position.y + NODE_HEIGHT - PORT_OFFSET_FROM_BOTTOM;

  if (portType === 'input') {
    return { x: node.position.x + PORT_OFFSET_X, y: portY };
  } else {
    return { x: node.position.x + NODE_WIDTH - PORT_OFFSET_X, y: portY };
  }
}

function getConnectorNodeCenter(connectorNode: ConnectorNode): { x: number; y: number } {
  // Center of the connector node circle
  return {
    x: connectorNode.position.x + CONNECTOR_NODE_SIZE / 2,
    y: connectorNode.position.y + CONNECTOR_NODE_SIZE / 2,
  };
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

  const connectorNodesMap = useMemo(() => {
    const map = new Map<string, ConnectorNode>();
    state.connectorNodes.forEach(cn => map.set(cn.id, cn));
    return map;
  }, [state.connectorNodes]);

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
    const toConnectorNode = connectorNodesMap.get(connection.to);

    // Determine if this is a connector connection
    const isConnectorConnection = connection.type === 'node-to-connector' || toConnectorNode !== undefined;

    // Get start position (always from a node output)
    if (!fromNode) return null;
    const start = getNodeCenter(fromNode, 'output');

    // Get end position (either node input or connector node center)
    let end: { x: number; y: number };
    if (toConnectorNode) {
      end = getConnectorNodeCenter(toConnectorNode);
    } else if (toNode) {
      end = getNodeCenter(toNode, 'input');
    } else {
      return null;
    }

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
          className={`connection-line ${connection.active ? 'active' : 'inactive'} ${isSelected ? 'selected' : ''} ${isConnectorConnection ? 'connector-connection' : ''}`}
          onClick={(e) => handleConnectionClick(e, connection.id)}
          onContextMenu={(e) => handleConnectionContextMenu(e, connection.id)}
          style={{ pointerEvents: 'stroke' }}
        />
        {/* Data packets for active connections */}
        {connection.active && (
          <>
            <circle r="5" className={`data-packet ${isConnectorConnection ? 'connector-packet' : ''}`}>
              <animateMotion dur="2.5s" repeatCount="indefinite" path={path} />
            </circle>
            <circle r="5" className={`data-packet ${isConnectorConnection ? 'connector-packet' : ''}`}>
              <animateMotion dur="2.5s" repeatCount="indefinite" path={path} begin="0.8s" />
            </circle>
            <circle r="5" className={`data-packet ${isConnectorConnection ? 'connector-packet' : ''}`}>
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
    <svg
      className="connections-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 10000,
        height: 10000,
        overflow: 'visible',
        pointerEvents: 'none'
      }}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Arrowhead marker for connection lines */}
        <marker
          id="arrowhead"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L12,6 L0,12 L3,6 Z" fill="#c084fc" />
        </marker>
        <marker
          id="arrowhead-hover"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L12,6 L0,12 L3,6 Z" fill="#d8b4fe" />
        </marker>
        {/* Blue arrowhead for connector connections */}
        <marker
          id="arrowhead-connector"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L12,6 L0,12 L3,6 Z" fill="#2196f3" />
        </marker>
      </defs>
      {state.connections.map(renderConnection)}
      {renderGhostLine()}
    </svg>
  );
}
