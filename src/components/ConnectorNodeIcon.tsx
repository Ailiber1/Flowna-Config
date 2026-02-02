import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import type { ConnectorNode, Connector } from '../types';

interface ConnectorNodeIconProps {
  connectorNode: ConnectorNode;
  connector: Connector;
  isSelected: boolean;
}

const CONNECTOR_NODE_WIDTH = 180;
const CONNECTOR_NODE_HEIGHT = 140;

export function ConnectorNodeIcon({ connectorNode, connector, isSelected }: ConnectorNodeIconProps) {
  const { state, dispatch } = useApp();
  const nodeRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const connectorNodePositionRef = useRef(connectorNode.position);
  // Refs to track current values without causing useEffect re-runs
  const scaleRef = useRef(state.viewport.scale);
  const isSelectedRef = useRef(isSelected);
  const selectedCountRef = useRef({ nodes: 0, connectors: 0 });
  const connectorNodeIdRef = useRef(connectorNode.id);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreatingConnectionFromThis, setIsCreatingConnectionFromThis] = useState(false);

  // Keep refs updated with latest values
  connectorNodePositionRef.current = connectorNode.position;
  scaleRef.current = state.viewport.scale;
  isSelectedRef.current = isSelected;
  selectedCountRef.current = {
    nodes: state.selectedNodeIds.length,
    connectors: state.selectedConnectorNodeIds.length,
  };
  connectorNodeIdRef.current = connectorNode.id;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag if clicking on port
    if ((e.target as HTMLElement).classList.contains('port-circle')) return;

    e.stopPropagation();
    isDraggingRef.current = true;
    setIsDragging(true);
    dispatch({ type: 'START_DRAGGING_NODE' });

    lastMousePosRef.current = {
      x: e.clientX / state.viewport.scale,
      y: e.clientY / state.viewport.scale,
    };

    // Handle multi-selection with Ctrl/Cmd
    if (e.ctrlKey || e.metaKey) {
      dispatch({ type: 'SELECT_CONNECTOR_NODE', payload: connectorNode.id });
    } else if (!isSelected) {
      // Clear other selections and select only this connector
      dispatch({ type: 'SELECT_NODES', payload: [] });
      dispatch({ type: 'SELECT_CONNECTOR_NODES', payload: [connectorNode.id] });
    }
  }, [connectorNode.id, state.viewport.scale, isSelected, dispatch]);

  // Add global mouse listeners for dragging
  // IMPORTANT: Use refs for all values to prevent useEffect re-runs during drag
  // which causes event listener churn and connection line misalignment
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      // Use refs for all values to get latest without causing re-renders
      const scale = scaleRef.current;
      const currentX = e.clientX / scale;
      const currentY = e.clientY / scale;

      const dx = currentX - lastMousePosRef.current.x;
      const dy = currentY - lastMousePosRef.current.y;

      // Check if we have multiple items selected (nodes and/or connectors)
      const totalSelected = selectedCountRef.current.nodes + selectedCountRef.current.connectors;

      if (isSelectedRef.current && totalSelected > 1) {
        // Move all selected items together
        dispatch({
          type: 'MOVE_ALL_SELECTED',
          payload: { dx, dy },
        });
      } else {
        // Move only this connector - use ref for latest position
        dispatch({
          type: 'MOVE_CONNECTOR_NODE',
          payload: {
            id: connectorNodeIdRef.current,
            position: {
              x: connectorNodePositionRef.current.x + dx,
              y: connectorNodePositionRef.current.y + dy,
            },
          },
        });
      }

      lastMousePosRef.current = { x: currentX, y: currentY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      dispatch({ type: 'STOP_DRAGGING_NODE' });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    // Only depend on isDragging and dispatch - all other values accessed via refs
  }, [isDragging, dispatch]);

  // Connection creation from output port
  const handleConnectionMouseMove = useCallback((e: MouseEvent) => {
    const canvas = document.querySelector('.canvas') as HTMLElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - state.viewport.panX) / state.viewport.scale;
    const y = (e.clientY - rect.top - state.viewport.panY) / state.viewport.scale;

    dispatch({
      type: 'UPDATE_GHOST_LINE',
      payload: { x, y },
    });
  }, [state.viewport, dispatch]);

  const handleConnectionMouseUp = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;

    if (!target.classList.contains('port-circle')) {
      dispatch({ type: 'CANCEL_CONNECTION' });
    }

    setIsCreatingConnectionFromThis(false);
  }, [dispatch]);

  useEffect(() => {
    if (!isCreatingConnectionFromThis) return;

    window.addEventListener('mousemove', handleConnectionMouseMove);
    window.addEventListener('mouseup', handleConnectionMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleConnectionMouseMove);
      window.removeEventListener('mouseup', handleConnectionMouseUp);
    };
  }, [isCreatingConnectionFromThis, handleConnectionMouseMove, handleConnectionMouseUp]);

  const handleInputPortMouseUp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    if (state.isCreatingConnection && state.connectionStartNodeId) {
      // Complete connection from node/connector to this connector's input
      const existingConnection = state.connections.find(
        c => c.from === state.connectionStartNodeId && c.to === connectorNode.id
      );

      if (!existingConnection && state.connectionStartNodeId !== connectorNode.id) {
        dispatch({
          type: 'ADD_CONNECTION',
          payload: {
            id: `conn-${Date.now()}`,
            from: state.connectionStartNodeId,
            to: connectorNode.id,
            active: true,
            label: '',
            createdAt: Date.now(),
            type: 'node-to-connector',
          },
        });
      }
      dispatch({ type: 'CANCEL_CONNECTION' });
    }
  }, [connectorNode.id, state.isCreatingConnection, state.connectionStartNodeId, state.connections, dispatch]);

  const handleOutputPortMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Start connection creation from this connector
    dispatch({ type: 'START_CONNECTION', payload: connectorNode.id });

    // Set initial ghost line position to the output port location
    // Port offset must match ConnectionsLayer.tsx CONNECTOR_PORT_OFFSET_FROM_BOTTOM (35px)
    const portX = connectorNode.position.x + CONNECTOR_NODE_WIDTH - 15;
    const portY = connectorNode.position.y + CONNECTOR_NODE_HEIGHT - 35;
    dispatch({
      type: 'UPDATE_GHOST_LINE',
      payload: { x: portX, y: portY },
    });

    setIsCreatingConnectionFromThis(true);
  }, [connectorNode.id, connectorNode.position, dispatch]);

  // Right-click to open connector settings
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Open the connector settings modal
    dispatch({ type: 'OPEN_CONNECTOR_MODAL', payload: connector.id });
  }, [connector.id, dispatch]);

  // Double-click to open URL
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (connector.url) {
      window.open(connector.url, '_blank');
    } else {
      // If no URL is set, open the settings modal
      dispatch({ type: 'OPEN_CONNECTOR_MODAL', payload: connector.id });
    }
  }, [connector.url, connector.id, dispatch]);

  const getStatusLabel = () => {
    if (connector.status === 'connected') {
      return state.language === 'ja' ? '接続済' : 'Connected';
    }
    return state.language === 'ja' ? '未接続' : 'Not Connected';
  };

  // Apply dragging class if this connector is being dragged OR if any drag is happening
  // This ensures CSS transitions are disabled during all drag operations
  const shouldDisableTransition = isDragging || state.isDraggingNode;

  return (
    <div
      ref={nodeRef}
      className={`connector-node-card ${isSelected ? 'selected' : ''} ${shouldDisableTransition ? 'dragging' : ''} ${connector.status === 'connected' ? 'configured' : ''}`}
      style={{
        left: connectorNode.position.x,
        top: connectorNode.position.y,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Header */}
      <div className="connector-node-header">
        <span className="connector-node-type">● CONNECTOR</span>
      </div>

      {/* Icon and Name Section */}
      <div className="connector-node-content">
        <span className="connector-node-icon">{connector.icon}</span>
        <span className="connector-node-name"># {connector.name}</span>
      </div>

      {/* Status Badge */}
      <div className={`connector-status-badge ${connector.status === 'connected' ? 'connected' : 'disconnected'}`}>
        {getStatusLabel()}
      </div>

      {/* Footer with Ports */}
      <div className="connector-node-footer">
        <div className="connector-port">
          <span
            className="port-circle input-port"
            onMouseUp={handleInputPortMouseUp}
          />
          <span className="port-label">{state.language === 'ja' ? '入力' : 'Input'}</span>
        </div>
        <div className="connector-port">
          <span className="port-label">{state.language === 'ja' ? '出力' : 'Output'}</span>
          <span
            className="port-circle output-port"
            onMouseDown={handleOutputPortMouseDown}
          />
        </div>
      </div>
    </div>
  );
}
