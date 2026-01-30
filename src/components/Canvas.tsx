import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { FlowNode } from './FlowNode';
import { ConnectionsLayer } from './ConnectionsLayer';
import { generateId } from '../utils/storage';
import type { FlowNode as FlowNodeType, CustomCategory } from '../types';

export function Canvas() {
  const { state, dispatch } = useApp();
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Handle canvas pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || e.target === contentRef.current?.querySelector('.canvas-grid')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - state.viewport.panX, y: e.clientY - state.viewport.panY });
      dispatch({ type: 'DESELECT_ALL' });
      dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
    }
  }, [state.viewport.panX, state.viewport.panY, dispatch]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      dispatch({
        type: 'SET_VIEWPORT',
        payload: {
          ...state.viewport,
          panX: e.clientX - panStart.x,
          panY: e.clientY - panStart.y,
        },
      });
    }

    // Update ghost line for connection creation
    if (state.isCreatingConnection && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      dispatch({
        type: 'UPDATE_GHOST_LINE',
        payload: {
          x: (e.clientX - rect.left - state.viewport.panX) / state.viewport.scale,
          y: (e.clientY - rect.top - state.viewport.panY) / state.viewport.scale,
        },
      });
    }
  }, [isPanning, panStart, state.viewport, state.isCreatingConnection, dispatch]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    if (state.isCreatingConnection) {
      dispatch({ type: 'CANCEL_CONNECTION' });
    }
  }, [state.isCreatingConnection, dispatch]);

  // Handle zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(2.0, Math.max(0.3, state.viewport.scale * delta));

    dispatch({
      type: 'ZOOM_VIEWPORT',
      payload: {
        scale: newScale,
        centerX: e.clientX,
        centerY: e.clientY,
      },
    });
  }, [state.viewport.scale, dispatch]);

  // Handle drop from palette
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const categoryData = e.dataTransfer.getData('category');
    if (categoryData && canvasRef.current) {
      const category: CustomCategory = JSON.parse(categoryData);
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - state.viewport.panX) / state.viewport.scale;
      const y = (e.clientY - rect.top - state.viewport.panY) / state.viewport.scale;

      const newNode: FlowNodeType = {
        id: generateId(),
        title: category.displayName,
        displayName: category.displayName,
        description: '',
        category: category.name,
        categoryDisplayName: category.displayName,
        icon: category.icon,
        color: category.color,
        url: '',
        status: 'todo',
        memo: '',
        position: { x, y },
        connectorLinks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      dispatch({ type: 'ADD_NODE', payload: newNode });
    }
  }, [state.viewport, dispatch]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-grid')) {
      dispatch({
        type: 'SET_CONTEXT_MENU',
        payload: {
          x: e.clientX,
          y: e.clientY,
          type: 'canvas',
          targetId: null,
        },
      });
    }
  }, [dispatch]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedNodeIds.length > 0) {
          state.selectedNodeIds.forEach(id => {
            dispatch({ type: 'DELETE_NODE', payload: id });
          });
        }
        if (state.selectedConnectionId) {
          dispatch({ type: 'DELETE_CONNECTION', payload: state.selectedConnectionId });
        }
      }

      if (e.key === 'Escape') {
        dispatch({ type: 'DESELECT_ALL' });
        dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
        dispatch({ type: 'CANCEL_CONNECTION' });
      }

      // Ctrl+S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        dispatch({ type: 'OPEN_SAVE_WORKFLOW_MODAL' });
      }

      // Ctrl+N for new node
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        dispatch({ type: 'OPEN_ADD_NODE_MODAL' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedNodeIds, state.selectedConnectionId, dispatch]);

  return (
    <div
      ref={canvasRef}
      className={`canvas ${isPanning ? 'grabbing' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onContextMenu={handleContextMenu}
    >
      {/* Grid Background */}
      <div
        className="canvas-grid"
        style={{
          backgroundPosition: `${state.viewport.panX}px ${state.viewport.panY}px`,
          backgroundSize: `${50 * state.viewport.scale}px ${50 * state.viewport.scale}px, ${50 * state.viewport.scale}px ${50 * state.viewport.scale}px, ${10 * state.viewport.scale}px ${10 * state.viewport.scale}px, ${10 * state.viewport.scale}px ${10 * state.viewport.scale}px`,
        }}
      />

      {/* Content Layer */}
      <div
        ref={contentRef}
        className="canvas-content"
        style={{
          transform: `translate(${state.viewport.panX}px, ${state.viewport.panY}px) scale(${state.viewport.scale})`,
        }}
      >
        {/* Connections */}
        <ConnectionsLayer />

        {/* Nodes */}
        {state.nodes.map(node => (
          <FlowNode
            key={node.id}
            node={node}
            isSelected={state.selectedNodeIds.includes(node.id)}
            isHighlighted={state.highlightedNodeIds.includes(node.id)}
          />
        ))}
      </div>
    </div>
  );
}
