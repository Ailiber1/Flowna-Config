import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { t } from '../utils/i18n';
import { generateId } from '../utils/storage';
import type { FlowNode } from '../types';

const ICON_OPTIONS = ['🤖', '⚡', '⚙️', '📋', '💡', '🔧', '📁', '🎯', '📊', '🔗', '☁️', '🐙', '💎', '🚀', '📝'];
const COLOR_OPTIONS = ['#a78bfa', '#60a5fa', '#ff8800', '#4ade80', '#f472b6', '#fbbf24', '#ef4444', '#06b6d4'];

interface NodeModalProps {
  mode: 'add' | 'edit';
  nodeId?: string;
  onClose: () => void;
}

export function NodeModal({ mode, nodeId, onClose }: NodeModalProps) {
  const { state, dispatch } = useApp();

  const existingNode = nodeId ? state.nodes.find(n => n.id === nodeId) : null;

  const [title, setTitle] = useState(existingNode?.title || '');
  const [displayName, setDisplayName] = useState(existingNode?.displayName || '');
  const [description, setDescription] = useState(existingNode?.description || '');
  const [category, setCategory] = useState(existingNode?.category || 'AGENT');
  const [icon, setIcon] = useState(existingNode?.icon || '🤖');
  const [color, setColor] = useState(existingNode?.color || '#a78bfa');
  const [url, setUrl] = useState(existingNode?.url || '');
  const [status, setStatus] = useState<'todo' | 'doing' | 'done'>(existingNode?.status || 'todo');
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingNode) {
      setTitle(existingNode.title);
      setDisplayName(existingNode.displayName);
      setDescription(existingNode.description);
      setCategory(existingNode.category);
      setIcon(existingNode.icon);
      setColor(existingNode.color);
      setUrl(existingNode.url);
      setStatus(existingNode.status);
    }
  }, [existingNode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError(state.language === 'ja' ? 'ノード名は必須です' : 'Node name is required');
      return;
    }

    const categoryData = state.categories.find(c => c.name === category) || state.categories[0];

    const nodeData: FlowNode = {
      id: existingNode?.id || generateId(),
      title: title.trim(),
      displayName: displayName.trim() || title.trim(),
      description: description.trim(),
      category,
      categoryDisplayName: categoryData.displayName,
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

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    const categoryData = state.categories.find(c => c.name === newCategory);
    if (categoryData) {
      setIcon(categoryData.icon);
      setColor(categoryData.color);
    }
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
              <label className="form-label">{t('displayName', state.language)}</label>
              <input
                type="text"
                className="form-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={state.language === 'ja' ? '表示名（空欄の場合はノード名を使用）' : 'Display name (uses node name if empty)'}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('category', state.language)}</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {state.categories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.icon} {cat.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('icon', state.language)}</label>
              <div className="icon-picker">
                {ICON_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`icon-option ${icon === opt ? 'selected' : ''}`}
                    onClick={() => setIcon(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('color', state.language)}</label>
              <div className="color-picker">
                {COLOR_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`color-option ${color === opt ? 'selected' : ''}`}
                    style={{ backgroundColor: opt }}
                    onClick={() => setColor(opt)}
                  />
                ))}
              </div>
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

            <div className="form-group">
              <label className="form-label">{t('status', state.language)}</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'todo' | 'doing' | 'done')}
              >
                <option value="todo">{t('todo', state.language)}</option>
                <option value="doing">{t('doing', state.language)}</option>
                <option value="done">{t('done', state.language)}</option>
              </select>
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
