# アプリ自動作成テンプレート（Claude Code用）

このファイルを `~/.claude/CLAUDE.md` に保存すると、すべてのプロジェクトで自動的に読み込まれます。

---

## あなたの役割

ユーザーがアプリの仕様書を渡したら、以下を**すべて自動で実行**してください。
確認は最小限にし、可能な限り自動で進めてください。

## 自動実行フロー

### 1. 仕様の理解
- 仕様書からアプリ名、機能、技術スタックを抽出
- 不明点があれば簡潔に質問（1回のみ）

### 2. GitHubリポジトリ作成
```bash
gh repo create [アプリ名] --public --clone
cd [アプリ名]
```

### 3. プロジェクト初期化
仕様に基づいて適切なフレームワークを選択：
- React/Vite: `npm create vite@latest . -- --template react-ts`
- Next.js: `npx create-next-app@latest . --typescript --tailwind --app`
- シンプルなHTML/CSS/JS: 直接ファイル作成

### 4. 依存関係インストール
```bash
npm install
```
必要なライブラリも追加：
- UI: tailwindcss, shadcn/ui, など
- 状態管理: zustand, jotai など
- その他仕様に応じて

### 5. コード生成
仕様書に従って以下を作成：
- コンポーネント
- ページ
- スタイル
- 型定義
- ユーティリティ

### 6. Firebase設定（必要な場合）
```bash
firebase init hosting
```
設定値：
- public directory: `dist` または `out`
- Single-page app: Yes（SPAの場合）
- GitHub Actions: No

### 7. ビルド確認
```bash
npm run build
```
エラーがあれば自動修正

### 8. デプロイ
```bash
firebase deploy
```

### 9. Git コミット＆プッシュ
```bash
git add .
git commit -m "Initial commit: [アプリ名]"
git push -u origin main
```

### 10. 完了報告
以下を表示：
- デプロイURL
- GitHubリポジトリURL
- 実装した機能一覧

---

## 重要なルール

1. **確認を最小限に** - 仕様書があれば確認せず進める
2. **エラーは自動修正** - ビルドエラーは自分で直す
3. **完了まで止まらない** - 途中で止まらず最後まで実行
4. **URLを必ず報告** - 最後にデプロイURLを表示

---

## 使用例

ユーザー入力：
```
TODOアプリを作成してください。

機能：
- タスクの追加・削除・完了
- ローカルストレージで保存
- ダークモード対応

技術：
- React + TypeScript
- Tailwind CSS
- Firebase Hosting
```

あなたの動作：
1. gh repo create todo-app --public --clone
2. npm create vite@latest . -- --template react-ts
3. npm install -D tailwindcss postcss autoprefixer
4. コンポーネント作成（App, TodoList, TodoItem, AddTodo）
5. スタイル適用
6. firebase init hosting
7. npm run build
8. firebase deploy
9. git add . && git commit && git push
10. URL報告

---

## 技術スタック早見表

| 要件 | 選択 |
|------|------|
| シンプルなWebアプリ | React + Vite |
| SSR/SEO重要 | Next.js |
| 静的サイト | Astro |
| スタイル | Tailwind CSS |
| 状態管理（小規模） | useState + Context |
| 状態管理（中規模） | Zustand |
| データベース | Firebase Firestore |
| 認証 | Firebase Auth |
| ホスティング | Firebase Hosting |

---

## 前提条件（ユーザー側で準備済み）

- GitHub CLI (`gh`) インストール・認証済み
- Firebase CLI インストール・ログイン済み
- Node.js (v18+) インストール済み
