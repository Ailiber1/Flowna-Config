import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { t } from '../utils/i18n';
import { validateFirebaseConfig } from '../utils/security';
import {
  initializeFirebase,
  testFirebaseConnection,
  getStoredFirebaseConfig,
  signInAnonymouslyToFirebase,
  signInWithGoogle,
  signOutFromFirebase,
  getCurrentUser,
  loadAllDataFromFirestore,
  syncAllDataToFirestore,
  type FirebaseConfig,
} from '../services/firebase';
import {
  githubConnector,
  claudeConnector,
  geminiConnector,
  customApiConnector,
  saveConnectorConfig,
  loadConnectorConfig,
  clearConnectorConfig,
} from '../services/connectors';

interface ConnectorModalProps {
  connectorId: string | null;
  onClose: () => void;
}

export function ConnectorModal({ connectorId, onClose }: ConnectorModalProps) {
  const { state, dispatch } = useApp();

  const connector = state.connectors.find(c => c.id === connectorId);
  const [activeTab, setActiveTab] = useState<'general' | 'auth' | 'sync'>('auth');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Firebase specific state
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });

  // Other connectors
  const [apiToken, setApiToken] = useState('');
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [customAuthType, setCustomAuthType] = useState<'none' | 'bearer' | 'apikey' | 'basic'>('bearer');

  // Load existing config
  useEffect(() => {
    if (connectorId === 'firebase') {
      const stored = getStoredFirebaseConfig();
      if (stored) {
        setFirebaseConfig(stored);
      }
    } else if (connectorId) {
      const config = loadConnectorConfig<{ token?: string; url?: string; authType?: string }>(connectorId);
      if (config) {
        setApiToken(config.token || '');
        setCustomApiUrl(config.url || '');
        setCustomAuthType((config.authType as 'none' | 'bearer' | 'apikey' | 'basic') || 'bearer');
      }
    }
  }, [connectorId]);

  if (!connector) return null;

  const handleTestConnection = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      let result: { success: boolean; message: string };

      switch (connectorId) {
        case 'firebase':
          const validation = validateFirebaseConfig(firebaseConfig);
          if (!validation.valid) {
            setMessage({ text: validation.errors.join(', '), type: 'error' });
            setIsLoading(false);
            return;
          }
          await initializeFirebase(firebaseConfig);
          result = await testFirebaseConnection();
          break;
        case 'github':
          githubConnector.setToken(apiToken);
          result = await githubConnector.testConnection();
          break;
        case 'claude-code':
          claudeConnector.setApiKey(apiToken);
          result = await claudeConnector.testConnection();
          break;
        case 'gemini':
          geminiConnector.setApiKey(apiToken);
          result = await geminiConnector.testConnection();
          break;
        case 'custom-api':
          customApiConnector.setConfig({
            baseUrl: customApiUrl,
            authType: customAuthType,
            authValue: apiToken,
          });
          result = await customApiConnector.testConnection();
          break;
        default:
          result = { success: false, message: 'Unknown connector' };
      }

      setMessage({ text: result.message, type: result.success ? 'success' : 'error' });

      if (result.success) {
        updateConnectorStatus('connected');
      }
    } catch (error) {
      setMessage({ text: `Error: ${error}`, type: 'error' });
    }

    setIsLoading(false);
  };

  const handleSaveConfig = () => {
    if (connectorId === 'firebase') {
      const validation = validateFirebaseConfig(firebaseConfig);
      if (!validation.valid) {
        setMessage({ text: validation.errors.join(', '), type: 'error' });
        return;
      }
      initializeFirebase(firebaseConfig);
    } else if (connectorId) {
      saveConnectorConfig(connectorId, {
        token: apiToken,
        url: customApiUrl,
        authType: customAuthType,
      });

      // Set up the connector
      switch (connectorId) {
        case 'github':
          githubConnector.setToken(apiToken);
          break;
        case 'claude-code':
          claudeConnector.setApiKey(apiToken);
          break;
        case 'gemini':
          geminiConnector.setApiKey(apiToken);
          break;
        case 'custom-api':
          customApiConnector.setConfig({
            baseUrl: customApiUrl,
            authType: customAuthType,
            authValue: apiToken,
          });
          break;
      }
    }

    // Update connector's lastUsedAt
    if (connector) {
      dispatch({
        type: 'UPDATE_CONNECTOR',
        payload: { ...connector, lastUsedAt: Date.now() },
      });
    }

    dispatch({ type: 'SHOW_TOAST', payload: { message: state.language === 'ja' ? '設定を保存しました' : 'Configuration saved', type: 'success' } });

    // Close the modal after saving
    onClose();
  };

  const handleDisconnect = () => {
    if (connectorId) {
      clearConnectorConfig(connectorId);
      setApiToken('');
      setCustomApiUrl('');
      updateConnectorStatus('disconnected');
      setMessage({ text: state.language === 'ja' ? '切断しました' : 'Disconnected', type: 'info' });
    }
  };

  const updateConnectorStatus = (status: 'connected' | 'disconnected' | 'error') => {
    if (connector) {
      dispatch({
        type: 'UPDATE_CONNECTOR',
        payload: { ...connector, status, lastUsedAt: Date.now() },
      });
    }
  };

  // Firebase specific handlers
  const handleFirebaseSignIn = async (method: 'anonymous' | 'google') => {
    setIsLoading(true);
    try {
      const user = method === 'google'
        ? await signInWithGoogle()
        : await signInAnonymouslyToFirebase();

      if (user) {
        setMessage({ text: `Signed in as ${user.email || user.uid}`, type: 'success' });
        updateConnectorStatus('connected');
      } else {
        setMessage({ text: 'Sign in failed', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: `Error: ${error}`, type: 'error' });
    }
    setIsLoading(false);
  };

  const handleFirebaseSignOut = async () => {
    await signOutFromFirebase();
    updateConnectorStatus('disconnected');
    setMessage({ text: state.language === 'ja' ? 'ログアウトしました' : 'Signed out', type: 'info' });
  };

  const handleSyncToCloud = async () => {
    setIsLoading(true);
    const success = await syncAllDataToFirestore({
      workflows: state.workflows,
      folders: state.folders,
      categories: state.categories,
      settings: state.settings,
    });
    setIsLoading(false);

    if (success) {
      setMessage({ text: state.language === 'ja' ? 'クラウドに同期しました' : 'Synced to cloud', type: 'success' });
    } else {
      setMessage({ text: state.language === 'ja' ? '同期に失敗しました' : 'Sync failed', type: 'error' });
    }
  };

  const handleLoadFromCloud = async () => {
    setIsLoading(true);
    const data = await loadAllDataFromFirestore();
    setIsLoading(false);

    if (data) {
      if (data.workflows.length > 0) {
        dispatch({ type: 'SET_WORKFLOWS', payload: data.workflows });
      }
      if (data.folders.length > 0) {
        dispatch({ type: 'SET_FOLDERS', payload: data.folders });
      }
      if (data.categories.length > 0) {
        dispatch({ type: 'SET_CATEGORIES', payload: data.categories });
      }
      if (data.settings) {
        dispatch({ type: 'SET_SETTINGS', payload: data.settings });
      }
      setMessage({ text: state.language === 'ja' ? 'クラウドから読み込みました' : 'Loaded from cloud', type: 'success' });
    } else {
      setMessage({ text: state.language === 'ja' ? '読み込みに失敗しました' : 'Load failed', type: 'error' });
    }
  };

  const renderFirebaseConfig = () => (
    <div>
      {/* Role explanation */}
      <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.15), rgba(255, 87, 34, 0.1))', borderRadius: '8px', border: '1px solid rgba(255, 152, 0, 0.3)', marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-orange)', marginBottom: '8px' }}>
          🔥 {state.language === 'ja' ? 'Firebaseの役割' : 'Firebase Role'}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
          {state.language === 'ja'
            ? 'ホスティング・データベース・認証を提供（Claude Codeが自動設定）'
            : 'Provides hosting, database, auth (auto-configured by Claude Code)'}
        </p>
      </div>

      {/* Project ID input - optional */}
      <div style={{ padding: '16px', background: 'rgba(33, 150, 243, 0.1)', borderRadius: '8px', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--accent-cyan)' }}>
          📝 {state.language === 'ja' ? 'プロジェクトID（任意）' : 'Project ID (Optional)'}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          {state.language === 'ja'
            ? '既存のプロジェクトがある場合のみ入力'
            : 'Enter only if you have an existing project'}
        </p>
        <input
          type="text"
          className="form-input"
          value={firebaseConfig.projectId}
          onChange={(e) => {
            const projectId = e.target.value;
            setFirebaseConfig({
              ...firebaseConfig,
              projectId,
              authDomain: projectId ? `${projectId}.firebaseapp.com` : '',
              storageBucket: projectId ? `${projectId}.firebasestorage.app` : '',
            });
          }}
          placeholder={state.language === 'ja' ? '例: my-app-12345' : 'e.g., my-app-12345'}
          style={{ fontSize: '14px' }}
        />
      </div>

      {/* Quick link */}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => window.open('https://console.firebase.google.com', '_blank')}
        onDoubleClick={() => window.open('https://console.firebase.google.com', '_blank')}
        style={{ width: '100%', fontSize: '13px', marginTop: '16px', marginBottom: '12px' }}
      >
        🔗 {state.language === 'ja' ? 'Firebaseコンソールを開いて確認' : 'Open Firebase Console to verify'}
      </button>

      {/* Info note */}
      <div style={{ padding: '12px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
        <p style={{ fontSize: '12px', color: 'var(--status-connected)', margin: 0 }}>
          💡 {state.language === 'ja'
            ? 'プロジェクトがなくても、Claude Codeが自動で作成します'
            : 'Claude Code will auto-create if no project exists'}
        </p>
      </div>
    </div>
  );

  // GitHub - Simplified (assumes gh CLI installed)
  const renderGitHubSetup = () => (
    <div>
      {/* Role explanation */}
      <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(36, 41, 46, 0.3), rgba(88, 96, 105, 0.2))', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '16px' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#f0f0f0', marginBottom: '16px' }}>
          🐙 {state.language === 'ja' ? 'GitHubの役割' : 'GitHub Role'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>📁 {state.language === 'ja' ? 'リポジトリ作成' : 'Create Repo'}</span>
          </div>
          <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>📤 {state.language === 'ja' ? 'コード管理' : 'Code Management'}</span>
          </div>
        </div>
      </div>

      {/* Quick link */}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => window.open('https://github.com', '_blank')}
        onDoubleClick={() => window.open('https://github.com', '_blank')}
        style={{ width: '100%', fontSize: '13px', marginBottom: '12px' }}
      >
        🔗 {state.language === 'ja' ? 'GitHubを開いて確認' : 'Open GitHub to verify'}
      </button>

      {/* Info note */}
      <div style={{ padding: '12px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
        <p style={{ fontSize: '12px', color: 'var(--status-connected)', margin: 0 }}>
          💡 {state.language === 'ja'
            ? 'Claude Codeが gh コマンドで自動操作します'
            : 'Claude Code auto-operates via gh command'}
        </p>
      </div>
    </div>
  );

  // Claude Code - Simplified (assumes already installed)
  const renderClaudeCodeSetup = () => (
    <div>
      {/* Role explanation - main focus */}
      <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.15), rgba(75, 0, 130, 0.1))', borderRadius: '8px', border: '1px solid rgba(138, 43, 226, 0.3)', marginBottom: '16px' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent-purple)', marginBottom: '16px' }}>
          🤖 {state.language === 'ja' ? 'Claude Codeが自動で実行すること' : 'What Claude Code Does Automatically'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>📁 {state.language === 'ja' ? 'リポジトリ作成' : 'Create Repo'}</span>
          </div>
          <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>💻 {state.language === 'ja' ? 'コード生成' : 'Generate Code'}</span>
          </div>
          <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>🔥 {state.language === 'ja' ? 'Firebase設定' : 'Firebase Setup'}</span>
          </div>
          <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>🚀 {state.language === 'ja' ? 'デプロイ' : 'Deploy'}</span>
          </div>
        </div>
      </div>

      {/* How to use - simplified */}
      <div style={{ padding: '16px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.3)', marginBottom: '12px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--status-connected)', marginBottom: '12px' }}>
          ✓ {state.language === 'ja' ? '使い方' : 'How to Use'}
        </p>
        <ol style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, paddingLeft: '20px', lineHeight: '2' }}>
          <li>{state.language === 'ja' ? 'Flownaで「実行」→ コピー' : 'Click "Execute" in Flowna → Copy'}</li>
          <li>{state.language === 'ja' ? 'ターミナルで claude と入力' : 'Type claude in terminal'}</li>
          <li>{state.language === 'ja' ? '貼り付けてEnter → 自動実行' : 'Paste and Enter → Auto-execute'}</li>
        </ol>
      </div>

      {/* Quick link */}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => window.open('https://claude.ai', '_blank')}
        onDoubleClick={() => window.open('https://claude.ai', '_blank')}
        style={{ width: '100%', fontSize: '13px' }}
      >
        🔗 {state.language === 'ja' ? 'Claude.aiを開く' : 'Open Claude.ai'}
      </button>
    </div>
  );

  // Gemini - Simplified
  const renderGeminiSetup = () => (
    <div>
      <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.2), rgba(52, 168, 83, 0.15))', borderRadius: '8px', border: '1px solid rgba(66, 133, 244, 0.3)', marginBottom: '12px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#4285f4', marginBottom: '8px' }}>
          ✨ {state.language === 'ja' ? 'Geminiの役割' : 'Gemini Role'}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
          {state.language === 'ja'
            ? '代替AIオプション（現在はClaude Codeがメイン）'
            : 'Alternative AI option (Claude Code is primary)'}
        </p>
      </div>

      {/* Quick link */}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => window.open('https://aistudio.google.com', '_blank')}
        onDoubleClick={() => window.open('https://aistudio.google.com', '_blank')}
        style={{ width: '100%', fontSize: '13px' }}
      >
        🔗 {state.language === 'ja' ? 'Google AI Studioを開く' : 'Open Google AI Studio'}
      </button>
    </div>
  );

  // Google Cloud - Simplified
  const renderGoogleCloudSetup = () => (
    <div>
      {/* Role explanation */}
      <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.2), rgba(234, 67, 53, 0.1))', borderRadius: '8px', border: '1px solid rgba(66, 133, 244, 0.3)', marginBottom: '16px' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#4285f4', marginBottom: '16px' }}>
          ☁️ {state.language === 'ja' ? 'Google Cloudの役割' : 'Google Cloud Role'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>🔒 {state.language === 'ja' ? 'セキュリティ' : 'Security'}</span>
          </div>
          <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>🛡️ {state.language === 'ja' ? 'API制限' : 'API Restrictions'}</span>
          </div>
        </div>
      </div>

      {/* Quick link */}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => window.open('https://console.cloud.google.com', '_blank')}
        onDoubleClick={() => window.open('https://console.cloud.google.com', '_blank')}
        style={{ width: '100%', fontSize: '13px', marginBottom: '12px' }}
      >
        🔗 {state.language === 'ja' ? 'Google Cloud Consoleを開いて確認' : 'Open Google Cloud Console to verify'}
      </button>

      {/* Info note */}
      <div style={{ padding: '12px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
        <p style={{ fontSize: '12px', color: 'var(--status-connected)', margin: 0 }}>
          💡 {state.language === 'ja'
            ? 'Claude Codeがセキュリティ設定を案内します'
            : 'Claude Code will guide security setup'}
        </p>
      </div>
    </div>
  );

  const renderCustomApiConfig = () => (
    <>
      <div className="form-group">
        <label className="form-label required">
          {state.language === 'ja' ? 'ベースURL' : 'Base URL'}
        </label>
        <input
          type="url"
          className="form-input"
          value={customApiUrl}
          onChange={(e) => setCustomApiUrl(e.target.value)}
          placeholder="https://api.example.com"
        />
      </div>
      <div className="form-group">
        <label className="form-label">
          {state.language === 'ja' ? '認証タイプ' : 'Auth Type'}
        </label>
        <select
          className="form-select"
          value={customAuthType}
          onChange={(e) => setCustomAuthType(e.target.value as 'none' | 'bearer' | 'apikey' | 'basic')}
        >
          <option value="none">{state.language === 'ja' ? 'なし' : 'None'}</option>
          <option value="bearer">{state.language === 'ja' ? 'Bearerトークン' : 'Bearer Token'}</option>
          <option value="apikey">{state.language === 'ja' ? 'APIキー' : 'API Key'}</option>
          <option value="basic">{state.language === 'ja' ? 'Basic認証' : 'Basic Auth'}</option>
        </select>
      </div>
      {customAuthType !== 'none' && (
        <div className="form-group">
          <label className="form-label">
            {state.language === 'ja' ? '認証値' : 'Auth Value'}
          </label>
          <input
            type="password"
            className="form-input"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder={customAuthType === 'basic' ? 'username:password' : 'token'}
          />
        </div>
      )}
    </>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {connector.icon} {connector.name} {t('settings', state.language)}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Tabs for Firebase */}
        {connectorId === 'firebase' && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--sidebar-highlight)', padding: '0 20px' }}>
            {(['auth', 'sync'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 20px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontFamily: 'Rajdhani',
                  fontSize: '14px',
                }}
              >
                {tab === 'auth' ? (state.language === 'ja' ? 'プロジェクト' : 'Project') : (state.language === 'ja' ? 'データ同期' : 'Data Sync')}
              </button>
            ))}
          </div>
        )}

        <div className="modal-body">
          {message && (
            <div style={{
              padding: '10px 14px',
              marginBottom: '16px',
              borderRadius: '6px',
              fontSize: '13px',
              background: message.type === 'success' ? 'rgba(74, 222, 128, 0.2)' : message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(33, 150, 243, 0.2)',
              color: message.type === 'success' ? '#4ade80' : message.type === 'error' ? '#ef4444' : '#2196f3',
              border: `1px solid ${message.type === 'success' ? '#4ade80' : message.type === 'error' ? '#ef4444' : '#2196f3'}`,
            }}>
              {message.text}
            </div>
          )}

          {/* Firebase Configuration - Simplified */}
          {connectorId === 'firebase' && activeTab === 'auth' && (
            <>
              {renderFirebaseConfig()}
            </>
          )}

          {/* Firebase Sync Tab */}
          {connectorId === 'firebase' && activeTab === 'sync' && (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {state.language === 'ja'
                  ? 'Flownaのワークフローをクラウドにバックアップできます。'
                  : 'Backup your Flowna workflows to the cloud.'}
              </p>

              {/* Login section for sync */}
              {!getCurrentUser() ? (
                <div style={{ padding: '16px', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 193, 7, 0.3)', marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--status-warning)', marginBottom: '12px' }}>
                    ⚠️ {state.language === 'ja' ? '同期するにはログインが必要です' : 'Sign in required for sync'}
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleFirebaseSignIn('google')}
                      disabled={isLoading}
                      style={{ flex: 1, fontSize: '12px' }}
                    >
                      🔵 Google
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleFirebaseSignIn('anonymous')}
                      disabled={isLoading}
                      style={{ flex: 1, fontSize: '12px' }}
                    >
                      👤 {state.language === 'ja' ? '匿名' : 'Anonymous'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.3)', marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--status-connected)' }}>
                    ✓ {getCurrentUser()?.email || getCurrentUser()?.uid}
                  </span>
                  <button
                    onClick={handleFirebaseSignOut}
                    style={{ marginLeft: '12px', fontSize: '11px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {state.language === 'ja' ? 'ログアウト' : 'Sign Out'}
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleSyncToCloud}
                  disabled={isLoading || !getCurrentUser()}
                  style={{ width: '100%' }}
                >
                  ☁️ {state.language === 'ja' ? 'クラウドにアップロード' : 'Upload to Cloud'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleLoadFromCloud}
                  disabled={isLoading || !getCurrentUser()}
                  style={{ width: '100%' }}
                >
                  📥 {state.language === 'ja' ? 'クラウドからダウンロード' : 'Download from Cloud'}
                </button>
              </div>

              <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(13, 33, 55, 0.5)', borderRadius: '8px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {state.language === 'ja' ? '現在のデータ:' : 'Current data:'}
                </p>
                <p style={{ fontSize: '13px' }}>
                  📊 {state.workflows.length} {state.language === 'ja' ? 'ワークフロー' : 'workflows'}, {state.folders.length} {state.language === 'ja' ? 'フォルダ' : 'folders'}
                </p>
              </div>
            </div>
          )}

          {/* GitHub Setup Guide */}
          {connectorId === 'github' && renderGitHubSetup()}

          {/* Claude Code Setup Guide */}
          {connectorId === 'claude-code' && renderClaudeCodeSetup()}

          {/* Gemini Setup Guide */}
          {connectorId === 'gemini' && renderGeminiSetup()}

          {/* Google Cloud Setup Guide */}
          {connectorId === 'google-cloud' && renderGoogleCloudSetup()}

          {/* Custom API */}
          {connectorId === 'custom-api' && renderCustomApiConfig()}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
          {/* Firebase and Custom API need save/test functionality */}
          {(connectorId === 'firebase' || connectorId === 'custom-api') ? (
            <>
              {connector.status === 'connected' && (
                <button className="btn btn-danger" onClick={handleDisconnect} disabled={isLoading}>
                  {t('disconnect', state.language)}
                </button>
              )}
              {connectorId === 'custom-api' && (
                <button className="btn btn-secondary" onClick={handleTestConnection} disabled={isLoading}>
                  {isLoading ? '...' : t('testConnection', state.language)}
                </button>
              )}
              <button className="btn btn-secondary" onClick={onClose}>
                {t('cancel', state.language)}
              </button>
              <button className="btn btn-primary" onClick={handleSaveConfig} disabled={isLoading}>
                {t('save', state.language)}
              </button>
            </>
          ) : (
            /* Other connectors just need close button */
            <button className="btn btn-primary" onClick={onClose}>
              {state.language === 'ja' ? '閉じる' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
