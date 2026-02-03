import { useState } from 'react';
import { useApp } from '../contexts/AppContext';

interface HelpGuideProps {
  onClose: () => void;
}

export default function HelpGuide({ onClose }: HelpGuideProps) {
  const { state } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const isJa = state.language === 'ja';

  const steps = isJa ? [
    {
      title: 'Flownaへようこそ！',
      icon: '🎉',
      content: [
        'Flownaは、アプリ開発のワークフローを視覚的に設計・管理するツールです。',
        'プログラミングの知識がなくても、ノードを繋げるだけで開発フローを作成できます。',
      ],
      illustration: (
        <div className="help-illustration welcome">
          <div className="illustration-nodes">
            <div className="illustration-node agent">🤖 Agent</div>
            <div className="illustration-arrow">→</div>
            <div className="illustration-node logic">⚡ Logic</div>
            <div className="illustration-arrow">→</div>
            <div className="illustration-node system">⚙️ System</div>
          </div>
        </div>
      ),
    },
    {
      title: 'ノードの追加',
      icon: '➕',
      content: [
        '左側の「ノードパレット」のノードをクリックすると、キャンバスに追加されます。',
        'Agent、Logic、System、Ruleなど、様々なタイプのノードがあります。',
      ],
      illustration: (
        <div className="help-illustration">
          <div className="illustration-panel">
            <div className="illustration-sidebar">
              <div className="sidebar-item">🤖 Agent</div>
              <div className="sidebar-item highlight">⚡ Logic</div>
              <div className="sidebar-item">⚙️ System</div>
            </div>
            <div className="illustration-canvas">
              <div className="drag-indicator">
                <span className="drag-icon">👆</span>
                <span className="drag-text">クリック</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'ノードを繋ぐ',
      icon: '🔗',
      content: [
        '出力ポート（右側の緑の丸）からドラッグして、',
        '別のノードの入力ポート（左側の緑の丸）にドロップします。',
        'これでノード間のデータの流れを定義できます。',
      ],
      illustration: (
        <div className="help-illustration">
          <div className="illustration-connection">
            <div className="conn-node">
              <span className="node-label">Node A</span>
              <span className="port output">●</span>
            </div>
            <div className="conn-line">
              <svg width="80" height="30">
                <path d="M0,15 Q40,15 80,15" stroke="#4ade80" strokeWidth="3" fill="none"/>
              </svg>
            </div>
            <div className="conn-node">
              <span className="port input">●</span>
              <span className="node-label">Node B</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'コネクタの追加',
      icon: '🔌',
      content: [
        '左側の「コネクタ」からGitHub、Claude Code、Firebaseなどを追加できます。',
        'コネクタを使うと、外部サービスと連携できます。',
      ],
      illustration: (
        <div className="help-illustration">
          <div className="illustration-connectors">
            <div className="connector-item">🐱 GitHub</div>
            <div className="connector-item">🦀 Claude Code</div>
            <div className="connector-item">☁️ Firebase</div>
          </div>
        </div>
      ),
    },
    {
      title: '新規作成モードとパッチモード',
      icon: '🔄',
      content: [
        '「新規作成」: 最初からアプリを作成するモード',
        '「パッチ」: 既存のアプリを更新・修正するモード',
        '画面上部のボタンで切り替えられます。',
      ],
      illustration: (
        <div className="help-illustration">
          <div className="illustration-modes">
            <div className="mode-btn create">✨ 新規作成</div>
            <div className="mode-btn patch">🔧 パッチ</div>
          </div>
          <div className="mode-description">
            <p>パッチモードでは、各ノードを「RUN」か「SKIP」に設定できます</p>
          </div>
        </div>
      ),
    },
    {
      title: '右クリックメニュー',
      icon: '🖱️',
      content: [
        'ノードやコネクタを右クリックすると、メニューが表示されます。',
        '編集、削除、RUN/SKIP切り替えなどの操作ができます。',
      ],
      illustration: (
        <div className="help-illustration">
          <div className="illustration-context-menu">
            <div className="context-item">✏️ 編集</div>
            <div className="context-item">▶️ RUN に設定</div>
            <div className="context-item danger">🗑️ 削除</div>
          </div>
        </div>
      ),
    },
    {
      title: 'ワークフローの保存',
      icon: '💾',
      content: [
        '画面上部の「保存」ボタンでワークフローを保存できます。',
        '保存したワークフローは、左側の「保存済みワークフロー」から開けます。',
      ],
      illustration: (
        <div className="help-illustration">
          <div className="illustration-save">
            <div className="save-btn">💾 保存</div>
            <div className="save-arrow">↓</div>
            <div className="save-list">
              <div className="save-item">📁 マイワークフロー</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'キーボードショートカット',
      icon: '⌨️',
      content: [
        'Ctrl+A: 全選択',
        'Ctrl+C / Ctrl+V: コピー＆ペースト',
        'Ctrl+Z: 元に戻す',
        'Delete: 選択したノードを削除',
      ],
      illustration: (
        <div className="help-illustration">
          <div className="illustration-shortcuts">
            <div className="shortcut"><kbd>Ctrl</kbd>+<kbd>A</kbd> 全選択</div>
            <div className="shortcut"><kbd>Ctrl</kbd>+<kbd>Z</kbd> 元に戻す</div>
            <div className="shortcut"><kbd>Del</kbd> 削除</div>
          </div>
        </div>
      ),
    },
  ] : [
    {
      title: 'Welcome to Flowna!',
      icon: '🎉',
      content: [
        'Flowna is a visual tool for designing and managing app development workflows.',
        'No programming knowledge required - just connect nodes to create your flow.',
      ],
      illustration: (
        <div className="help-illustration welcome">
          <div className="illustration-nodes">
            <div className="illustration-node agent">🤖 Agent</div>
            <div className="illustration-arrow">→</div>
            <div className="illustration-node logic">⚡ Logic</div>
            <div className="illustration-arrow">→</div>
            <div className="illustration-node system">⚙️ System</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Adding Nodes',
      icon: '➕',
      content: [
        'Click on a node in the "Node Palette" on the left to add it to the canvas.',
        'There are various node types: Agent, Logic, System, Rule, etc.',
      ],
      illustration: (
        <div className="help-illustration">
          <div className="illustration-panel">
            <div className="illustration-sidebar">
              <div className="sidebar-item">🤖 Agent</div>
              <div className="sidebar-item highlight">⚡ Logic</div>
              <div className="sidebar-item">⚙️ System</div>
            </div>
            <div className="illustration-canvas">
              <div className="drag-indicator">
                <span className="drag-icon">👆</span>
                <span className="drag-text">Click</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Connecting Nodes',
      icon: '🔗',
      content: [
        'Drag from the output port (green circle on the right)',
        'to the input port (green circle on the left) of another node.',
        'This defines the data flow between nodes.',
      ],
      illustration: (
        <div className="help-illustration">
          <div className="illustration-connection">
            <div className="conn-node">
              <span className="node-label">Node A</span>
              <span className="port output">●</span>
            </div>
            <div className="conn-line">
              <svg width="80" height="30">
                <path d="M0,15 Q40,15 80,15" stroke="#4ade80" strokeWidth="3" fill="none"/>
              </svg>
            </div>
            <div className="conn-node">
              <span className="port input">●</span>
              <span className="node-label">Node B</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Adding Connectors',
      icon: '🔌',
      content: [
        'Add connectors like GitHub, Claude Code, or Firebase from the left panel.',
        'Connectors allow integration with external services.',
      ],
      illustration: (
        <div className="help-illustration">
          <div className="illustration-connectors">
            <div className="connector-item">🐱 GitHub</div>
            <div className="connector-item">🦀 Claude Code</div>
            <div className="connector-item">☁️ Firebase</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Create vs Patch Mode',
      icon: '🔄',
      content: [
        '"Create": Build an app from scratch',
        '"Patch": Update or fix an existing app',
        'Switch between modes using the buttons at the top.',
      ],
      illustration: (
        <div className="help-illustration">
          <div className="illustration-modes">
            <div className="mode-btn create">✨ Create</div>
            <div className="mode-btn patch">🔧 Patch</div>
          </div>
          <div className="mode-description">
            <p>In Patch mode, set each node to "RUN" or "SKIP"</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Right-Click Menu',
      icon: '🖱️',
      content: [
        'Right-click on nodes or connectors to see the context menu.',
        'Edit, delete, or toggle RUN/SKIP from here.',
      ],
      illustration: (
        <div className="help-illustration">
          <div className="illustration-context-menu">
            <div className="context-item">✏️ Edit</div>
            <div className="context-item">▶️ Set to RUN</div>
            <div className="context-item danger">🗑️ Delete</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Saving Workflows',
      icon: '💾',
      content: [
        'Click the "Save" button at the top to save your workflow.',
        'Open saved workflows from "Saved Workflows" on the left.',
      ],
      illustration: (
        <div className="help-illustration">
          <div className="illustration-save">
            <div className="save-btn">💾 Save</div>
            <div className="save-arrow">↓</div>
            <div className="save-list">
              <div className="save-item">📁 My Workflow</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Keyboard Shortcuts',
      icon: '⌨️',
      content: [
        'Ctrl+A: Select all',
        'Ctrl+C / Ctrl+V: Copy & Paste',
        'Ctrl+Z: Undo',
        'Delete: Remove selected nodes',
      ],
      illustration: (
        <div className="help-illustration">
          <div className="illustration-shortcuts">
            <div className="shortcut"><kbd>Ctrl</kbd>+<kbd>A</kbd> Select All</div>
            <div className="shortcut"><kbd>Ctrl</kbd>+<kbd>Z</kbd> Undo</div>
            <div className="shortcut"><kbd>Del</kbd> Delete</div>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div
      className="help-guide-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        className="help-guide-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '600px',
          maxHeight: '85vh',
          background: 'linear-gradient(180deg, #0a1929 0%, #05111c 100%)',
          borderRadius: '20px',
          border: '1px solid #1e4976',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(33, 150, 243, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column' as const,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          background: 'rgba(19, 47, 76, 0.3)',
          borderBottom: '1px solid #1e4976',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 600, color: '#fff' }}>
            <span>❓</span>
            <span>{isJa ? '使い方ガイド' : 'How to Use'}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              color: '#8ab4f8',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >×</button>
        </div>

        {/* Progress */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '16px',
          borderBottom: '1px solid rgba(30, 73, 118, 0.3)',
        }}>
          {steps.map((_, index) => (
            <div
              key={index}
              onClick={() => setCurrentStep(index)}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: index === currentStep ? '#2196f3' : index < currentStep ? '#00ff88' : 'rgba(107, 138, 153, 0.4)',
                cursor: 'pointer',
                boxShadow: index === currentStep ? '0 0 10px #2196f3' : 'none',
                transform: index === currentStep ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{ fontSize: '32px' }}>{currentStepData.icon}</span>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>{currentStepData.title}</h2>
          </div>

          {currentStepData.illustration}

          <div style={{ marginTop: '16px' }}>
            {currentStepData.content.map((text, i) => (
              <p key={i} style={{
                fontSize: '15px',
                lineHeight: 1.7,
                color: '#fff',
                margin: '0 0 10px 0',
                paddingLeft: '8px',
                borderLeft: '2px solid #1e4976',
              }}>{text}</p>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          background: 'rgba(19, 47, 76, 0.2)',
          borderTop: '1px solid #1e4976',
        }}>
          <button
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={isFirstStep}
            style={{
              padding: '10px 20px',
              background: isFirstStep ? 'rgba(26, 58, 82, 0.2)' : 'rgba(26, 58, 82, 0.4)',
              border: '1px solid #1e4976',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: isFirstStep ? 'rgba(255,255,255,0.4)' : '#fff',
              cursor: isFirstStep ? 'not-allowed' : 'pointer',
            }}
          >
            ← {isJa ? '前へ' : 'Back'}
          </button>
          <span style={{ fontSize: '12px', color: '#8ab4f8' }}>
            {currentStep + 1} / {steps.length}
          </span>
          {isLastStep ? (
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'rgba(0, 255, 136, 0.2)',
                border: '1px solid #00ff88',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {isJa ? '完了' : 'Done'} ✓
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              style={{
                padding: '10px 20px',
                background: 'rgba(33, 150, 243, 0.2)',
                border: '1px solid #2196f3',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {isJa ? '次へ' : 'Next'} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
