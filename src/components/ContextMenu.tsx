import { useEffect, useRef, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { t } from '../utils/i18n';
import { generateId } from '../utils/storage';
import { parseSpecFile } from '../utils/specParser';
import { githubConnector, claudeConnector, geminiConnector } from '../services/connectors';

export function ContextMenu() {
  const { state, dispatch } = useApp();
  const menuRef = useRef<HTMLDivElement>(null);

  const { x, y, type, targetId } = state.contextMenu || { x: 0, y: 0, type: 'canvas', targetId: null };
  const node = targetId ? state.nodes.find(n => n.id === targetId) : null;
  const connectorNode = targetId ? state.connectorNodes.find(cn => cn.id === targetId) : null;
  // Connection is available for future use with connection-specific context menu items
  const _connection = targetId ? state.connections.find(c => c.id === targetId) : null;
  void _connection; // Suppress unused warning

  // Determine if this is a connector node context menu - don't show context menu for connectors
  const isConnectorNode = !node && connectorNode;

  // Find connected connectors for this node (must be called unconditionally - React hooks rule)
  const connectedConnectors = useMemo(() => {
    if (!node) return [];
    // Find connections where this node is the source
    const outgoingConnections = state.connections.filter(c => c.from === node.id);
    // Get connector nodes that are targets
    const connectorIds: string[] = [];
    outgoingConnections.forEach(conn => {
      const targetConnectorNode = state.connectorNodes.find(cn => cn.id === conn.to);
      if (targetConnectorNode) {
        connectorIds.push(targetConnectorNode.connectorId);
      }
    });
    return state.connectors.filter(c => connectorIds.includes(c.id));
  }, [node, state.connections, state.connectorNodes, state.connectors]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dispatch]);

  if (!state.contextMenu) return null;

  // Check if node has attached file
  const hasAttachedFile = !!node?.attachedFile;

  const handleEdit = () => {
    if (targetId) {
      dispatch({ type: 'OPEN_EDIT_NODE_MODAL', payload: targetId });
    }
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  const handleDelete = () => {
    if (type === 'node' && targetId) {
      // Check if it's a connector node or regular node
      if (isConnectorNode) {
        dispatch({ type: 'DELETE_CONNECTOR_NODE', payload: targetId });
        dispatch({
          type: 'SHOW_TOAST',
          payload: { message: state.language === 'ja' ? 'コネクタを削除しました' : 'Connector deleted', type: 'info' },
        });
      } else {
        dispatch({ type: 'DELETE_NODE', payload: targetId });
        dispatch({
          type: 'SHOW_TOAST',
          payload: { message: state.language === 'ja' ? 'ノードを削除しました' : 'Node deleted', type: 'info' },
        });
      }
    } else if (type === 'connection' && targetId) {
      dispatch({ type: 'DELETE_CONNECTION', payload: targetId });
      dispatch({
        type: 'SHOW_TOAST',
        payload: { message: state.language === 'ja' ? '接続を削除しました' : 'Connection deleted', type: 'info' },
      });
    }
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  const handleDuplicate = () => {
    if (node) {
      const newNode = {
        ...node,
        id: generateId(),
        position: {
          x: node.position.x + 30,
          y: node.position.y + 30,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      dispatch({ type: 'ADD_NODE', payload: newNode });
      dispatch({
        type: 'SHOW_TOAST',
        payload: { message: state.language === 'ja' ? 'ノードを複製しました' : 'Node duplicated', type: 'success' },
      });
    }
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  const handleOpenUrl = () => {
    if (node?.url) {
      window.open(node.url, '_blank');
    }
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  const handleToggleActive = () => {
    if (targetId) {
      dispatch({ type: 'TOGGLE_CONNECTION_ACTIVE', payload: targetId });
    }
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  const handleAddNode = () => {
    dispatch({ type: 'OPEN_ADD_NODE_MODAL' });
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  // Open NodeActionMenu (UE Blueprint style)
  const handleAddAction = () => {
    if (targetId) {
      dispatch({
        type: 'OPEN_ACTION_MENU',
        payload: { nodeId: targetId, position: { x: x + 20, y: y + 20 } },
      });
    }
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  // Toggle run for Patch mode (Node)
  const handleToggleRun = () => {
    if (targetId && node) {
      // Determine what the new state will be after toggle
      // undefined -> false (SKIP), false -> true (RUN), true -> false (SKIP)
      const currentToggle = node.runToggle;
      const willBeRun = currentToggle === false; // false -> true means will be RUN

      dispatch({ type: 'TOGGLE_NODE_RUN', payload: targetId });
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: state.language === 'ja'
            ? (willBeRun ? '実行を有効化しました (RUN)' : '実行をスキップに設定しました (SKIP)')
            : (willBeRun ? 'Enabled execution (RUN)' : 'Set to skip (SKIP)'),
          type: 'info',
        },
      });
    }
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  // Toggle run for Patch mode (Connector)
  const handleToggleConnectorRun = () => {
    if (targetId && connectorNode) {
      const currentToggle = connectorNode.runToggle;
      const willBeRun = currentToggle === false;

      dispatch({ type: 'TOGGLE_CONNECTOR_RUN', payload: targetId });
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: state.language === 'ja'
            ? (willBeRun ? 'コネクタを RUN に設定しました' : 'コネクタを SKIP に設定しました')
            : (willBeRun ? 'Connector set to RUN' : 'Connector set to SKIP'),
          type: 'info',
        },
      });
    }
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  // Open connector settings
  const handleOpenConnectorSettings = () => {
    if (connectorNode) {
      dispatch({ type: 'OPEN_CONNECTOR_MODAL', payload: connectorNode.connectorId });
    }
    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  // Create GitHub Repository from attached file
  const handleCreateGitHubRepo = async () => {
    if (!node?.attachedFile) return;

    const spec = parseSpecFile(node.attachedFile.content, node.attachedFile.name);
    const githubConfig = state.connectors.find(c => c.name === 'GitHub');

    if (!githubConfig?.config?.apiKey) {
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: state.language === 'ja'
            ? 'GitHubコネクタのAPIキーを設定してください'
            : 'Please configure GitHub API key',
          type: 'error',
        },
      });
      dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
      return;
    }

    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        message: state.language === 'ja'
          ? `リポジトリ「${spec.title}」を作成中...`
          : `Creating repository "${spec.title}"...`,
        type: 'info',
      },
    });

    try {
      const result = await githubConnector.createRepository({
        name: spec.title,
        description: spec.description || node.description,
        private: false,
      }, githubConfig.config.apiKey);

      if (result.success) {
        dispatch({
          type: 'SHOW_TOAST',
          payload: {
            message: state.language === 'ja'
              ? `リポジトリ「${spec.title}」を作成しました!`
              : `Repository "${spec.title}" created!`,
            type: 'success',
          },
        });

        // Update node status
        if (node) {
          dispatch({
            type: 'UPDATE_NODE',
            payload: { ...node, status: 'done', updatedAt: Date.now() },
          });
        }
      } else {
        dispatch({
          type: 'SHOW_TOAST',
          payload: {
            message: state.language === 'ja'
              ? `エラー: ${result.message}`
              : `Error: ${result.message}`,
            type: 'error',
          },
        });
      }

      console.log('GitHub repo result:', result);
    } catch (error) {
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: state.language === 'ja'
            ? `エラー: ${error instanceof Error ? error.message : 'リポジトリ作成に失敗'}`
            : `Error: ${error instanceof Error ? error.message : 'Failed to create repository'}`,
          type: 'error',
        },
      });
    }

    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  // Create Firebase Project from attached file
  const handleCreateFirebaseProject = async () => {
    if (!node?.attachedFile) return;

    const spec = parseSpecFile(node.attachedFile.content, node.attachedFile.name);
    const firebaseConfig = state.connectors.find(c => c.name === 'Firebase');

    if (!firebaseConfig?.config?.apiKey) {
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: state.language === 'ja'
            ? 'FirebaseコネクタのAPIキーを設定してください'
            : 'Please configure Firebase API key',
          type: 'error',
        },
      });
      dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
      return;
    }

    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        message: state.language === 'ja'
          ? `プロジェクト「${spec.title}」を作成中...`
          : `Creating project "${spec.title}"...`,
        type: 'info',
      },
    });

    // Note: Firebase project creation requires Firebase Admin SDK
    // This is a simulation for demonstration
    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        message: state.language === 'ja'
          ? `プロジェクト「${spec.title}」の作成をシミュレート（実際のFirebase APIが必要）`
          : `Simulating project "${spec.title}" creation (requires actual Firebase API)`,
        type: 'warning',
      },
    });

    // Update node status
    if (node) {
      dispatch({
        type: 'UPDATE_NODE',
        payload: { ...node, status: 'done', updatedAt: Date.now() },
      });
    }

    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  // Generate code with AI connector
  const handleGenerateWithAI = async (connectorName: 'Claude Code' | 'Gemini Code') => {
    if (!node?.attachedFile) return;

    const spec = parseSpecFile(node.attachedFile.content, node.attachedFile.name);
    const aiConfig = state.connectors.find(c => c.name === connectorName);

    if (!aiConfig?.config?.apiKey) {
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: state.language === 'ja'
            ? `${connectorName}コネクタのAPIキーを設定してください`
            : `Please configure ${connectorName} API key`,
          type: 'error',
        },
      });
      dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
      return;
    }

    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        message: state.language === 'ja'
          ? `${connectorName}で「${spec.title}」を生成中...`
          : `Generating "${spec.title}" with ${connectorName}...`,
        type: 'info',
      },
    });

    try {
      const prompt = `Based on the following specification, generate a project structure and initial code:

Title: ${spec.title}
Description: ${spec.description}

Full Specification:
${spec.rawContent}

Please provide:
1. Project structure
2. Key files to create
3. Initial implementation`;

      // Set the API key and call the appropriate method
      let result;
      if (connectorName === 'Claude Code') {
        claudeConnector.setApiKey(aiConfig.config.apiKey);
        result = await claudeConnector.sendMessage(prompt);
      } else {
        geminiConnector.setApiKey(aiConfig.config.apiKey);
        result = await geminiConnector.generateContent(prompt);
      }

      if (result.success) {
        dispatch({
          type: 'SHOW_TOAST',
          payload: {
            message: state.language === 'ja'
              ? `${connectorName}による生成が完了しました`
              : `Generation with ${connectorName} completed`,
            type: 'success',
          },
        });

        // Update node with generated content in memo
        if (node) {
          dispatch({
            type: 'UPDATE_NODE',
            payload: {
              ...node,
              status: 'done',
              memo: (result.data as string) || result.message || '',
              updatedAt: Date.now(),
            },
          });
        }
      } else {
        dispatch({
          type: 'SHOW_TOAST',
          payload: {
            message: state.language === 'ja'
              ? `エラー: ${result.message}`
              : `Error: ${result.message}`,
            type: 'error',
          },
        });
      }

      console.log('AI generation result:', result);
    } catch (error) {
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: state.language === 'ja'
            ? `エラー: ${error instanceof Error ? error.message : '生成に失敗'}`
            : `Error: ${error instanceof Error ? error.message : 'Generation failed'}`,
          type: 'error',
        },
      });
    }

    dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
  };

  // Check which connectors are available for file actions
  const hasGitHubConnector = connectedConnectors.some(c => c.name === 'GitHub');
  const hasFirebaseConnector = connectedConnectors.some(c => c.name === 'Firebase');
  const hasClaudeConnector = connectedConnectors.some(c => c.name === 'Claude Code');
  const hasGeminiConnector = connectedConnectors.some(c => c.name === 'Gemini Code');

  // Position adjustment to keep menu in viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {type === 'node' && !isConnectorNode && (
        <>
          <div className="context-menu-item" onClick={handleEdit}>
            ✏️ {t('edit', state.language)}
          </div>
          <div className="context-menu-item" onClick={handleDuplicate}>
            📋 {t('duplicateNode', state.language)}
          </div>
          <div className="context-menu-divider" />
          {/* UE Blueprint style - Add Action */}
          <div className="context-menu-item action-menu-trigger" onClick={handleAddAction}>
            🔍 {state.language === 'ja' ? 'アクションを追加...' : 'Add Action...'}
          </div>
          {/* Patch mode - Toggle Run/Skip */}
          {state.executionMode === 'patch' && (
            <div className="context-menu-item" onClick={handleToggleRun}>
              {node?.runToggle === false ? '▶️' : '⏸️'}
              {' '}
              {state.language === 'ja'
                ? (node?.runToggle === false ? 'RUN に設定' : 'SKIP に設定')
                : (node?.runToggle === false ? 'Set to RUN' : 'Set to SKIP')}
            </div>
          )}
          {node?.actions && node.actions.length > 0 && (
            <div className="context-menu-info">
              📌 {node.actions.length} {state.language === 'ja' ? 'アクション設定済み' : 'actions configured'}
            </div>
          )}
          {/* File-based Actions */}
          {hasAttachedFile && connectedConnectors.length > 0 && (
            <>
              <div className="context-menu-divider" />
              <div className="context-menu-section-label">
                📄 {state.language === 'ja' ? 'ファイルアクション' : 'File Actions'}
              </div>
              {hasGitHubConnector && (
                <div className="context-menu-item action-item" onClick={handleCreateGitHubRepo}>
                  🐙 {state.language === 'ja' ? '新規リポジトリ作成' : 'Create New Repository'}
                </div>
              )}
              {hasFirebaseConnector && (
                <div className="context-menu-item action-item" onClick={handleCreateFirebaseProject}>
                  🔥 {state.language === 'ja' ? '新規プロジェクト作成' : 'Create New Project'}
                </div>
              )}
              {hasClaudeConnector && (
                <div className="context-menu-item action-item" onClick={() => handleGenerateWithAI('Claude Code')}>
                  🤖 {state.language === 'ja' ? 'Claudeでコード生成' : 'Generate with Claude'}
                </div>
              )}
              {hasGeminiConnector && (
                <div className="context-menu-item action-item" onClick={() => handleGenerateWithAI('Gemini Code')}>
                  💎 {state.language === 'ja' ? 'Geminiでコード生成' : 'Generate with Gemini'}
                </div>
              )}
            </>
          )}
          {hasAttachedFile && connectedConnectors.length === 0 && (
            <>
              <div className="context-menu-divider" />
              <div className="context-menu-info">
                📄 {state.language === 'ja'
                  ? 'コネクタに接続してファイルアクションを有効化'
                  : 'Connect to connector to enable file actions'}
              </div>
            </>
          )}
          <div className="context-menu-divider" />
          <div
            className={`context-menu-item ${!node?.url ? 'disabled' : ''}`}
            onClick={node?.url ? handleOpenUrl : undefined}
          >
            🔗 {t('openUrl', state.language)}
          </div>
          <div className="context-menu-divider" />
          <div className="context-menu-item danger" onClick={handleDelete}>
            🗑️ {t('deleteNode', state.language)}
          </div>
        </>
      )}

      {/* Connector Node Context Menu */}
      {type === 'node' && isConnectorNode && (
        <>
          <div className="context-menu-item" onClick={handleOpenConnectorSettings}>
            ⚙️ {state.language === 'ja' ? '設定' : 'Settings'}
          </div>
          {/* Patch mode - Toggle Run/Skip for Connector */}
          {state.executionMode === 'patch' && (
            <>
              <div className="context-menu-divider" />
              <div className="context-menu-item" onClick={handleToggleConnectorRun}>
                {connectorNode?.runToggle === false ? '▶️' : '⏸️'}
                {' '}
                {state.language === 'ja'
                  ? (connectorNode?.runToggle === false ? 'RUN に設定' : 'SKIP に設定')
                  : (connectorNode?.runToggle === false ? 'Set to RUN' : 'Set to SKIP')}
              </div>
            </>
          )}
          <div className="context-menu-divider" />
          <div className="context-menu-item danger" onClick={handleDelete}>
            🗑️ {state.language === 'ja' ? 'コネクタを削除' : 'Delete Connector'}
          </div>
        </>
      )}

      {type === 'connection' && (
        <>
          <div className="context-menu-item" onClick={handleToggleActive}>
            ⚡ {t('toggleActive', state.language)}
          </div>
          <div className="context-menu-divider" />
          <div className="context-menu-item danger" onClick={handleDelete}>
            🗑️ {t('deleteConnection', state.language)}
          </div>
        </>
      )}

      {type === 'canvas' && (
        <>
          <div className="context-menu-item" onClick={handleAddNode}>
            ➕ {t('addNode', state.language)}
          </div>
        </>
      )}
    </div>
  );
}
