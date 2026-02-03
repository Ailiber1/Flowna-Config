import { useState } from 'react';
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal claude-code-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh' }}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            {state.language === 'ja' ? '🤖 Claude Code 指示' : '🤖 Claude Code Instructions'}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ padding: '0' }}>
          {/* Instructions */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.15), rgba(75, 0, 130, 0.1))',
            borderBottom: '1px solid rgba(138, 43, 226, 0.3)',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-purple)', marginBottom: '8px' }}>
              {state.language === 'ja' ? '使い方' : 'How to use'}
            </p>
            <ol style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '4px' }}>
                {state.language === 'ja'
                  ? '下の「コピー」ボタンをクリック'
                  : 'Click the "Copy" button below'}
              </li>
              <li style={{ marginBottom: '4px' }}>
                {state.language === 'ja'
                  ? 'ターミナルで claude コマンドを実行'
                  : 'Run claude command in terminal'}
              </li>
              <li>
                {state.language === 'ja'
                  ? 'コピーした指示を貼り付けて実行'
                  : 'Paste the instructions and execute'}
              </li>
            </ol>
          </div>

          {/* Generated Prompt */}
          <div style={{ padding: '20px' }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '8px',
              padding: '16px',
              maxHeight: '400px',
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
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {state.language === 'ja'
              ? '💡 ターミナルで「claude」と入力してClaude Codeを起動'
              : '💡 Type "claude" in terminal to start Claude Code'}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={handleOpenClaudeCode}
              style={{ fontSize: '13px' }}
            >
              🌐 {state.language === 'ja' ? 'Claude.ai を開く' : 'Open Claude.ai'}
            </button>
            <button
              className={`btn btn-primary ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              style={{
                fontSize: '13px',
                background: copied ? 'var(--status-connected)' : undefined,
              }}
            >
              {copied
                ? (state.language === 'ja' ? '✓ コピー完了' : '✓ Copied')
                : (state.language === 'ja' ? '📋 コピー' : '📋 Copy')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
