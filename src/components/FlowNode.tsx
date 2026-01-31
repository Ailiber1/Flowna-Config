import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import type { FlowNode as FlowNodeType } from '../types';

interface FlowNodeProps {
  node: FlowNodeType;
  isSelected: boolean;
  isHighlighted: boolean;
}

export function FlowNode({ node, isSelected, isHighlighted }: FlowNodeProps) {
  const { state, dispatch } = useApp();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isCreatingConnectionFromThis, setIsCreatingConnectionFromThis] = useState(false);

  const getCategoryClass = (category: string): string => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('agent')) return 'agent';
    if (categoryLower.includes('logic')) return 'logic';
    if (categoryLower.includes('system')) return 'system';
    if (categoryLower.includes('rule')) return 'rule';
    return 'agent';
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('port-circle')) return;

    e.stopPropagation();
    setIsDragging(true);
    dispatch({ type: 'START_DRAGGING_NODE' });

    setLastMousePos({
      x: e.clientX / state.viewport.scale,
      y: e.clientY / state.viewport.scale,
    });

    if (e.ctrlKey || e.metaKey) {
      dispatch({ type: 'SELECT_NODE', payload: node.id });
    } else if (!isSelected) {
      dispatch({ type: 'SELECT_NODES', payload: [node.id] });
    }
  }, [node.id, state.viewport.scale, isSelected, dispatch]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const currentX = e.clientX / state.viewport.scale;
      const currentY = e.clientY / state.viewport.scale;

      const dx = currentX - lastMousePos.x;
      const dy = currentY - lastMousePos.y;

      if (isSelected && state.selectedNodeIds.length > 1) {
        dispatch({
          type: 'MOVE_SELECTED_NODES',
          payload: { dx, dy },
        });
      } else {
        dispatch({
          type: 'MOVE_NODE',
          payload: { id: node.id, position: { x: node.position.x + dx, y: node.position.y + dy } },
        });
      }

      setLastMousePos({ x: currentX, y: currentY });
    }
  }, [isDragging, lastMousePos, node.id, node.position, state.viewport.scale, isSelected, state.selectedNodeIds.length, dispatch]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dispatch({ type: 'STOP_DRAGGING_NODE' });
  }, [dispatch]);

  // Add global mouse listeners for dragging
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

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'OPEN_EDIT_NODE_MODAL', payload: node.id });
  }, [node.id, dispatch]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({
      type: 'SET_CONTEXT_MENU',
      payload: {
        x: e.clientX,
        y: e.clientY,
        type: 'node',
        targetId: node.id,
      },
    });
  }, [node.id, dispatch]);

  // Connection creation - handle mouse move for ghost line
  const handleConnectionMouseMove = useCallback((e: MouseEvent) => {
    // Get canvas element to calculate correct coordinates
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

  // Connection creation - handle mouse up
  const handleConnectionMouseUp = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // Check if released on an input port
    if (!target.classList.contains('port-circle')) {
      // Released not on a port, cancel connection
      dispatch({ type: 'CANCEL_CONNECTION' });
    }
    // If released on a port, handlePortMouseUp will handle it

    setIsCreatingConnectionFromThis(false);
  }, [dispatch]);

  // Add global listeners when creating connection from this node
  useEffect(() => {
    if (isCreatingConnectionFromThis) {
      window.addEventListener('mousemove', handleConnectionMouseMove);
      window.addEventListener('mouseup', handleConnectionMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleConnectionMouseMove);
        window.removeEventListener('mouseup', handleConnectionMouseUp);
      };
    }
  }, [isCreatingConnectionFromThis, handleConnectionMouseMove, handleConnectionMouseUp]);

  const handlePortMouseDown = useCallback((e: React.MouseEvent, portType: 'input' | 'output') => {
    e.preventDefault();
    e.stopPropagation();

    if (portType === 'output') {
      // Start connection creation
      dispatch({ type: 'START_CONNECTION', payload: node.id });

      // Set initial ghost line position to the port location
      // Must match ConnectionsLayer constants: WIDTH=220, HEIGHT=150, PORT_OFFSET=38, X_OFFSET=19
      const portX = node.position.x + 220 - 19;
      const portY = node.position.y + 150 - 38;
      dispatch({
        type: 'UPDATE_GHOST_LINE',
        payload: { x: portX, y: portY },
      });

      // Set local state to trigger global listeners
      setIsCreatingConnectionFromThis(true);
    }
  }, [node.id, node.position, dispatch]);

  const handlePortMouseUp = useCallback((e: React.MouseEvent, portType: 'input' | 'output') => {
    e.stopPropagation();

    if (portType === 'input' && state.isCreatingConnection && state.connectionStartNodeId) {
      // Complete connection
      if (state.connectionStartNodeId !== node.id) {
        const existingConnection = state.connections.find(
          c => c.from === state.connectionStartNodeId && c.to === node.id
        );

        if (!existingConnection) {
          dispatch({
            type: 'ADD_CONNECTION',
            payload: {
              id: `conn-${Date.now()}`,
              from: state.connectionStartNodeId,
              to: node.id,
              active: true,
              label: '',
              createdAt: Date.now(),
            },
          });
        }
      }
      dispatch({ type: 'CANCEL_CONNECTION' });
    }
  }, [node.id, state.isCreatingConnection, state.connectionStartNodeId, state.connections, dispatch]);

  const categoryClass = getCategoryClass(node.category);

  const getCategoryLabel = (category: string): string => {
    const cat = category.toUpperCase();
    if (cat.includes('AGENT')) return 'SYS_NODE :: AGENT';
    if (cat.includes('LOGIC')) return 'SYS_NODE :: LOGIC';
    if (cat.includes('SYSTEM')) return 'SYS_NODE :: SYSTEM';
    if (cat.includes('RULE')) return 'SYS_NODE :: RULE';
    return `SYS_NODE :: ${cat}`;
  };

  const getStatusLabel = (status: string): string => {
    if (state.language === 'ja') {
      switch (status) {
        case 'done': return '完了';
        case 'doing': return '作業中';
        default: return '未着手';
      }
    }
    switch (status) {
      case 'done': return 'Done';
      case 'doing': return 'In Progress';
      default: return 'Todo';
    }
  };

  return (
    <div
      ref={nodeRef}
      className={`flow-node ${categoryClass} ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        borderColor: node.color ? `${node.color}80` : undefined,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {/* HUD Corner Decorations */}
      <div className="hud-corner hud-corner-tl" />
      <div className="hud-corner hud-corner-tr" />
      <div className="hud-corner hud-corner-bl" />
      <div className="hud-corner hud-corner-br" />

      {/* Memo Indicator */}
      {node.memo && (
        <span className="node-memo-indicator" title={node.memo}>
          📝
        </span>
      )}

      {/* Header - System Node Type */}
      <div className="node-header">
        <span className="node-type-indicator">● {getCategoryLabel(node.category)}</span>
      </div>

      {/* Title Section */}
      <div className="node-title-section">
        <span className="node-title"># {node.displayName || node.title}</span>
        <span className={`node-status-badge ${node.status}`}>
          {getStatusLabel(node.status)}
        </span>
      </div>

      {/* Body - Description */}
      <div className="node-body">
        {node.description && (
          <div className="node-description-box">
            <p className="node-description">{node.description}</p>
          </div>
        )}
      </div>

      {/* Footer with Ports */}
      <div className="node-footer">
        <div className="node-port">
          <span
            className="port-circle input-port"
            onMouseDown={(e) => handlePortMouseDown(e, 'input')}
            onMouseUp={(e) => handlePortMouseUp(e, 'input')}
          />
          <span className="port-label">{state.language === 'ja' ? '入力' : 'Input'}</span>
        </div>
        <div className="node-port">
          <span className="port-label">{state.language === 'ja' ? '出力' : 'Output'}</span>
          <span
            className="port-circle output-port"
            onMouseDown={(e) => handlePortMouseDown(e, 'output')}
            onMouseUp={(e) => handlePortMouseUp(e, 'output')}
          />
        </div>
      </div>
    </div>
  );
}
