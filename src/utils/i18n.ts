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
    catConditions: 'Conditions',
    catPatchTarget: 'Patch Target',
    catDataTransform: 'Data Transform',
    catConnectorInvoke: 'Connector Invoke',

    // Action Names
    actionConditionAnd: 'AND Condition',
    actionConditionOr: 'OR Condition',
    actionConditionCompare: 'Compare Values',
    actionPatchTarget: 'Patch Target',
    actionDiffContext: 'Diff Context',
    actionExtractData: 'Extract Data',
    actionFormatData: 'Format Data',
    actionGithubCommit: 'GitHub Commit',
    actionGithubPr: 'GitHub PR',
    actionClaudePatch: 'Claude Patch',
    actionClaudeReview: 'Claude Review',

    // Action Descriptions
    descConditionAnd: 'All conditions must be true',
    descConditionOr: 'Any condition must be true',
    descConditionCompare: 'Compare two values',
    descPatchTarget: 'Mark as patch modification target',
    descDiffContext: 'Get current state from GitHub for diff',
    descExtractData: 'Extract specific data from input',
    descFormatData: 'Format data for output',
    descGithubCommit: 'Commit changes to GitHub',
    descGithubPr: 'Create Pull Request',
    descClaudePatch: 'Generate diff patch with Claude',
    descClaudeReview: 'Review code with Claude',
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
    catConditions: '条件',
    catPatchTarget: 'パッチ対象',
    catDataTransform: 'データ変換',
    catConnectorInvoke: 'コネクタ実行',

    // Action Names
    actionConditionAnd: 'AND条件',
    actionConditionOr: 'OR条件',
    actionConditionCompare: '値を比較',
    actionPatchTarget: 'パッチ対象',
    actionDiffContext: '差分コンテキスト',
    actionExtractData: 'データ抽出',
    actionFormatData: 'データ整形',
    actionGithubCommit: 'GitHubコミット',
    actionGithubPr: 'GitHub PR作成',
    actionClaudePatch: 'Claudeパッチ',
    actionClaudeReview: 'Claudeレビュー',

    // Action Descriptions
    descConditionAnd: 'すべての条件がtrueである必要があります',
    descConditionOr: 'いずれかの条件がtrueであれば実行',
    descConditionCompare: '2つの値を比較します',
    descPatchTarget: 'パッチ修正対象としてマーク',
    descDiffContext: 'GitHubから現在の状態を取得して差分を計算',
    descExtractData: '入力から特定のデータを抽出',
    descFormatData: '出力用にデータを整形',
    descGithubCommit: 'GitHubに変更をコミット',
    descGithubPr: 'プルリクエストを作成',
    descClaudePatch: 'Claudeで差分パッチを生成',
    descClaudeReview: 'Claudeでコードレビュー',
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
