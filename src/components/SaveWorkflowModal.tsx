import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { t } from '../utils/i18n';
import { generateId, saveWorkflow } from '../utils/storage';
import type { Workflow } from '../types';

interface SaveWorkflowModalProps {
  onClose: () => void;
}

export function SaveWorkflowModal({ onClose }: SaveWorkflowModalProps) {
  const { state, dispatch } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(state.language === 'ja' ? 'ワークフロー名は必須です' : 'Workflow name is required');
      return;
    }

    const customCategories = state.categories.filter(
      cat => !['agent', 'logic', 'system', 'rule'].includes(cat.id)
    );

    const workflow: Workflow = {
      id: generateId(),
      name: name.trim(),
      description: description.trim(),
      folderId: 'default',
      nodes: state.nodes,
      connections: state.connections,
      viewport: state.viewport,
      customCategories,
      thumbnail: '',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastOpenedAt: Date.now(),
    };

    // Save to localStorage
    saveWorkflow(workflow);

    // Update state
    dispatch({ type: 'ADD_WORKFLOW', payload: workflow });

    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        message: state.language === 'ja' ? 'ワークフローを保存しました' : 'Workflow saved',
        type: 'success',
      },
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('saveWorkflow', state.language)}</h2>
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
              <label className="form-label required">{t('workflowName', state.language)}</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={state.language === 'ja' ? 'ワークフロー名を入力' : 'Enter workflow name'}
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

            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(13, 33, 55, 0.5)', borderRadius: '8px' }}>
              <div style={{ fontFamily: 'Share Tech Mono', fontSize: '11px', color: 'var(--text-secondary)' }}>
                {state.language === 'ja' ? '保存内容' : 'Content to save'}
              </div>
              <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
                📊 {state.nodes.length} {state.language === 'ja' ? 'ノード' : 'nodes'}, {state.connections.length} {state.language === 'ja' ? '接続' : 'connections'}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('cancel', state.language)}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('save', state.language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
