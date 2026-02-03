import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { t } from '../utils/i18n';
import { generateId, saveWorkflow, getWorkflows } from '../utils/storage';
import type { Workflow } from '../types';

interface SaveWorkflowModalProps {
  onClose: () => void;
}

export function SaveWorkflowModal({ onClose }: SaveWorkflowModalProps) {
  const { state, dispatch } = useApp();

  // Pre-fill with current workflow name if loaded
  const [name, setName] = useState(state.currentWorkflowName || '');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [existingWorkflow, setExistingWorkflow] = useState<Workflow | null>(null);
  const [duplicateIds, setDuplicateIds] = useState<string[]>([]);

  const createWorkflowData = (id: string, createdAt?: number): Workflow => {
    const customCategories = state.categories.filter(
      cat => !['agent', 'logic', 'system', 'rule'].includes(cat.id)
    );

    // Filter to only valid connections (both endpoints must exist)
    const validConnections = state.connections.filter(conn => {
      const fromExists = state.nodes.some(n => n.id === conn.from) ||
                         state.connectorNodes.some(cn => cn.id === conn.from);
      const toExists = state.nodes.some(n => n.id === conn.to) ||
                       state.connectorNodes.some(cn => cn.id === conn.to);
      return fromExists && toExists;
    });

    return {
      id,
      name: name.trim(),
      description: description.trim(),
      folderId: 'default',
      nodes: state.nodes,
      connections: validConnections,
      connectorNodes: state.connectorNodes,
      viewport: state.viewport,
      customCategories,
      thumbnail: '',
      tags: [],
      createdAt: createdAt || Date.now(),
      updatedAt: Date.now(),
      lastOpenedAt: Date.now(),
    };
  };

  const doSave = (workflow: Workflow, isOverwrite: boolean, duplicateIds?: string[]) => {
    // If overwriting and there are duplicates, remove them first from localStorage
    if (isOverwrite && duplicateIds && duplicateIds.length > 0) {
      // Get current workflows from localStorage
      let workflows = getWorkflows();
      // Remove all duplicates except the one we're overwriting
      workflows = workflows.filter(w => !duplicateIds.includes(w.id) || w.id === workflow.id);
      localStorage.setItem('flowna_workflows', JSON.stringify(workflows));
    }

    // Save to localStorage
    saveWorkflow(workflow);

    // Reload workflows from localStorage to ensure state is in sync
    const updatedWorkflows = getWorkflows();
    dispatch({ type: 'SET_WORKFLOWS', payload: updatedWorkflows });

    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        message: state.language === 'ja'
          ? (isOverwrite ? 'ワークフローを上書き保存しました' : 'ワークフローを保存しました')
          : (isOverwrite ? 'Workflow overwritten' : 'Workflow saved'),
        type: 'success',
      },
    });

    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(state.language === 'ja' ? 'ワークフロー名は必須です' : 'Workflow name is required');
      return;
    }

    // Check if workflow(s) with same name already exist (find all duplicates)
    const duplicates = state.workflows.filter(w => w.name.toLowerCase() === name.trim().toLowerCase());
    if (duplicates.length > 0) {
      // Use the first one as the "main" existing workflow (keep its ID and createdAt)
      setExistingWorkflow(duplicates[0]);
      // Store all duplicate IDs (including the first one)
      setDuplicateIds(duplicates.map(w => w.id));
      setShowOverwriteConfirm(true);
      return;
    }

    // No duplicate, save as new
    const workflow = createWorkflowData(generateId());
    doSave(workflow, false);
  };

  const handleOverwriteConfirm = () => {
    if (!existingWorkflow) return;
    const workflow = createWorkflowData(existingWorkflow.id, existingWorkflow.createdAt);
    // Pass all duplicate IDs to remove them (except the one we're keeping)
    doSave(workflow, true, duplicateIds);
  };

  const handleOverwriteCancel = () => {
    setShowOverwriteConfirm(false);
    setExistingWorkflow(null);
    setDuplicateIds([]);
  };

  // Quick overwrite for currently loaded workflow
  const handleQuickOverwrite = () => {
    if (!state.currentWorkflowId || !state.currentWorkflowName) return;

    const currentWorkflow = state.workflows.find(w => w.id === state.currentWorkflowId);
    if (!currentWorkflow) return;

    const workflow = createWorkflowData(currentWorkflow.id, currentWorkflow.createdAt);
    workflow.name = currentWorkflow.name; // Keep original name
    doSave(workflow, true);
  };

  // Overwrite confirmation dialog
  if (showOverwriteConfirm) {
    return (
      <div className="modal-overlay" onClick={handleOverwriteCancel}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
          <div className="modal-header">
            <h2 className="modal-title">
              {state.language === 'ja' ? '上書き確認' : 'Confirm Overwrite'}
            </h2>
            <button className="modal-close" onClick={handleOverwriteCancel}>×</button>
          </div>

          <div className="modal-body">
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', marginBottom: '8px' }}>
                {state.language === 'ja'
                  ? `「${existingWorkflow?.name}」は既に存在します。`
                  : `"${existingWorkflow?.name}" already exists.`}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                {state.language === 'ja'
                  ? '上書きしますか？'
                  : 'Do you want to overwrite it?'}
              </p>
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleOverwriteCancel}
            >
              {state.language === 'ja' ? 'いいえ' : 'No'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOverwriteConfirm}
            >
              {state.language === 'ja' ? 'はい' : 'Yes'}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                📊 {state.nodes.length} {state.language === 'ja' ? 'ノード' : 'nodes'}
                {state.connectorNodes.length > 0 && (
                  <>, 🔌 {state.connectorNodes.length} {state.language === 'ja' ? 'コネクタ' : 'connectors'}</>
                )}
                , 🔗 {state.connections.filter(conn => {
                  const fromExists = state.nodes.some(n => n.id === conn.from) || state.connectorNodes.some(cn => cn.id === conn.from);
                  const toExists = state.nodes.some(n => n.id === conn.to) || state.connectorNodes.some(cn => cn.id === conn.to);
                  return fromExists && toExists;
                }).length} {state.language === 'ja' ? '接続' : 'connections'}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('cancel', state.language)}
            </button>
            {state.currentWorkflowId && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleQuickOverwrite}
                style={{ background: 'var(--accent-orange)' }}
              >
                {state.language === 'ja' ? '上書き保存' : 'Overwrite'}
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              {state.currentWorkflowId
                ? (state.language === 'ja' ? '新規保存' : 'Save as New')
                : t('save', state.language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
