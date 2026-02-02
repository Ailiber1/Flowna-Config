import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import type { FlowNode, Connection, ConnectorNode } from '../types';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 150; // Fixed height of node

// Connector node card dimensions
const CONNECTOR_NODE_WIDTH = 180;
const CONNECTOR_NODE_HEIGHT = 140;

// Port circle position - adjusted to match the visual position of green port circles
// The port is in the node-footer which has padding: 8px 12px 10px
// Port circle is 14px, so center is 7px from its edge
// From bottom of node: 10px (padding) + 7px (half port) = 17px
const PORT_OFFSET_FROM_BOTTOM = 17;
const PORT_OFFSET_X = 19;

// Connector node port offsets
const CONNECTOR_PORT_OFFSET_FROM_BOTTOM = 15;
const CONNECTOR_PORT_OFFSET_X = 15;

function getNodeCenter(node: FlowNode, portType: 'input' | 'output'): { x: number; y: number } {
  const portY = node.position.y + NODE_HEIGHT - PORT_OFFSET_FROM_BOTTOM;

  if (portType === 'input') {
    return { x: node.position.x + PORT_OFFSET_X, y: portY };
  } else {
    return { x: node.position.x + NODE_WIDTH - PORT_OFFSET_X, y: portY };
  }
}

function getConnectorNodePort(connectorNode: ConnectorNode, portType: 'input' | 'output'): { x: number; y: number } {
  // Port positions on connector node card (now similar to regular nodes)
  const portY = connectorNode.position.y + CONNECTOR_NODE_HEIGHT - CONNECTOR_PORT_OFFSET_FROM_BOTTOM;

  if (portType === 'input') {
    return { x: connectorNode.position.x + CONNECTOR_PORT_OFFSET_X, y: portY };
  } else {
    return { x: connectorNode.position.x + CONNECTOR_NODE_WIDTH - CONNECTOR_PORT_OFFSET_X, y: portY };
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
    const fromConnectorNode = connectorNodesMap.get(connection.from);
    const toNode = nodesMap.get(connection.to);
    const toConnectorNode = connectorNodesMap.get(connection.to);

    // Determine if this is a connector connection
    const isConnectorConnection = connection.type === 'node-to-connector' ||
      fromConnectorNode !== undefined ||
      toConnectorNode !== undefined;

    // Get start position (from node output or connector output)
    let start: { x: number; y: number };
    if (fromNode) {
      start = getNodeCenter(fromNode, 'output');
    } else if (fromConnectorNode) {
      start = getConnectorNodePort(fromConnectorNode, 'output');
    } else {
      return null;
    }

    // Get end position (either node input or connector node input)
    let end: { x: number; y: number };
    if (toConnectorNode) {
      end = getConnectorNodePort(toConnectorNode, 'input');
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
    const startConnectorNode = connectorNodesMap.get(state.connectionStartNodeId);

    let start: { x: number; y: number };
    if (startNode) {
      start = getNodeCenter(startNode, 'output');
    } else if (startConnectorNode) {
      start = getConnectorNodePort(startConnectorNode, 'output');
    } else {
      return null;
    }

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
