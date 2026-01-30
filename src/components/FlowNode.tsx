import React, { useRef, useState, useCallback } from 'react';
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
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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

    const rect = nodeRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX / state.viewport.scale - node.position.x,
        y: e.clientY / state.viewport.scale - node.position.y,
      });
    }

    // Select node
    if (e.ctrlKey || e.metaKey) {
      dispatch({ type: 'SELECT_NODE', payload: node.id });
    } else if (!isSelected) {
      dispatch({ type: 'SELECT_NODES', payload: [node.id] });
    }
  }, [node.id, node.position, state.viewport.scale, isSelected, dispatch]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX / state.viewport.scale - dragOffset.x;
      const newY = e.clientY / state.viewport.scale - dragOffset.y;

      dispatch({
        type: 'MOVE_NODE',
        payload: { id: node.id, position: { x: newX, y: newY } },
      });
    }
  }, [isDragging, dragOffset, node.id, state.viewport.scale, dispatch]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dispatch({ type: 'STOP_DRAGGING_NODE' });
  }, [dispatch]);

  // Add global mouse listeners for dragging
  React.useEffect(() => {
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

  const handlePortMouseDown = useCallback((e: React.MouseEvent, portType: 'input' | 'output') => {
    e.stopPropagation();
    if (portType === 'output') {
      dispatch({ type: 'START_CONNECTION', payload: node.id });
    }
  }, [node.id, dispatch]);

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
            className="port-circle"
            onMouseDown={(e) => handlePortMouseDown(e, 'input')}
            onMouseUp={(e) => handlePortMouseUp(e, 'input')}
          />
          <span className="port-label">{state.language === 'ja' ? '入力' : 'Input'}</span>
        </div>
        <div className="node-port">
          <span className="port-label">{state.language === 'ja' ? '出力' : 'Output'}</span>
          <span
            className="port-circle"
            onMouseDown={(e) => handlePortMouseDown(e, 'output')}
            onMouseUp={(e) => handlePortMouseUp(e, 'output')}
          />
        </div>
      </div>
    </div>
  );
}
