import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

interface OnboardingStep {
  titleEn: string;
  titleJa: string;
  descriptionEn: string;
  descriptionJa: string;
  icon: string;
  highlight?: 'sidebar' | 'canvas' | 'topbar' | 'node' | 'connection';
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    titleEn: 'Welcome to Flowna Config!',
    titleJa: 'Flowna Config へようこそ！',
    descriptionEn: 'Visualize your workflows with an intuitive node-based interface. Let\'s learn the basics in 3 simple steps.',
    descriptionJa: '直感的なノードベースのインターフェースでワークフローを可視化しましょう。3つの簡単なステップで基本を学びます。',
    icon: '🎉',
  },
  {
    titleEn: 'Step 1: Add Nodes',
    titleJa: 'ステップ 1: ノードを追加',
    descriptionEn: 'Drag items from the Node Palette on the left, or click "Add Node" button. Each node represents a task or process.',
    descriptionJa: '左側のノードパレットからドラッグするか、「ノード追加」ボタンをクリック。各ノードはタスクやプロセスを表します。',
    icon: '📦',
    highlight: 'sidebar',
  },
  {
    titleEn: 'Step 2: Connect Nodes',
    titleJa: 'ステップ 2: ノードを接続',
    descriptionEn: 'Drag from the output port (right side) of one node to the input port (left side) of another to create connections.',
    descriptionJa: 'ノードの出力ポート（右側）から別のノードの入力ポート（左側）にドラッグして接続を作成します。',
    icon: '🔗',
    highlight: 'canvas',
  },
  {
    titleEn: 'Step 3: Save Your Work',
    titleJa: 'ステップ 3: 保存する',
    descriptionEn: 'Click the Save button or press Ctrl+S to save your workflow. Connect to Firebase for cloud backup!',
    descriptionJa: '保存ボタンをクリックするか Ctrl+S を押してワークフローを保存。Firebaseに接続してクラウドバックアップ！',
    icon: '💾',
    highlight: 'topbar',
  },
  {
    titleEn: 'You\'re Ready!',
    titleJa: '準備完了！',
    descriptionEn: 'Start creating your workflows now. Right-click for more options, double-click to edit nodes.',
    descriptionJa: 'さあ、ワークフローを作成しましょう。右クリックでオプション表示、ダブルクリックでノード編集。',
    icon: '🚀',
  },
];

export function Onboarding() {
  const { state, dispatch } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if onboarding was completed
    const completed = localStorage.getItem('flowna_onboarding_completed');
    if (!completed) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('flowna_onboarding_completed', 'true');
    setIsVisible(false);
    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        message: state.language === 'ja' ? 'チュートリアル完了！' : 'Tutorial completed!',
        type: 'success',
      },
    });
  };

  if (!isVisible) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const title = state.language === 'ja' ? step.titleJa : step.titleEn;
  const description = state.language === 'ja' ? step.descriptionJa : step.descriptionEn;

  return (
    <>
      {/* Highlight overlay */}
      {step.highlight && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 5, 9, 0.7)',
            zIndex: 998,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Highlight specific area */}
      {step.highlight === 'sidebar' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '280px',
            height: '100%',
            border: '3px solid var(--accent-cyan)',
            boxShadow: '0 0 30px var(--accent-cyan)',
            zIndex: 999,
            pointerEvents: 'none',
            borderRadius: '0 12px 12px 0',
          }}
        />
      )}

      {step.highlight === 'canvas' && (
        <div
          style={{
            position: 'fixed',
            top: '60px',
            left: '280px',
            right: 0,
            bottom: '32px',
            border: '3px solid var(--accent-neon-green)',
            boxShadow: 'inset 0 0 30px var(--accent-neon-green)',
            zIndex: 999,
            pointerEvents: 'none',
          }}
        />
      )}

      {step.highlight === 'topbar' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: '280px',
            right: 0,
            height: '60px',
            border: '3px solid var(--accent-cyan)',
            boxShadow: '0 0 30px var(--accent-cyan)',
            zIndex: 999,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          background: 'linear-gradient(135deg, var(--sidebar-base) 0%, #05111c 100%)',
          border: '1px solid var(--sidebar-highlight)',
          borderRadius: '16px',
          padding: '32px',
          minWidth: '450px',
          maxWidth: '500px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: '48px',
            marginBottom: '16px',
          }}
        >
          {step.icon}
        </div>

        {/* Title */}
        <h2
          style={{
            fontFamily: 'Orbitron',
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '12px',
          }}
        >
          {title}
        </h2>

        {/* Description */}
        <p
          style={{
            fontFamily: 'Rajdhani',
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '24px',
          }}
        >
          {description}
        </p>

        {/* Progress dots */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '24px',
          }}
        >
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: index === currentStep ? 'var(--accent-cyan)' : 'var(--sidebar-highlight)',
                boxShadow: index === currentStep ? '0 0 10px var(--accent-cyan)' : 'none',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="btn btn-secondary"
              style={{ minWidth: '100px' }}
            >
              {state.language === 'ja' ? '戻る' : 'Back'}
            </button>
          )}

          {currentStep === 0 && (
            <button
              onClick={handleSkip}
              className="btn btn-secondary"
              style={{ minWidth: '100px' }}
            >
              {state.language === 'ja' ? 'スキップ' : 'Skip'}
            </button>
          )}

          <button
            onClick={handleNext}
            className="btn btn-primary"
            style={{ minWidth: '120px' }}
          >
            {currentStep === ONBOARDING_STEPS.length - 1
              ? (state.language === 'ja' ? '始める' : 'Start')
              : (state.language === 'ja' ? '次へ' : 'Next')}
          </button>
        </div>
      </div>
    </>
  );
}

// Function to reset onboarding (for testing)
export function resetOnboarding(): void {
  localStorage.removeItem('flowna_onboarding_completed');
}
