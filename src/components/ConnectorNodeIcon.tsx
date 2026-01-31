import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import type { ConnectorNode, Connector } from '../types';

interface ConnectorNodeIconProps {
  connectorNode: ConnectorNode;
  connector: Connector;
  isSelected: boolean;
}

const CONNECTOR_NODE_SIZE = 96;

export function ConnectorNodeIcon({ connectorNode, connector, isSelected }: ConnectorNodeIconProps) {
  const { state, dispatch } = useApp();
  const nodeRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isCreatingConnectionFromThis, setIsCreatingConnectionFromThis] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag if clicking on port
    if ((e.target as HTMLElement).classList.contains('connector-port-circle')) return;

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

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const currentX = e.clientX / state.viewport.scale;
      const currentY = e.clientY / state.viewport.scale;

      const dx = currentX - lastMousePosRef.current.x;
      const dy = currentY - lastMousePosRef.current.y;

      // Check if we have multiple items selected (nodes and/or connectors)
      const hasMultipleSelection =
        (state.selectedNodeIds.length + state.selectedConnectorNodeIds.length) > 1;

      if (hasMultipleSelection && isSelected) {
        // Move all selected items together
        dispatch({
          type: 'MOVE_ALL_SELECTED',
          payload: { dx, dy },
        });
      } else {
        // Move only this connector
        dispatch({
          type: 'MOVE_CONNECTOR_NODE',
          payload: {
            id: connectorNode.id,
            position: {
              x: connectorNode.position.x + dx,
              y: connectorNode.position.y + dy,
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
  }, [isDragging, connectorNode.id, connectorNode.position, state.viewport.scale, state.selectedNodeIds.length, state.selectedConnectorNodeIds.length, isSelected, dispatch]);

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

    if (!target.classList.contains('port-circle') && !target.classList.contains('connector-port-circle')) {
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
    const portX = connectorNode.position.x + CONNECTOR_NODE_SIZE - 10;
    const portY = connectorNode.position.y + CONNECTOR_NODE_SIZE / 2;
    dispatch({
      type: 'UPDATE_GHOST_LINE',
      payload: { x: portX, y: portY },
    });

    setIsCreatingConnectionFromThis(true);
  }, [connectorNode.id, connectorNode.position, dispatch]);

  return (
    <div
      ref={nodeRef}
      className={`connector-node-icon ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: connectorNode.position.x,
        top: connectorNode.position.y,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Input port (left side) */}
      <span
        className="connector-port-circle input-port"
        onMouseUp={handleInputPortMouseUp}
      />

      <div className="connector-node-circle">
        <span className="connector-node-emoji">{connector.icon}</span>
      </div>

      {/* Output port (right side) */}
      <span
        className="connector-port-circle output-port"
        onMouseDown={handleOutputPortMouseDown}
      />

      <span className="connector-node-label">{connector.name}</span>
    </div>
  );
}
