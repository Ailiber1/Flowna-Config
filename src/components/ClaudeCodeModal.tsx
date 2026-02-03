import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../contexts/AppContext';

interface ClaudeCodeModalProps {
  prompt: string;
  onClose: () => void;
}

export default function ClaudeCodeModal({ prompt, onClose }: ClaudeCodeModalProps) {
  const { state, dispatch } = useApp();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: state.language === 'ja'
            ? 'クリップボードにコピーしました！'
            : 'Copied to clipboard!',
          type: 'success',
        },
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: state.language === 'ja'
            ? 'コピーに失敗しました'
            : 'Failed to copy',
          type: 'error',
        },
      });
    }
  };

  const handleOpenClaudeCode = () => {
    // Copy first, then open
    navigator.clipboard.writeText(prompt).then(() => {
      window.open('https://claude.ai', '_blank');
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: state.language === 'ja'
            ? 'コピーしました！Claude.aiで貼り付けてください'
            : 'Copied! Paste in Claude.ai',
          type: 'success',
        },
      });
    });
  };

  const handleDownload = () => {
    const blob = new Blob([prompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `flowna-instructions-${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        message: state.language === 'ja'
          ? '指示書をダウンロードしました'
          : 'Instructions downloaded',
        type: 'success',
      },
    });
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal claude-code-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            {state.language === 'ja' ? '🤖 Claude Code 指示書' : '🤖 Claude Code Instructions'}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Big Copy Button at Top */}
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.2), rgba(75, 0, 130, 0.15))',
            borderBottom: '1px solid rgba(138, 43, 226, 0.3)',
            textAlign: 'center',
          }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '16px 48px',
                fontSize: '18px',
                fontWeight: 700,
                background: copied
                  ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                  : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
              }}
            >
              {copied
                ? (state.language === 'ja' ? '✓ コピー完了！' : '✓ Copied!')
                : (state.language === 'ja' ? '📋 指示書を一括コピー' : '📋 Copy All Instructions')}
            </button>
            <p style={{
              marginTop: '12px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}>
              {state.language === 'ja'
                ? 'コピー後、ターミナルで「claude」を起動して貼り付け'
                : 'After copying, run "claude" in terminal and paste'}
            </p>
          </div>

          {/* Generated Prompt Preview */}
          <div style={{ padding: '20px' }}>
            <p style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '12px'
            }}>
              {state.language === 'ja' ? '生成された指示書:' : 'Generated Instructions:'}
            </p>
            <div style={{
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '8px',
              padding: '16px',
              maxHeight: '350px',
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              color: 'var(--text-primary)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              {prompt}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            {state.language === 'ja' ? '閉じる' : 'Close'}
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={handleDownload}
            >
              💾 {state.language === 'ja' ? 'ダウンロード' : 'Download'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleOpenClaudeCode}
            >
              🌐 {state.language === 'ja' ? 'Claude.ai を開く' : 'Open Claude.ai'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
