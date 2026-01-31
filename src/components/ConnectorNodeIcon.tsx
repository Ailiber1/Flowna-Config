import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import type { ConnectorNode, Connector } from '../types';

interface ConnectorNodeIconProps {
  connectorNode: ConnectorNode;
  connector: Connector;
  isSelected: boolean;
}

export function ConnectorNodeIcon({ connectorNode, connector, isSelected }: ConnectorNodeIconProps) {
  const { state, dispatch } = useApp();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);

    setLastMousePos({
      x: e.clientX / state.viewport.scale,
      y: e.clientY / state.viewport.scale,
    });

    dispatch({ type: 'SELECT_CONNECTOR_NODE', payload: connectorNode.id });
  }, [connectorNode.id, state.viewport.scale, dispatch]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const currentX = e.clientX / state.viewport.scale;
      const currentY = e.clientY / state.viewport.scale;

      const dx = currentX - lastMousePos.x;
      const dy = currentY - lastMousePos.y;

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

      setLastMousePos({ x: currentX, y: currentY });
    }
  }, [isDragging, lastMousePos, connectorNode.id, connectorNode.position, state.viewport.scale, dispatch]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handlePortMouseUp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    if (state.isCreatingConnection && state.connectionStartNodeId) {
      // Complete connection from node to connector
      const existingConnection = state.connections.find(
        c => c.from === state.connectionStartNodeId && c.to === connectorNode.id
      );

      if (!existingConnection) {
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

  return (
    <div
      ref={nodeRef}
      className={`connector-node-icon ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: connectorNode.position.x,
        top: connectorNode.position.y,
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handlePortMouseUp}
    >
      <div className="connector-node-circle">
        <span className="connector-node-emoji">{connector.icon}</span>
      </div>
      <span className="connector-node-label">{connector.name}</span>
    </div>
  );
}
