import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from '../utils/i18n';
import type { ExecutionPlan, ExecutionPlanItem } from '../types';

interface Props {
  plan: ExecutionPlan | null;
  onClose: () => void;
}

export default function ExecutionPlanPreview({ plan, onClose }: Props) {
  const { state } = useApp();
  const { t } = useTranslation(state.language);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  if (!plan) return null;

  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'run':
        return <span className="plan-badge run">RUN</span>;
      case 'skip':
        return <span className="plan-badge skip">SKIP</span>;
      case 'blocked':
        return <span className="plan-badge blocked">BLOCKED</span>;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'run': return '#4ade80';
      case 'skip': return '#6b8a99';
      case 'blocked': return '#ef4444';
      default: return '#6b8a99';
    }
  };

  return (
    <div className="execution-plan-preview">
      <div className="plan-header">
        <div className="plan-title">
          <span className="plan-icon">📋</span>
          <span>{t('executionPlan') || 'Execution Plan'}</span>
        </div>
        <button className="plan-close" onClick={onClose}>×</button>
      </div>

      <div className="plan-summary">
        <div className="plan-summary-item run">
          <span className="count">{plan.runCount}</span>
          <span className="label">{t('willRun') || 'RUN'}</span>
        </div>
        <div className="plan-summary-item skip">
          <span className="count">{plan.skipCount}</span>
          <span className="label">{t('willSkip') || 'SKIP'}</span>
        </div>
        {plan.blockedCount > 0 && (
          <div className="plan-summary-item blocked">
            <span className="count">{plan.blockedCount}</span>
            <span className="label">{t('blocked') || 'BLOCKED'}</span>
          </div>
        )}
      </div>

      <div className="plan-mode-info">
        <span className="mode-badge" data-mode={plan.mode}>
          {plan.mode === 'create' ? 'CREATE' : 'PATCH'}
        </span>
        <span className="revision">Rev. {plan.revision}</span>
      </div>

      <div className="plan-items">
        {plan.items.map((item: ExecutionPlanItem) => (
          <div
            key={item.nodeId}
            className={`plan-item ${item.status}`}
            style={{ borderLeftColor: getStatusColor(item.status) }}
          >
            <div
              className="plan-item-header"
              onClick={() => toggleExpand(item.nodeId)}
            >
              <span className="expand-icon">
                {expandedItems.has(item.nodeId) ? '▼' : '▶'}
              </span>
              {getStatusBadge(item.status)}
              <span className="node-name">{item.nodeName}</span>
              {item.actions.length > 0 && (
                <span className="action-count">{item.actions.length} actions</span>
              )}
            </div>

            {expandedItems.has(item.nodeId) && (
              <div className="plan-item-details">
                <div className="detail-row">
                  <span className="detail-label">{t('reason') || 'Reason'}:</span>
                  <span className="detail-value">{item.reason}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('inputHash') || 'Hash'}:</span>
                  <code className="hash-value">{item.inputHash}</code>
                </div>
                {item.previousHash && (
                  <div className="detail-row">
                    <span className="detail-label">{t('prevHash') || 'Prev'}:</span>
                    <code className="hash-value">{item.previousHash}</code>
                    {item.inputHash !== item.previousHash && (
                      <span className="hash-changed">Changed</span>
                    )}
                  </div>
                )}
                {item.actions.length > 0 && (
                  <div className="actions-list">
                    <span className="detail-label">{t('actions') || 'Actions'}:</span>
                    {item.actions.map(action => (
                      <div key={action.id} className="action-item">
                        <span className="action-icon">{action.icon}</span>
                        <span className="action-name">{action.name}</span>
                        {!action.enabled && (
                          <span className="action-disabled">Disabled</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Compact inline preview for TopBar
export function PlanPreviewCompact() {
  const { state } = useApp();
  const { t } = useTranslation(state.language);
  const plan = state.executionPlan;

  if (!plan) {
    return (
      <div className="plan-preview-compact empty">
        <span className="preview-icon">📋</span>
        <span className="preview-text">{t('noPlan') || 'No plan'}</span>
      </div>
    );
  }

  return (
    <div className="plan-preview-compact">
      <span className="preview-icon">📋</span>
      <span className="preview-run">{plan.runCount}</span>
      <span className="preview-separator">/</span>
      <span className="preview-skip">{plan.skipCount}</span>
      {plan.blockedCount > 0 && (
        <>
          <span className="preview-separator">/</span>
          <span className="preview-blocked">{plan.blockedCount}</span>
        </>
      )}
    </div>
  );
}
