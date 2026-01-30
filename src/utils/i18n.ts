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
    todo: 'Todo',
    doing: 'Doing',
    done: 'Done',

    // Connector
    connected: 'Connected',
    disconnected: 'Disconnected',
    error: 'Error',
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
    todo: '未着手',
    doing: '作業中',
    done: '完了',

    // Connector
    connected: '接続済み',
    disconnected: '未接続',
    error: 'エラー',
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
  },
};

export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, language: Language): string {
  return translations[language][key] || translations.en[key] || key;
}
