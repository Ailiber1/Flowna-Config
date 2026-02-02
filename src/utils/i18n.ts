export type Language = 'en' | 'ja';

export const translations = {
  en: {
    // Sidebar
    folders: 'FOLDERS',
    connectors: 'CONNECTORS',

    // Node operations
    addNode: 'Add Node',
    editNode: 'Edit Node',
    deleteNode: 'Delete',
    duplicateNode: 'Duplicate',
    nodeName: 'Node Name',
    displayName: 'Display Name',
    category: 'Category',
    customCategory: 'Custom Category',
    newCategory: '+ New Category',
    icon: 'Icon',
    color: 'Color',
    description: 'Description',
    url: 'URL',
    status: 'Status',
    memo: 'Memo',

    // Status
    waiting: 'Waiting',
    running: 'Running',
    done: 'Done',
    error: 'Error',

    // Connector
    connected: 'Connected',
    disconnected: 'Disconnected',
    addConnector: 'Add Connector',
    settings: 'Settings',
    testConnection: 'Test Connection',
    importData: 'Import Data',
    viewLogs: 'View Logs',
    disconnect: 'Disconnect',
    remove: 'Remove',
    triggerCicd: 'Trigger CI/CD',
    triggerWorkflow: 'Trigger Workflow',

    // Workflow
    saveWorkflow: 'Save Workflow',
    loadWorkflow: 'Load Workflow',
    workflowName: 'Workflow Name',
    selectFolder: 'Select Folder',
    tags: 'Tags',
    save: 'Save',
    cancel: 'Cancel',
    create: 'Create',

    // Context menu
    edit: 'Edit',
    customize: 'Customize',
    setStatus: 'Set Status',
    linkToService: 'Link to Service',
    openUrl: 'Open URL',
    deleteConnection: 'Delete Connection',
    toggleActive: 'Toggle Active',

    // Search
    searchPlaceholder: 'Search nodes...',

    // Messages
    savedToCloud: 'Saved to cloud',
    savedLocally: 'Saved locally',
    loadedFromCloud: 'Loaded from cloud',
    loadedLocally: 'Loaded locally',
    unsavedChanges: 'You have unsaved changes. Discard them?',
    confirmDelete: 'Delete this node?',

    // Categories
    agent: 'Agent',
    logic: 'Logic',
    system: 'System',
    rule: 'Rule',

    // Create/Patch Mode
    createMode: 'Create',
    patchMode: 'Patch',
    createModeDesc: 'Create new app from scratch',
    patchModeDesc: 'Modify existing app with targeted patches',
    createModeBlocked: 'App already created. Use Patch mode.',
    execute: 'Execute',
    executing: 'Executing...',
    applyPatch: 'Apply Patch',

    // Execution Plan
    executionPlan: 'Execution Plan',
    noPlan: 'No plan',
    willRun: 'RUN',
    willSkip: 'SKIP',
    blocked: 'BLOCKED',
    reason: 'Reason',
    inputHash: 'Hash',
    prevHash: 'Previous',
    actions: 'Actions',

    // Node Actions
    searchActions: 'Search actions...',
    addAction: 'Add Action',
    removeAction: 'Remove',
    currentActions: 'Current Actions',
    actionAdded: 'Added',
    actionRemoved: 'Action removed',
    noActionsFound: 'No actions found',

    // Action Categories
    catProjectSetup: 'Project Setup',
    catDevelopment: 'Development',
    catDeploy: 'Deploy',
    catUpdate: 'Update',

    // Action Names
    actionFirebaseCreate: 'Firebase Project',
    actionGithubRepo: 'GitHub Repository',
    actionClaudeDevelop: 'Claude Code Dev',
    actionGithubDeploy: 'Deploy',
    actionGithubPr: 'Update (PR)',

    // Action Descriptions
    descFirebaseCreate: 'Create Firebase project with app name',
    descGithubRepo: 'Create GitHub repository with app name',
    descClaudeDevelop: 'Develop app with Claude Code from spec',
    descGithubDeploy: 'Deploy to GitHub Pages and get URL',
    descGithubPr: 'Create PR for updates and merge',
  },
  ja: {
    // Sidebar
    folders: 'フォルダ',
    connectors: 'コネクタ',

    // Node operations
    addNode: 'ノード追加',
    editNode: 'ノード編集',
    deleteNode: '削除',
    duplicateNode: '複製',
    nodeName: 'ノード名',
    displayName: '表示名',
    category: 'カテゴリ',
    customCategory: 'カスタムカテゴリ',
    newCategory: '+ 新規カテゴリ',
    icon: 'アイコン',
    color: '色',
    description: '説明',
    url: 'URL',
    status: 'ステータス',
    memo: 'メモ',

    // Status
    waiting: '待機中',
    running: '実行中',
    done: '完了',
    error: 'エラー',

    // Connector
    connected: '接続済み',
    disconnected: '未接続',
    addConnector: 'コネクタ追加',
    settings: '設定',
    testConnection: '接続テスト',
    importData: 'データインポート',
    viewLogs: 'ログ表示',
    disconnect: '切断',
    remove: '削除',
    triggerCicd: 'CI/CD実行',
    triggerWorkflow: 'ワークフロー実行',

    // Workflow
    saveWorkflow: 'ワークフロー保存',
    loadWorkflow: 'ワークフロー読込',
    workflowName: 'ワークフロー名',
    selectFolder: 'フォルダ選択',
    tags: 'タグ',
    save: '保存',
    cancel: 'キャンセル',
    create: '作成',

    // Context menu
    edit: '編集',
    customize: 'カスタマイズ',
    setStatus: 'ステータス設定',
    linkToService: 'サービスにリンク',
    openUrl: 'URLを開く',
    deleteConnection: '接続を削除',
    toggleActive: 'アクティブ切替',

    // Search
    searchPlaceholder: 'ノードを検索...',

    // Messages
    savedToCloud: 'クラウドに保存しました',
    savedLocally: 'ローカルに保存しました',
    loadedFromCloud: 'クラウドから復元しました',
    loadedLocally: 'ローカルデータを読み込みました',
    unsavedChanges: '保存されていない変更があります。破棄しますか？',
    confirmDelete: 'このノードを削除しますか？',

    // Categories
    agent: 'エージェント',
    logic: 'ロジック',
    system: 'システム',
    rule: 'ルール',

    // Create/Patch Mode
    createMode: '新規作成',
    patchMode: 'パッチ',
    createModeDesc: '新規アプリを最初から作成',
    patchModeDesc: '既存アプリを差分で修正',
    createModeBlocked: 'アプリは作成済みです。パッチモードをご利用ください。',
    execute: '実行',
    executing: '実行中...',
    applyPatch: 'パッチ適用',

    // Execution Plan
    executionPlan: '実行プラン',
    noPlan: 'プランなし',
    willRun: '実行',
    willSkip: 'スキップ',
    blocked: 'ブロック',
    reason: '理由',
    inputHash: 'ハッシュ',
    prevHash: '前回',
    actions: 'アクション',

    // Node Actions
    searchActions: 'アクションを検索...',
    addAction: 'アクションを追加',
    removeAction: '削除',
    currentActions: '設定済みアクション',
    actionAdded: '追加しました',
    actionRemoved: 'アクションを削除しました',
    noActionsFound: 'アクションが見つかりません',

    // Action Categories
    catProjectSetup: 'プロジェクト作成',
    catDevelopment: '開発',
    catDeploy: 'デプロイ',
    catUpdate: '更新',

    // Action Names
    actionFirebaseCreate: 'Firebaseプロジェクト',
    actionGithubRepo: 'GitHubリポジトリ',
    actionClaudeDevelop: 'Claude Codeで開発',
    actionGithubDeploy: 'デプロイ',
    actionGithubPr: '修正・更新 (PR)',

    // Action Descriptions
    descFirebaseCreate: 'アプリ名でFirebaseプロジェクトを作成',
    descGithubRepo: 'アプリ名でGitHubリポジトリを作成',
    descClaudeDevelop: '仕様書を元にClaude Codeでアプリ開発',
    descGithubDeploy: 'GitHub PagesにデプロイしてURLを取得',
    descGithubPr: 'PRを作成してマージ',
  },
};

export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, language: Language): string {
  return translations[language][key] || translations.en[key] || key;
}

// Hook for component use
export function useTranslation(language: Language) {
  return {
    t: (key: TranslationKey) => t(key, language),
    language,
  };
}
