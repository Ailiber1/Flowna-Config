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
  const [connectorUrl, setConnectorUrl] = useState('');  // URL for quick access

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
    // Load connector URL from connector object
    if (connector) {
      setConnectorUrl(connector.url || '');
    }
  }, [connectorId, connector]);

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

    // Save connector URL to the connector object
    if (connector) {
      dispatch({
        type: 'UPDATE_CONNECTOR',
        payload: { ...connector, url: connectorUrl, lastUsedAt: Date.now() },
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
      {/* Simplified: Just Project ID is essential */}
      <div className="form-group">
        <label className="form-label required">
          {state.language === 'ja' ? 'プロジェクトID' : 'Project ID'}
        </label>
        <input
          type="text"
          className="form-input"
          value={firebaseConfig.projectId}
          onChange={(e) => {
            const projectId = e.target.value;
            // Auto-fill other fields based on project ID
            setFirebaseConfig({
              ...firebaseConfig,
              projectId,
              authDomain: projectId ? `${projectId}.firebaseapp.com` : '',
              storageBucket: projectId ? `${projectId}.firebasestorage.app` : '',
            });
          }}
          placeholder="your-project-id"
        />
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {state.language === 'ja'
            ? 'FirebaseコンソールのプロジェクトIDを入力'
            : 'Enter your Firebase project ID'}
        </p>
      </div>

      <div className="form-group">
        <label className="form-label required">
          {state.language === 'ja' ? 'APIキー' : 'API Key'}
        </label>
        <input
          type="password"
          className="form-input"
          value={firebaseConfig.apiKey}
          onChange={(e) => setFirebaseConfig({ ...firebaseConfig, apiKey: e.target.value })}
          placeholder="AIzaSy..."
        />
      </div>

      {/* Collapsible advanced settings */}
      <details style={{ marginTop: '16px' }}>
        <summary style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
          {state.language === 'ja' ? '詳細設定（通常は自動入力されます）' : 'Advanced settings (usually auto-filled)'}
        </summary>
        <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(13, 33, 55, 0.3)', borderRadius: '8px' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '11px' }}>
              {state.language === 'ja' ? '認証ドメイン' : 'Auth Domain'}
            </label>
            <input
              type="text"
              className="form-input"
              value={firebaseConfig.authDomain}
              onChange={(e) => setFirebaseConfig({ ...firebaseConfig, authDomain: e.target.value })}
              placeholder="your-app.firebaseapp.com"
              style={{ fontSize: '12px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '11px' }}>
              {state.language === 'ja' ? 'ストレージバケット' : 'Storage Bucket'}
            </label>
            <input
              type="text"
              className="form-input"
              value={firebaseConfig.storageBucket}
              onChange={(e) => setFirebaseConfig({ ...firebaseConfig, storageBucket: e.target.value })}
              placeholder="your-app.firebasestorage.app"
              style={{ fontSize: '12px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '11px' }}>
              {state.language === 'ja' ? 'アプリID' : 'App ID'}
            </label>
            <input
              type="text"
              className="form-input"
              value={firebaseConfig.appId}
              onChange={(e) => setFirebaseConfig({ ...firebaseConfig, appId: e.target.value })}
              placeholder="1:123456789:web:abc123"
              style={{ fontSize: '12px' }}
            />
          </div>
        </div>
      </details>

      {/* Quick action: Create new project */}
      <div style={{ marginTop: '20px', padding: '16px', background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 87, 34, 0.1))', borderRadius: '8px', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--accent-orange)' }}>
          🔥 {state.language === 'ja' ? '新規プロジェクトを作成' : 'Create New Project'}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          {state.language === 'ja'
            ? 'Firebaseコンソールで新しいプロジェクトを作成し、プロジェクトIDとAPIキーを取得してください。'
            : 'Create a new project in Firebase Console and get the Project ID and API Key.'}
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => window.open('https://console.firebase.google.com/u/0/', '_blank')}
          style={{ fontSize: '12px' }}
        >
          🌐 {state.language === 'ja' ? 'Firebaseコンソールを開く' : 'Open Firebase Console'}
        </button>
      </div>
    </div>
  );

  const renderApiKeyConfig = () => (
    <div className="form-group">
      <label className="form-label required">
        {connectorId === 'github'
          ? (state.language === 'ja' ? 'パーソナルアクセストークン' : 'Personal Access Token')
          : (state.language === 'ja' ? 'APIキー' : 'API Key')}
      </label>
      <input
        type="password"
        className="form-input"
        value={apiToken}
        onChange={(e) => setApiToken(e.target.value)}
        placeholder={connectorId === 'github' ? 'ghp_xxxx...' : 'sk-...'}
      />
      {connectorId === 'github' && (
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {state.language === 'ja'
            ? 'GitHub Settings → Developer settings → Personal access tokens で作成'
            : 'Create at GitHub Settings → Developer settings → Personal access tokens'}
        </p>
      )}
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
                {tab === 'auth' ? (state.language === 'ja' ? '認証設定' : 'Authentication') : (state.language === 'ja' ? 'データ同期' : 'Data Sync')}
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

          {/* Firebase Configuration */}
          {connectorId === 'firebase' && activeTab === 'auth' && (
            <>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {state.language === 'ja'
                  ? 'Firebaseコンソール（console.firebase.google.com）から設定情報を取得してください。'
                  : 'Get configuration from Firebase Console (console.firebase.google.com).'}
              </p>
              {renderFirebaseConfig()}

              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--sidebar-highlight)' }}>
                <p style={{ fontSize: '13px', marginBottom: '12px' }}>
                  {state.language === 'ja' ? '認証方法:' : 'Sign in method:'}
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleFirebaseSignIn('anonymous')}
                    disabled={isLoading}
                  >
                    {state.language === 'ja' ? '匿名でログイン' : 'Anonymous Sign In'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleFirebaseSignIn('google')}
                    disabled={isLoading}
                  >
                    🔵 Google {state.language === 'ja' ? 'でログイン' : 'Sign In'}
                  </button>
                </div>
                {getCurrentUser() && (
                  <div style={{ marginTop: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--status-connected)' }}>
                      ✓ {state.language === 'ja' ? 'ログイン中:' : 'Signed in:'} {getCurrentUser()?.email || getCurrentUser()?.uid}
                    </span>
                    <button
                      onClick={handleFirebaseSignOut}
                      style={{ marginLeft: '12px', fontSize: '12px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {state.language === 'ja' ? 'ログアウト' : 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Firebase Sync Tab */}
          {connectorId === 'firebase' && activeTab === 'sync' && (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                {state.language === 'ja'
                  ? 'ワークフロー、フォルダ、設定をクラウドと同期します。'
                  : 'Sync workflows, folders, and settings with cloud.'}
              </p>

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

              {!getCurrentUser() && (
                <p style={{ fontSize: '12px', color: 'var(--status-warning)', marginTop: '12px' }}>
                  ⚠️ {state.language === 'ja' ? '同期するにはログインが必要です' : 'Sign in required for sync'}
                </p>
              )}

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

          {/* GitHub, Claude, Gemini */}
          {(connectorId === 'github' || connectorId === 'claude-code' || connectorId === 'gemini') && (
            <>
              {renderApiKeyConfig()}
              <div style={{ marginTop: '20px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {connectorId === 'github' && (state.language === 'ja'
                    ? '必要な権限: repo, workflow（GitHub Actionsを使う場合）'
                    : 'Required scopes: repo, workflow (for GitHub Actions)')}
                  {connectorId === 'claude-code' && (state.language === 'ja'
                    ? 'Anthropic Console からAPIキーを取得してください'
                    : 'Get your API key from Anthropic Console')}
                  {connectorId === 'gemini' && (state.language === 'ja'
                    ? 'Google AI Studio からAPIキーを取得してください'
                    : 'Get your API key from Google AI Studio')}
                </p>
              </div>
            </>
          )}

          {/* Custom API */}
          {connectorId === 'custom-api' && renderCustomApiConfig()}

          {/* Quick Access URL - for all connectors */}
          <div className="form-group" style={{ marginTop: '20px' }}>
            <label className="form-label">
              {state.language === 'ja' ? 'クイックアクセスURL' : 'Quick Access URL'}
            </label>
            <input
              type="url"
              className="form-input"
              value={connectorUrl}
              onChange={(e) => setConnectorUrl(e.target.value)}
              placeholder={state.language === 'ja' ? 'https://example.com (ダブルクリックで開く)' : 'https://example.com (double-click to open)'}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {state.language === 'ja'
                ? 'コネクタをダブルクリックすると、このURLが開きます'
                : 'Double-click the connector to open this URL'}
            </p>
          </div>

          {/* Status */}
          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(13, 33, 55, 0.5)', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {state.language === 'ja' ? 'ステータス:' : 'Status:'}{' '}
            </span>
            <span style={{
              fontSize: '12px',
              color: connector.status === 'connected' ? 'var(--status-connected)' : connector.status === 'error' ? 'var(--status-error)' : 'var(--text-secondary)',
            }}>
              {connector.status === 'connected' ? '● ' : connector.status === 'error' ? '● ' : '○ '}
              {t(connector.status, state.language)}
            </span>
          </div>
        </div>

        <div className="modal-footer">
          {connector.status === 'connected' && (
            <button className="btn btn-danger" onClick={handleDisconnect} disabled={isLoading}>
              {t('disconnect', state.language)}
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleTestConnection} disabled={isLoading}>
            {isLoading ? '...' : t('testConnection', state.language)}
          </button>
          <button className="btn btn-primary" onClick={handleSaveConfig} disabled={isLoading}>
            {t('save', state.language)}
          </button>
        </div>
      </div>
    </div>
  );
}
