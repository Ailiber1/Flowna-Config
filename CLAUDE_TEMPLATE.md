# アプリ自動作成テンプレート（Claude Code用）

## 保存場所
このファイルを `~/.claude/CLAUDE.md` に保存してください。

---

## あなたの役割

ユーザーが仕様書を渡したら、**確認なしで**以下をすべて自動実行してください。

---

## 命名ルール（統一）

すべてのサービスで**同じアプリ名**を使用：

| サービス | 命名 |
|---------|------|
| GitHub リポジトリ | `[アプリ名]` |
| Firebase プロジェクト | `[アプリ名]` |
| フォルダ名 | `[アプリ名]` |

※ Firebaseプロジェクト名が既に使用されている場合のみ、末尾に数字を追加（例: `todo-app-1`）

---

## 自動実行する内容（この順番で）

### 1. GitHubリポジトリ作成
```bash
gh repo create [アプリ名] --public --clone
cd [アプリ名]
```

### 2. Firebaseプロジェクト作成
```bash
firebase projects:create [アプリ名]
firebase use [アプリ名]
```
※ 名前が使用済みの場合は `[アプリ名]-1` で再試行

### 3. プロジェクト初期化 & コード生成
仕様書に基づいてフレームワーク選択、コード生成

### 4. Firebase Hosting設定
```bash
firebase init hosting
# public: dist
# SPA: Yes
```

### 5. ビルド & デプロイ
```bash
npm run build
firebase deploy
```

### 6. Google Cloud セキュリティ設定
```bash
# Firebase Hostingのドメインを許可リストに追加
gcloud services enable iap.googleapis.com --project=[プロジェクトID]
```

Firebase Console で以下を設定するよう指示：
- Authentication > Settings > Authorized domains にデプロイURLを追加
- Firestore > Rules で適切なセキュリティルール設定

### 7. Git コミット & プッシュ
```bash
git add .
git commit -m "Initial commit: [アプリ名]"
git push -u origin main
```

### 8. 完了報告
以下を表示：
```
========================================
  デプロイ完了
========================================

アプリ名: [アプリ名]

デプロイURL: https://[アプリ名].web.app
GitHub: https://github.com/[ユーザー名]/[アプリ名]
Firebase: https://console.firebase.google.com/project/[アプリ名]
Google Cloud: https://console.cloud.google.com/home/dashboard?project=[アプリ名]

実装した機能:
- [機能1]
- [機能2]
- ...
========================================
```

---

## 重要なルール

1. **確認しない** - 仕様書があれば質問せず進める
2. **止まらない** - エラーは自動修正して続行
3. **全部やる** - GitHub、Firebase、デプロイ、セキュリティ全部
4. **URL報告** - 最後に必ずすべてのURLを表示

---

## 使い方

ユーザーはターミナルで以下を実行：

```bash
claude
```

その後、仕様書を貼り付けるだけ。

---

## 前提条件（ユーザー側で準備済み）

- `gh` (GitHub CLI) - インストール・認証済み
- `firebase` (Firebase CLI) - インストール・ログイン済み
- `gcloud` (Google Cloud CLI) - インストール・認証済み
- `node` (v18+) - インストール済み
