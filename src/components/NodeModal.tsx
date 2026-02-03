import { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { t } from '../utils/i18n';
import { generateId } from '../utils/storage';
import type { FlowNode, AttachedFile } from '../types';

const ALLOWED_FILE_TYPES = ['.txt', '.md'];

// Default values for nodes (no user customization)
const DEFAULT_CATEGORY = 'SYSTEM';
const DEFAULT_ICON = '📋';
const DEFAULT_COLOR = '#60a5fa';

interface NodeModalProps {
  mode: 'add' | 'edit';
  nodeId?: string;
  onClose: () => void;
}

export function NodeModal({ mode, nodeId, onClose }: NodeModalProps) {
  const { state, dispatch } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingNode = nodeId ? state.nodes.find(n => n.id === nodeId) : null;

  // Initialize state only once on mount using initializer functions
  // This prevents the useEffect from resetting values when existingNode reference changes
  const [title, setTitle] = useState(() => existingNode?.title || '');
  const [description, setDescription] = useState(() => existingNode?.description || '');
  const [url, setUrl] = useState(() => existingNode?.url || '');
  const [attachedFile, setAttachedFile] = useState<AttachedFile | undefined>(() => existingNode?.attachedFile);
  const [error, setError] = useState('');

  // Only re-initialize if nodeId prop changes (opening a different node)
  // This prevents resetting user's input when other state changes cause re-renders
  useEffect(() => {
    if (nodeId) {
      const node = state.nodes.find(n => n.id === nodeId);
      if (node) {
        setTitle(node.title);
        setDescription(node.description);
        setUrl(node.url);
        setAttachedFile(node.attachedFile);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(ext)) {
      setError(state.language === 'ja'
        ? '対応ファイル形式: .txt, .md'
        : 'Allowed file types: .txt, .md');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAttachedFile({
        name: file.name,
        content,
        type: ext.replace('.', ''),
        uploadedAt: Date.now(),
      });
      setError('');
    };
    reader.readAsText(file);
  };

  const handleRemoveFile = () => {
    setAttachedFile(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError(state.language === 'ja' ? 'ノード名は必須です' : 'Node name is required');
      return;
    }

    // Safeguard: if editing but node no longer exists, show error
    if (mode === 'edit' && !existingNode) {
      setError(state.language === 'ja' ? 'ノードが見つかりません' : 'Node not found');
      return;
    }

    // In edit mode, always use the existing node's ID
    const nodeId = mode === 'edit' && existingNode ? existingNode.id : generateId();

    // Use existing values or defaults for hidden fields
    const category = existingNode?.category || DEFAULT_CATEGORY;
    const icon = existingNode?.icon || DEFAULT_ICON;
    const color = existingNode?.color || DEFAULT_COLOR;
    const status = existingNode?.status || 'waiting';

    const nodeData: FlowNode = {
      id: nodeId,
      title: title.trim(),
      displayName: title.trim(),
      description: description.trim(),
      category,
      categoryDisplayName: category,
      icon,
      color,
      url: url.trim(),
      status,
      memo: existingNode?.memo || '',
      position: existingNode?.position || {
        x: window.innerWidth / 2 - 110 - state.viewport.panX,
        y: window.innerHeight / 2 - 80 - state.viewport.panY,
      },
      connectorLinks: existingNode?.connectorLinks || [],
      createdAt: existingNode?.createdAt || Date.now(),
      updatedAt: Date.now(),
      attachedFile,
    };

    if (mode === 'add') {
      dispatch({ type: 'ADD_NODE', payload: nodeData });
      dispatch({
        type: 'SHOW_TOAST',
        payload: { message: state.language === 'ja' ? 'ノードを追加しました' : 'Node added', type: 'success' },
      });
    } else {
      dispatch({ type: 'UPDATE_NODE', payload: nodeData });
      dispatch({
        type: 'SHOW_TOAST',
        payload: { message: state.language === 'ja' ? 'ノードを更新しました' : 'Node updated', type: 'success' },
      });
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === 'add' ? t('addNode', state.language) : t('editNode', state.language)}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ color: 'var(--status-error)', marginBottom: '16px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label required">{t('nodeName', state.language)}</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={state.language === 'ja' ? 'ノード名を入力' : 'Enter node name'}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('description', state.language)}</label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={state.language === 'ja' ? '説明を入力（任意）' : 'Enter description (optional)'}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('url', state.language)}</label>
              <input
                type="url"
                className="form-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {/* File Upload Section */}
            <div className="form-group">
              <label className="form-label">
                {state.language === 'ja' ? '添付ファイル（仕様書等）' : 'Attached File (Spec, etc.)'}
              </label>
              {attachedFile ? (
                <div className="attached-file-info">
                  <div className="attached-file-display">
                    <span className="attached-file-icon">📄</span>
                    <span className="attached-file-name">{attachedFile.name}</span>
                    <span className="attached-file-size">
                      ({Math.round(attachedFile.content.length / 1024 * 10) / 10} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-small btn-danger"
                    onClick={handleRemoveFile}
                  >
                    {state.language === 'ja' ? '削除' : 'Remove'}
                  </button>
                </div>
              ) : (
                <div className="file-upload-area">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileUpload}
                    className="file-input-hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="file-upload-label">
                    <span className="file-upload-icon">📁</span>
                    <span className="file-upload-text">
                      {state.language === 'ja'
                        ? 'クリックしてファイルを選択 (.txt, .md)'
                        : 'Click to select file (.txt, .md)'}
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('cancel', state.language)}
            </button>
            <button type="submit" className="btn btn-primary">
              {mode === 'add' ? t('create', state.language) : t('save', state.language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
