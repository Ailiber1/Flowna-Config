import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { FlowNode } from './FlowNode';
import { ConnectionsLayer } from './ConnectionsLayer';
import { ConnectorNodeIcon } from './ConnectorNodeIcon';
import { generateId } from '../utils/storage';
import type { FlowNode as FlowNodeType, CustomCategory, ConnectorNode } from '../types';

export function Canvas() {
  const { state, dispatch } = useApp();
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Marquee selection state
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState({ x: 0, y: 0 });
  const [marqueeEnd, setMarqueeEnd] = useState({ x: 0, y: 0 });

  // Handle canvas pan and marquee selection
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const isCanvasClick = e.target === canvasRef.current ||
      (e.target as HTMLElement).classList.contains('canvas-grid') ||
      (e.target as HTMLElement).classList.contains('canvas-content');

    if (isCanvasClick) {
      dispatch({ type: 'SET_CONTEXT_MENU', payload: null });

      if (e.button === 0 && !e.shiftKey) {
        // Left click without shift: start marquee selection
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsMarqueeSelecting(true);
        setMarqueeStart({ x, y });
        setMarqueeEnd({ x, y });
        dispatch({ type: 'DESELECT_ALL' });
      } else if (e.shiftKey || e.button === 1) {
        // Shift+click or middle button: pan
        setIsPanning(true);
        setPanStart({ x: e.clientX - state.viewport.panX, y: e.clientY - state.viewport.panY });
      }
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

    // Marquee selection
    if (isMarqueeSelecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMarqueeEnd({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
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
  }, [isPanning, panStart, isMarqueeSelecting, state.viewport, state.isCreatingConnection, dispatch]);

  const handleMouseUp = useCallback(() => {
    // Complete marquee selection
    if (isMarqueeSelecting && canvasRef.current) {
      const minX = Math.min(marqueeStart.x, marqueeEnd.x);
      const maxX = Math.max(marqueeStart.x, marqueeEnd.x);
      const minY = Math.min(marqueeStart.y, marqueeEnd.y);
      const maxY = Math.max(marqueeStart.y, marqueeEnd.y);

      // Convert screen coordinates to canvas coordinates
      const canvasMinX = (minX - state.viewport.panX) / state.viewport.scale;
      const canvasMaxX = (maxX - state.viewport.panX) / state.viewport.scale;
      const canvasMinY = (minY - state.viewport.panY) / state.viewport.scale;
      const canvasMaxY = (maxY - state.viewport.panY) / state.viewport.scale;

      // Find nodes within the marquee
      const selectedNodeIds = state.nodes
        .filter(node => {
          const nodeRight = node.position.x + 220;
          const nodeBottom = node.position.y + 150;
          return (
            node.position.x < canvasMaxX &&
            nodeRight > canvasMinX &&
            node.position.y < canvasMaxY &&
            nodeBottom > canvasMinY
          );
        })
        .map(node => node.id);

      // Find connector nodes within the marquee (96px size)
      const selectedConnectorNodeIds = state.connectorNodes
        .filter(cn => {
          const cnRight = cn.position.x + 96;
          const cnBottom = cn.position.y + 96;
          return (
            cn.position.x < canvasMaxX &&
            cnRight > canvasMinX &&
            cn.position.y < canvasMaxY &&
            cnBottom > canvasMinY
          );
        })
        .map(cn => cn.id);

      // Select both nodes and connectors
      if (selectedNodeIds.length > 0 || selectedConnectorNodeIds.length > 0) {
        dispatch({ type: 'SELECT_NODES', payload: selectedNodeIds });
        dispatch({ type: 'SELECT_CONNECTOR_NODES', payload: selectedConnectorNodeIds });
      }
    }

    setIsPanning(false);
    setIsMarqueeSelecting(false);
  }, [isMarqueeSelecting, marqueeStart, marqueeEnd, state.viewport, state.nodes, state.connectorNodes, dispatch]);

  // Handle wheel/trackpad gestures (UE5-style)
  // - Two-finger swipe: Pan the canvas
  // - Pinch gesture (ctrlKey): Zoom in/out
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    // Pinch gesture on trackpad sets ctrlKey to true
    if (e.ctrlKey || e.metaKey) {
      // Pinch to zoom
      const delta = e.deltaY > 0 ? 0.95 : 1.05;
      const newScale = Math.min(2.0, Math.max(0.3, state.viewport.scale * delta));

      dispatch({
        type: 'ZOOM_VIEWPORT',
        payload: {
          scale: newScale,
          centerX: e.clientX,
          centerY: e.clientY,
        },
      });
    } else {
      // Two-finger swipe to pan
      dispatch({
        type: 'SET_VIEWPORT',
        payload: {
          ...state.viewport,
          panX: state.viewport.panX - e.deltaX,
          panY: state.viewport.panY - e.deltaY,
        },
      });
    }
  }, [state.viewport, dispatch]);

  // Handle drop from palette
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const categoryData = e.dataTransfer.getData('category');
    const connectorData = e.dataTransfer.getData('connector');

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - state.viewport.panX) / state.viewport.scale;
      const y = (e.clientY - rect.top - state.viewport.panY) / state.viewport.scale;

      if (categoryData) {
        const category: CustomCategory = JSON.parse(categoryData);
        // RULE (green) nodes default to 'done', others default to 'waiting'
        const isRuleNode = category.name.toUpperCase() === 'RULE';

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
          status: isRuleNode ? 'done' : 'waiting',
          memo: '',
          position: { x, y },
          connectorLinks: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        dispatch({ type: 'ADD_NODE', payload: newNode });
      } else if (connectorData) {
        const connectorId = connectorData;

        const newConnectorNode: ConnectorNode = {
          id: `cnode-${Date.now()}`,
          connectorId: connectorId,
          position: { x, y },
          createdAt: Date.now(),
        };

        dispatch({ type: 'ADD_CONNECTOR_NODE', payload: newConnectorNode });
      }
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
        // Delete all selected nodes and connector nodes
        if (state.selectedNodeIds.length > 0 || state.selectedConnectorNodeIds.length > 0) {
          dispatch({ type: 'DELETE_ALL_SELECTED' });
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

      // Ctrl/Cmd+A for select all nodes and connectors
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        dispatch({ type: 'SELECT_ALL' });
      }

      // Ctrl/Cmd+C for copy selected nodes
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (state.selectedNodeIds.length > 0) {
          e.preventDefault();
          dispatch({ type: 'COPY_SELECTED_NODES' });
          dispatch({
            type: 'SHOW_TOAST',
            payload: {
              message: state.language === 'ja'
                ? `${state.selectedNodeIds.length}個のノードをコピーしました`
                : `Copied ${state.selectedNodeIds.length} node(s)`,
              type: 'info',
            },
          });
        }
      }

      // Ctrl/Cmd+V for paste nodes
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        dispatch({ type: 'PASTE_NODES' });
      }

      // Ctrl/Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedNodeIds, state.selectedConnectorNodeIds, state.selectedConnectionId, state.language, dispatch]);

  return (
    <div
      ref={canvasRef}
      className={`canvas ${isPanning ? 'grabbing' : ''} ${state.isDraggingNode ? 'dragging-nodes' : ''}`}
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

        {/* Connector Nodes */}
        {state.connectorNodes.map(connectorNode => {
          const connector = state.connectors.find(c => c.id === connectorNode.connectorId);
          if (!connector) return null;
          return (
            <ConnectorNodeIcon
              key={connectorNode.id}
              connectorNode={connectorNode}
              connector={connector}
              isSelected={state.selectedConnectorNodeIds.includes(connectorNode.id)}
            />
          );
        })}
      </div>

      {/* Marquee Selection Box */}
      {isMarqueeSelecting && (
        <div
          className="marquee-selection"
          style={{
            left: Math.min(marqueeStart.x, marqueeEnd.x),
            top: Math.min(marqueeStart.y, marqueeEnd.y),
            width: Math.abs(marqueeEnd.x - marqueeStart.x),
            height: Math.abs(marqueeEnd.y - marqueeStart.y),
          }}
        />
      )}
    </div>
  );
}
