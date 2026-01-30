# Flowna Config - Complete Implementation Specification v4.2
Workflow Config Visualizer Web App with CI/CD Integration + Full Data Persistence

【v4.2 の主な変更点】
- Firebase Connectorの詳細仕様を追加
- データ永続化戦略の完全説明（localStorage + Firestore 2層構造）
- ワークフロー保存・読込・復元フローの詳細化
- クロスデバイス同期の実装方法
- オフライン対応の詳細
- Firestoreデータ構造の完全定義

---

## 0. 定義と目的

Flowna Config は、作業工程・思考プロセス・設定ページへの導線を  
**ノード＋UE5 Blueprint風の動的点線接続**で可視化する  
**完全に操作可能な**ワークフロー可視化Webアプリである。

### 用途
- 構成管理・リンク管理
- ワークフローの可視化とパッケージ保存
- データの保存・検索・呼び出し
- 思考プロセスの整理
- **CI/CD連携（GitHub Actions等）**
- 外部サービスとの連携（Connector経由）

### 制約
- 外部サービス（ChatGPT/Claude/GitHub等）への自動操作は行わない
- Firebase（Firestore）を通じたデータ保存・読込を実装
- Connector経由で外部API連携とCI/CD連携を実現
- リアルタイム共同編集は非対応

---

## 1. デザイン仕様（ダークブルーサイドバー + HUDキャンバス）

### 1-1. 全体配色

#### サイドバー専用色（ダークブルー - 最重要）
- **ベース**: `#0a1929` （ディープブルー）
- **セカンダリ**: `#132f4c` （ミディアムブルー）
- **ハイライト**: `#1e4976` （ライトブルー）
- **アクセント**: `#2196f3` （ブライトブルー）
- **FLOWNAロゴ**: `#ff6b35` （オレンジ）- ※必ず目立つオレンジ色

#### キャンバス側アクセントカラー
- **シアン**: `#00ffff` （トップバー、ボタン、強調）
- **ネオングリーン**: `#00ff88` （接続線、データパケット）
- **グリッド**: `#1a3a52` （暗めのブルーグリーン）

#### ノードカテゴリ色（デフォルト）
- **パープル**: `#a78bfa` （AGENT - エージェント）
- **ブルー**: `#60a5fa` （LOGIC - ロジック）
- **オレンジ**: `#ff8800` （SYSTEM - システム）
- **グリーン**: `#4ade80` （RULE - ルール）

**重要**: ノードのカテゴリ名とアイコンはユーザーが自由にカスタマイズ可能

#### 基本色
- **ベース背景**: `#000509` （ディープブラック）
- **セカンダリ背景**: `#0a0e1a` （ダークネイビー）
- **テキスト プライマリ**: `#e0f7ff`
- **テキスト セカンダリ**: `#6b8a99`

### 1-2. フォント
- **Orbitron**: ロゴ、ヘッドライン、ボタン（900 weight）
- **Rajdhani**: 本文、メニュー（300-700 weight）
- **Share Tech Mono**: コード、数値、技術情報

### 1-3. レイアウト構成
```
┌────────────┬─────────────────────────────────────┐
│ [F] FLOWNA │ [検索バー] [AI] [設定]              │ 60px
│            │─────────────────────────────────────│
│ FOLDERS ▾  │                                     │
│ 📁 構成    │        無限キャンバス                │
│ 📁 接続    │     （ノード + 接続線）              │
│ 📁 モジュール│                                    │
│            │      シアン系HUD                     │
│ CONNECTORS │                                     │
│ [+]        │                                     │
│ 🐙 GitHub●│                                     │
│ ⚡ Claude○│                                     │
│ ☁️ Firebase●│ [ステータス]         [ボタン群]    │
│            │                                     │
│ [EN/JP]    │                                     │
└────────────┴─────────────────────────────────────┘
   280px幅
```

### 1-4. サイドバーデザイン（ダークブルー - 画像準拠）

#### 基本スタイル
- 幅: 280px、固定配置
- 背景: 縦方向グラデーション
  - 上部: `#0a1929` （ディープブルー）
  - 下部: `#05111c` （さらに暗いブルー）
- テクスチャ: 細かい縦線パターン（オプション、画像のような質感）
- ガラス効果: 15pxブラー（軽め）
- 右ボーダー: 1px solid `#1e4976` （ライトブルー 30%透明度）
- 全体シャドウ: 右側に暗いシャドウ

#### ロゴエリア
- **アイコン**: 「F」の文字をスタイライズしたアイコン（左側）
  - 色: オレンジ `#ff6b35`
  - サイズ: 32x32px
  - 背景: 暗いブルー + 軽い発光
- **テキスト**: 
  - 「FLOWNA」: Orbitron 900、18px、オレンジ `#ff6b35`
  - 「CONFIG VISUALIZER」: Share Tech Mono、8px、`#6b8a99`
- 配置: 上部、パディング 20px
- 下ボーダー: 1px solid `#1e4976`

#### セクションヘッダー（FOLDERS / CONNECTORS）
- フォント: Share Tech Mono、11px、大文字
- 色: `#8ab4f8` （明るいブルー）
- 右側: 展開/折りたたみアイコン（▾/▸）
- パディング: 上下12px、左右16px
- 背景: `#132f4c` （ミディアムブルー、15%透明度）
- ホバー: `#1e4976` （ライトブルー、20%透明度）

#### フォルダ項目
- **アイコン + 名前**: 左側に絵文字アイコン、右側に名前
- デフォルト背景: `#0d2137` （暗めのブルー、10%透明度）
- ホバー: `#132f4c` （ミディアムブルー、25%透明度）
- 選択中: `#1e4976` （ライトブルー、35%透明度） + 左ボーダー 3px `#2196f3`
- フォント: Rajdhani 400、14px
- パディング: 上下10px、左右16px（インデント考慮）

#### コネクタアイコン
- **表示形式**: アイコンのみ（コンパクト）
- サイズ: 40x40px
- 背景: `#132f4c` + 軽いボーダー
- 角丸: 8px
- ホバー: 上に浮く（translateY: -2px） + 発光
- ステータスドット: 右下に8pxの円
  - 接続済み: 緑 `#4ade80`
  - 未接続: グレー `#6b8a99`
  - エラー: 赤 `#ef4444`
- 配置: 横並び、4-5個まで表示

#### フッター（言語切替）
- 背景: `#132f4c` + オレンジアクセント
- ボーダー: オレンジの細いライン
- トグルスイッチ風デザイン
- 現在選択中: オレンジ背景
- 未選択: 暗いブルー背景

### 1-5. キャンバスデザイン

#### 背景
- ベース: ディープブラック `#000509`
- 放射グラデーション2層: シアンとネオングリーン（各3%透明度）
- グリッド: 
  - 大グリッド: 50px、`#1a3a52` （暗めブルーグリーン）
  - 小グリッド: 10px、`#0d1f2d` （非常に暗いブルー）
- 奥行き感: 中央が明るく、周辺が暗い放射グラデーション

#### ノードスタイル（カスタマイズ可能）
- 幅: 220px、高さ: 165px（ヘッダー45px + ボディ70px + フッター50px）
- 背景: ダークブルーグラデーション（30-20%透明度）
- **必須**: backdrop-filter: blur(15px)
- **必須**: opacity: 0.85（デフォルト）→ 1.0（ホバー）
- 角丸: 12px
- ボーダー: カテゴリ色 50%透明度
- ホバー時: 4層の発光（12px/30px/60px/inset）
- **ノード名表示**: ユーザーが設定したカスタム名を表示

#### 接続線スタイル
- **色**: ネオングリーン `#00ff88` 統一
- 線幅: 2px（非アクティブ）/ 3px（アクティブ）
- 点線: 10px実線 + 5px空白
- アニメーション: 流動（1.2秒 / 0.8秒）+ パルス（2秒）
- データパケット: 緑色の円（半径5px）、3個が移動（2.5秒周期）

---

## 2. 機能仕様（完全実装）

### 2-1. ノード管理機能【カスタム名対応】

#### ノードデータ構造
各ノードは以下の情報を持つ：
```
{
  id: 一意のID（文字列または数値）
  title: ノード名（文字列、必須、ユーザー指定）
  displayName: 表示名（カスタマイズ可能、titleと同じまたは別名）
  description: 説明文（文字列、任意）
  category: 'AGENT' | 'LOGIC' | 'SYSTEM' | 'RULE' | カスタムカテゴリ
  categoryDisplayName: カテゴリ表示名（ユーザーが変更可能）
  icon: アイコン（絵文字または画像URL）
  color: 'purple' | 'blue' | 'orange' | 'green' | カスタム色
  url: リンクURL（文字列、任意）
  status: 'todo' | 'doing' | 'done'
  memo: メモテキスト（文字列、任意）
  position: { x: 数値, y: 数値 }
  connectorLinks: [{ connectorId, resourceId, resourceName }]
  createdAt: 作成日時（タイムスタンプ）
  updatedAt: 更新日時（タイムスタンプ）
}
```

**重要な変更点**:
- `displayName`: ノード上に表示される名前（ユーザーがいつでも変更可能）
- `categoryDisplayName`: カテゴリ名の表示（「AGENT」→「エージェント」等）
- `icon`: カスタムアイコン設定可能
- `connectorLinks`: 連携した外部サービスのリソース情報

#### ノード追加機能（Add Node）
**トリガー**: 
- サイドバーの「Add Node」ボタンをクリック
- またはパレット項目をキャンバスにドラッグ
- または右クリックメニューから

**動作**:
1. モーダルウィンドウを表示
2. 入力フィールド:
   - **Node Name（必須）**: 自由に入力可能
   - **Display Name（任意）**: 表示名（空欄の場合はNode Nameを使用）
   - Description（任意、テキストエリア）
   - **Category（カスタマイズ可能）**: 
     - デフォルト: AGENT / LOGIC / SYSTEM / RULE
     - または「+ New Category」で新規カテゴリ作成
   - **Icon（選択式）**: 
     - 絵文字ピッカー
     - またはカスタム画像アップロード
   - **Color（カラーピッカー）**: ノードの色を選択
   - URL（任意、URL入力）
   - Status（デフォルト: todo）
3. 「Create」ボタンで確定
4. キャンバス中央に新規ノードを配置
5. 配置位置 = 現在のビューポート中央
6. 即座にドラッグ可能状態

**デフォルトノード名の例**:
- 「エージェント」→ ユーザーが「データ収集AI」に変更可能
- 「コマンド」→ ユーザーが「デプロイ実行」に変更可能
- 「ルール」→ ユーザーが「承認フロー」に変更可能

**バリデーション**:
- Node Nameが空の場合はエラー表示
- URLが入力されている場合は形式チェック

#### ノード編集機能（Edit Node）
**トリガー**: 
- ノードをダブルクリック
- または右クリックメニューから「Edit」選択

**動作**:
1. 編集モーダルを表示（追加と同じフォーム）
2. 既存データを初期値として表示
3. **すべての項目を変更可能**:
   - Node Name
   - Display Name
   - Category（既存または新規）
   - Icon
   - Color
   - Description
   - URL
   - Status
4. 編集内容を保存
5. キャンバス上のノードが即座に更新
6. updatedAtを現在時刻に更新

**カテゴリのカスタマイズ**:
- 既存カテゴリの表示名を変更可能
- 新しいカテゴリを作成可能（名前・色・アイコン指定）
- カテゴリは他のノードでも再利用可能

#### ノード削除機能（Delete Node）
**トリガー**: 
- 右クリックメニューから「Delete」選択
- またはノード選択中にDeleteキー

**動作**:
1. 確認ダイアログ表示「このノードを削除しますか？」
2. 「はい」選択時:
   - ノードを削除
   - 関連する接続線も全て削除
   - アニメーション: フェードアウト（0.3秒）

#### ノードドラッグ移動機能
**操作方法**:
1. ノード上でマウスダウン
2. マウス移動でノードが追従
3. マウスアップで位置確定

**実装詳細**:
- カーソル形状: "move"
- 他のノードと重なり可能
- キャンバスの境界なし（無限移動可能）
- ドラッグ中は接続線がリアルタイムで再描画
- 移動中はノードの透明度を0.7に下げる
- 移動終了時にposition座標を更新

#### ノード選択機能
**シングル選択**:
- ノードをクリックで選択
- 選択状態: ボーダーが太く、発光強化
- 他をクリックで選択解除

**複数選択**:
- Ctrlキー + クリックで追加選択
- Shift + ドラッグで範囲選択（次期実装）

#### メモ機能
**トリガー**: 
- 右クリックメニューから「Memo」選択

**動作**:
1. メモ入力モーダル表示
2. テキストエリア（複数行対応）
3. 「Save」で保存、memoフィールドに格納
4. メモがある場合、ノード右上に小さなアイコン表示
5. アイコンホバーでメモをツールチップ表示

#### ステータス変更機能
**トリガー**: 
- 右クリックメニューから「Set Status」選択

**動作**:
1. サブメニュー表示: Todo / Doing / Done
2. 選択したステータスに変更
3. ステータスドットの色が変化:
   - Todo: グレー（半透明）
   - Doing: 黄色（パルス）
   - Done: 緑色（点灯）

#### URL開く機能
**トリガー**: 
- 右クリックメニューから「Open URL」選択
- またはノードをCtrl+クリック

**動作**:
- URLが設定されている場合、新規タブで開く
- URLが未設定の場合、メニュー項目はグレーアウト

### 2-2. 接続管理機能

#### 接続データ構造
```
{
  id: 一意のID
  from: 送信元ノードID
  to: 受信先ノードID
  active: true | false（アクティブ状態）
  label: 接続のラベル（任意、例: "データ転送"）
  createdAt: 作成日時
}
```

#### インタラクティブ接続作成
**操作方法**:
1. 送信元ノードの出力ポート（右側の円）をマウスダウン
2. マウスを移動すると、カーソルまでゴーストライン（点線）が表示
3. ゴーストラインはリアルタイムでベジェ曲線を描画
4. 受信先ノードの入力ポート（左側の円）上でマウスアップ
5. 接続確定、アニメーション開始

**ゴーストライン仕様**:
- 色: ネオングリーン 30%透明度
- 線幅: 2px
- 点線: 10px + 5px
- カーソルに追従してリアルタイム描画
- キャンセル: Escキーまたは空白エリアでマウスアップ

**バリデーション**:
- 同じノード同士の接続は不可
- 既に存在する接続の重複は不可
- 入力ポート以外でドロップした場合は接続キャンセル

#### 接続削除機能
**トリガー**: 
- 接続線をクリックして選択
- Deleteキー押下

**動作**:
1. 選択した接続線がハイライト（太く、明るく）
2. Deleteキーで削除
3. フェードアウトアニメーション（0.3秒）

**代替方法**:
- 接続線を右クリック → 「Delete Connection」

#### 接続のアクティブ/非アクティブ切替
**トリガー**: 
- 接続線を右クリック → 「Toggle Active」

**動作**:
- active: true → false または逆
- アクティブ: パルス + データパケット表示
- 非アクティブ: 静止、薄表示、パケットなし

### 2-3. キャンバス操作機能

#### パン（移動）機能
**操作方法**:
- キャンバス背景をマウスドラッグ
- または中ボタンドラッグ

**実装詳細**:
- カーソル: grab（通常）/ grabbing（ドラッグ中）
- viewport全体が移動
- ノードと接続線も一緒に移動
- 無限に移動可能（制限なし）
- transform: translate()で実現

#### ズーム機能
**操作方法**:
- マウスホイールを上下
- またはCtrl + / Ctrl -

**実装詳細**:
- 上回転: 1.1倍に拡大
- 下回転: 0.9倍に縮小
- 範囲: 0.3倍（最小）〜 2.0倍（最大）
- 中心: マウスカーソル位置
- transform: scale()で実現
- ズーム倍率をステータスバーに表示

#### フィット表示機能
**トリガー**: 
- 「Fit to Screen」ボタン
- またはショートカット: Ctrl + 0

**動作**:
1. 全ノードの座標を取得
2. バウンディングボックスを計算
3. 全ノードが画面に収まるようにパン・ズーム調整
4. アニメーション: 0.5秒かけて滑らかに移動

### 2-4. 検索機能

#### インクリメンタル検索
**UI配置**: トップバー左側の検索ボックス

**動作**:
1. テキスト入力中、リアルタイムで検索
2. 検索対象:
   - ノードのtitle / displayName
   - ノードのdescription
   - ノードのmemo
   - カテゴリ名
3. 部分一致でヒット
4. 大文字小文字を区別しない

**検索結果表示**:
1. ヒットしたノードをハイライト
   - ボーダーが黄色に変化
   - 発光を強調
   - 軽く点滅（2回）
2. 最初のヒット結果にカメラが移動
   - アニメーション: 0.8秒
   - ズームは変更しない
3. 複数ヒット時、上下矢印で次/前へ移動

**検索クリア**:
- 検索ボックスを空にすると全てのハイライト解除
- Escキーでもクリア可能

### 2-5. ワークフロー保存・管理機能

#### ワークフローデータ構造
```
{
  id: 一意のID（自動生成）
  name: ワークフロー名（文字列、必須）
  description: 説明文（文字列、任意）
  folderId: 所属フォルダID（文字列）
  nodes: [全ノードの配列（カスタム名・アイコン含む）]
  connections: [全接続の配列]
  viewport: { panX, panY, scale }
  customCategories: [ユーザー定義カテゴリの配列]
  thumbnail: サムネイル画像URL（任意）
  tags: [タグの配列]（任意）
  createdAt: 作成日時（タイムスタンプ）
  updatedAt: 更新日時（タイムスタンプ）
  lastOpenedAt: 最終開封日時（タイムスタンプ）
}
```

#### ワークフロー保存機能

**トリガー**: 
- サイドバーの「Save」ボタンをクリック
- またはCtrl + S

**動作フロー**:
1. 保存モーダルを表示
2. 入力フィールド:
   - Workflow Name（必須、テキスト入力）
   - Description（任意、テキストエリア）
   - Select Folder（必須、ドロップダウン）
   - Tags（任意、カンマ区切り）
3. 「Save」ボタンで確定
4. 保存処理:
   - 現在のキャンバス状態（全ノード・接続・viewport）を取得
   - カスタムカテゴリ情報も含めて保存
   - ワークフローオブジェクトを生成
   - 選択したフォルダに保存
   - サムネイル自動生成（キャンバスのスクリーンショット、縮小版）
5. 保存完了後:
   - 緑色のトースト通知「ワークフローを保存しました」
   - サイドバーのフォルダ内にワークフローパッケージが表示される

**保存先**:
- localStorage（オフライン時）
- Firestore（オンライン時、優先）

#### ワークフロー読込（呼び出し）機能

**トリガー**: 
- サイドバーのフォルダ内ワークフローパッケージをクリック

**動作フロー**:
1. 現在のキャンバスに未保存の変更がある場合:
   - 確認ダイアログ表示「現在の作業を保存しますか？」
   - 選択肢: 「保存」「保存しない」「キャンセル」
2. ワークフローデータを読込:
   - FirestoreまたはlocalStorageから取得
   - ノード・接続・viewport・カスタムカテゴリを復元
3. キャンバスをクリア後、データを適用
4. アニメーション:
   - ノードが順次フェードイン（0.1秒間隔）
   - 接続線が描画される
5. lastOpenedAtを現在時刻に更新

### 2-6. フォルダ管理機能

#### フォルダデータ構造
```
{
  id: 一意のID（自動生成）
  name: フォルダ名（文字列、必須）
  parentId: 親フォルダID（null = ルート）
  icon: アイコン（絵文字）
  order: 表示順序（数値）
  createdAt: 作成日時（タイムスタンプ）
  updatedAt: 更新日時（タイムスタンプ）
}
```

#### サイドバーフォルダセクションUI

**構造**:
```
┌──────────────────────────┐
│ FOLDERS         ▾        │ ← セクションヘッダー
├──────────────────────────┤
│ 📁 構成                  │
│ 📁 接続                  │
│ 📁 モジュール            │
│ 📁 Data Input            │
│ 📁 ユーザード            │
│ 📁 オーナー              │
└──────────────────────────┘
```

**デザイン**:
- 背景: `#0d2137` （暗めブルー、10%透明度）
- ホバー: `#132f4c` （ミディアムブルー、25%透明度）
- 選択中: `#1e4976` （ライトブルー、35%透明度） + 左ボーダー
- フォント: Rajdhani 400、14px
- アイコンサイズ: 18px

#### フォルダ作成機能

**トリガー**: 
- FOLDERSヘッダーの「+」ボタン（追加予定）
- または右クリック → New Folder

**動作**:
1. インライン編集モードまたはモーダル表示
2. 入力: Folder Name（必須）、Icon（オプション）
3. 「Create」で確定
4. サイドバーに即座に反映
5. Firestoreに保存

**デフォルトフォルダ**:
初回起動時に以下のフォルダを自動作成:
- 📁 構成
- 📁 接続
- 📁 モジュール
- 📁 Data Input
- 📁 ユーザード
- 📁 オーナー

#### フォルダ操作機能

**展開/折りたたみ**:
- フォルダ名をクリックで切替
- 状態をlocalStorageに保存

**ドラッグ＆ドロップ移動**:
- ワークフローパッケージをドラッグして別フォルダにドロップ

**右クリックメニュー**:
- Rename（名前変更）
- Change Icon（アイコン変更）
- Delete（削除）

### 2-7. コネクタ機能【CI/CD連携対応】

#### コネクタの概念
コネクタは、Flowna Configと外部サービスを連携させるためのプラグイン機構。  
**CI/CD連携を重視**し、GitHub Actions等との統合を優先実装。

#### コネクタデータ構造
```
{
  id: 一意のID（例: 'github', 'claude-code'）
  name: 表示名（例: 'GitHub'）
  icon: アイコン絵文字またはURL（例: '🐙'）
  description: 説明文
  type: 'cicd' | 'ai' | 'storage' | 'custom'
  version: バージョン（例: '1.0.0'）
  status: 'connected' | 'disconnected' | 'error'
  config: {
    apiKey: API認証キー（暗号化）
    apiEndpoint: APIエンドポイントURL
    webhookUrl: Webhook受信URL（CI/CD用）
    // サービス固有の設定
  }
  capabilities: [
    'import', 'export', 'sync', 'webhook', 'trigger'
  ]
  installedAt: インストール日時
  lastUsedAt: 最終使用日時
}
```

#### サイドバーコネクタセクションUI

**構造**:
```
┌──────────────────────────┐
│ CONNECTORS         [+]   │ ← セクションヘッダー
├──────────────────────────┤
│ 🐙 GitHub          ●     │ ← リスト形式、ステータス付き
│ ⚡ Claude Code     ○     │
│ ☁️ Firebase        ●     │
│ 💎 Gemini Code     ○     │
│ 🔗 Custom API      ○     │
└──────────────────────────┘
```

**デザイン**:
- **リスト形式**: 各コネクタを1行ずつ表示
- **左側**: アイコン（20px）+ 名前（Rajdhani 400、14px）
- **右側**: ステータスドット（8px）
  - 接続済み: 緑 `#4ade80`
  - 未接続: グレー `#6b8a99`
  - エラー: 赤 `#ef4444`
- **背景**: 
  - デフォルト: `#0d2137` （暗めブルー、10%透明度）
  - ホバー: `#132f4c` （ミディアムブルー、25%透明度）
  - 選択中: `#1e4976` （ライトブルー、35%透明度）
- **高さ**: 各項目36px
- **パディング**: 上下8px、左右12px
- **間隔**: 各項目間2px
- **ホバー効果**: 右に3px移動 + 左ボーダー（2px、ブルー）
- **クリック動作**: クリックで設定モーダルを開く

#### 標準コネクタ一覧（厳選）

**1. GitHub Connector 🐙**
- **タイプ**: CI/CD
- **機能**:
  - リポジトリ一覧の取得
  - GitHub Actions連携
  - Workflow実行トリガー
  - Issues / PRの取得・作成
  - Webhook受信（push, PR, release等）
  - コミット履歴の取得
- **CI/CD連携**:
  - Flownaのワークフロー保存時にGitHub Actionsを自動実行
  - GitHub Actionsの実行結果をFlownaで通知
  - ノードから直接GitHub Actionsをトリガー
- **認証**: Personal Access Token または GitHub App

**2. Claude Code Connector ⚡**
- **タイプ**: AI
- **機能**:
  - コード生成リクエスト
  - コードレビュー依頼
  - ドキュメント生成
  - ノードの自動生成（AI提案）
- **連携**:
  - Flownaのワークフローから直接Claude Codeを呼び出し
  - 生成されたコードをノードとして追加
- **認証**: API Key

**3. Firebase Connector ☁️** 【最重要 - データ永続化の核】
- **タイプ**: Storage & Backend
- **機能**:
  - **Firestoreデータベース連携**（メインストレージ）
  - **Authentication連携**（ユーザー管理）
  - Cloud Functions実行（オプション）
  - Hosting デプロイ（オプション）
- **データ永続化の仕組み**:
  ```
  Flowna App
     ↓ 保存ボタンクリック
  localStorage（一時保存・高速アクセス）
     ↓ 自動同期
  Firebase Firestore（クラウド永続保存）
     ↓ 別デバイス/再インストール後
  Flowna App（完全復元）
  ```
- **保存されるデータ**:
  1. **ワークフローパッケージ**: すべてのノード・接続・配置情報
  2. **フォルダ構造**: フォルダ名・階層・アイコン・並び順
  3. **カスタム設定**: ノードのカスタム名・色・アイコン
  4. **ユーザー作成テンプレート**: 保存したテンプレート
  5. **アプリ設定**: 言語・テーマ等
- **Firestoreデータ構造**:
  ```
  users/{userId}/
    ├── workflows/{workflowId}
    │   ├── title: "Webアプリ開発フロー"
    │   ├── description: "フロントエンドからDBまで"
    │   ├── folderId: "folder-1"
    │   ├── nodes: [
    │   │     {id, title, displayName, icon, color, x, y, ...},
    │   │     ...
    │   │   ]
    │   ├── connections: [{from, to, ...}, ...]
    │   ├── thumbnail: "data:image/png;base64,..."
    │   ├── tags: ["開発", "Web"]
    │   ├── createdAt: timestamp
    │   └── updatedAt: timestamp
    │
    ├── folders/{folderId}
    │   ├── name: "構成"
    │   ├── icon: "📁"
    │   ├── order: 1
    │   └── createdAt: timestamp
    │
    ├── customCategories/{categoryId}
    │   ├── name: "データ処理"
    │   ├── icon: "📊"
    │   ├── color: "#60a5fa"
    │   └── createdAt: timestamp
    │
    ├── templates/{templateId}
    │   ├── name: "カスタムテンプレート"
    │   ├── nodes: [...]
    │   ├── connections: [...]
    │   └── createdAt: timestamp
    │
    └── settings/
        ├── language: "ja"
        ├── theme: "dark"
        └── onboardingCompleted: true
  ```
- **同期タイミング**:
  - **保存時**: ワークフロー保存ボタン → localStorage → Firestore同期
  - **フォルダ作成時**: 即座にFirestoreに保存
  - **設定変更時**: リアルタイムでFirestoreに保存
  - **起動時**: Firestoreから最新データ取得 → localStorageに展開
- **復元シナリオ**:
  ```
  ケース1: ブラウザキャッシュ削除
  → Firebaseから完全復元 ✅
  
  ケース2: アプリ削除後の再インストール
  → ログインすればFirebaseから完全復元 ✅
  
  ケース3: 別のデバイスで使用
  → 同じアカウントでログインすればデータ共有 ✅
  
  ケース4: Firebaseコネクタ未接続
  → localStorageのみ（ブラウザ削除で消失） ⚠️
  ```
- **認証方法**:
  - Firebase Authentication（Email/Password, Google, 匿名）
  - または開発者向けService Account
- **接続設定画面**:
  ```
  ┌─────────────────────────────┐
  │ Firebase Connector          │
  ├─────────────────────────────┤
  │ Project ID *                │
  │ [your-project-id]           │
  │                             │
  │ API Key *                   │
  │ [AIzaSy...]                 │
  │                             │
  │ Auth Domain *               │
  │ [your-app.firebaseapp.com]  │
  │                             │
  │ Authentication Method       │
  │ ⚪ Email/Password            │
  │ ⚪ Google Sign-in            │
  │ ⚫ Anonymous（推奨）         │
  │                             │
  │ [Test Connection]           │
  │                             │
  │ Status: ● Connected         │
  │ User ID: user_abc123        │
  │ Storage: 2.3 MB / 100 MB    │
  │ Workflows: 15               │
  │                             │
  ├─────────────────────────────┤
  │      [Cancel]  [Save]       │
  └─────────────────────────────┘
  ```
- **CI/CD連携**:
  - Flowna保存時にFirebase Hostingへ自動デプロイ
  - Cloud Functionsのトリガー設定
- **認証**: Service Account JSON

**4. Gemini Code Assist Connector 💎**
- **タイプ**: AI
- **機能**:
  - コード補完・生成
  - コードリファクタリング提案
  - セキュリティスキャン
  - ドキュメント生成
- **連携**:
  - ノードからGemini APIを呼び出し
  - AIが提案したワークフローを自動生成
- **認証**: Google Cloud API Key

**5. Custom API Connector 🔗**
- **タイプ**: Custom
- **機能**:
  - 汎用REST API連携
  - カスタムヘッダー設定
  - 認証方式選択（Bearer Token / API Key / Basic Auth）
- **用途**: 任意の外部APIとの連携
- **認証**: ユーザー定義

#### コネクタ追加機能

**トリガー**: 
- CONNECTORSセクションヘッダーの「+」ボタンをクリック
- または右クリック → Add Connector
- またはリスト内の空き項目をクリック

**動作フロー**:
1. コネクタ選択ダイアログを表示
2. 利用可能なコネクタ一覧:
   ```
   ┌────────────────────────────────┐
   │ Add Connector                  │
   ├────────────────────────────────┤
   │ [🐙 GitHub]                    │
   │ CI/CD integration              │
   │ Status: Not installed          │
   │               [Add]            │
   ├────────────────────────────────┤
   │ [⚡ Claude Code]               │
   │ AI code assistant              │
   │ Status: Not installed          │
   │               [Add]            │
   ├────────────────────────────────┤
   │ [☁️ Firebase]                  │
   │ Backend & hosting              │
   │ Status: Not installed          │
   │               [Add]            │
   └────────────────────────────────┘
   ```
3. 「Add」をクリック
4. 認証設定画面を表示:
   - API Key入力フィールド
   - エンドポイントURL（必要に応じて）
   - Webhook URL表示（CI/CD用）
   - テスト接続ボタン
5. 「Test Connection」でAPI接続テスト
6. 成功時、コネクタが有効化される
7. サイドバーリストに追加される（緑ドット表示）

**表示順序**:
- 接続済みコネクタが上に表示
- 未接続コネクタはグレーアウト
- アルファベット順またはカスタム順序

#### CI/CD連携の詳細

**GitHub Actions連携の例**:

1. **ワークフロー保存時に自動実行**:
   - Flownaでワークフローを保存
   - GitHub Connectorが設定されたWebhookを送信
   - GitHub Actionsがトリガーされる
   - 例: テスト実行、ビルド、デプロイ

2. **ノードからActions実行**:
   - ノードに「Trigger GitHub Action」ボタンを配置
   - クリックで指定したWorkflowを実行
   - 実行結果をトースト通知で表示

3. **GitHub → Flowna通知**:
   - GitHub ActionsでWebhook送信
   - Flownaが受信して該当ノードをハイライト
   - ステータスを更新（成功: 緑、失敗: 赤）

**設定例（GitHub Connector）**:
```
API Token: ghp_xxxxxxxxxxxx
Repository: username/repo-name
Webhook URL: https://flowna.app/webhook/github/{userId}
Trigger on Save: ✓ Enabled
Actions to trigger:
  - Run Tests
  - Build & Deploy
```

#### コネクタの操作

**クリック動作**:
- コネクタ項目をクリック: 設定モーダルを開く
- 接続済み（緑ドット）: 設定確認・変更
- 未接続（グレードット）: 接続設定を開始

**ホバー時**:
- 背景色が明るくなる
- 左に2pxの青いボーダー表示
- 右に3px移動するアニメーション
- カーソル形状: pointer

**右クリックメニュー**:
- Settings（設定）
- Connect / Disconnect（接続/切断）
- Import Data（データインポート）
- Trigger Workflow（ワークフロー実行）※CI/CD対応コネクタのみ
- Test Connection（接続テスト）
- View Logs（ログ表示）
- Remove（削除）

**ドラッグ**:
- コネクタ項目をドラッグして並び替え可能
- 順序はlocalStorageに保存

#### コネクタ設定機能

**トリガー**: 
- コネクタアイコンを右クリック → Settings

**設定項目**:
- **General**: 名前、説明
- **Authentication**: API Key、Token、認証情報
- **CI/CD Settings**（GitHub専用）:
  - Auto-trigger on save: 保存時に自動実行
  - Select workflows: 実行するGitHub Actions選択
  - Branch: 対象ブランチ
- **Webhook**: Webhook URL表示、再生成
- **Logs**: 実行履歴、エラーログ

#### コネクタの使用方法

**ノードとの連携**:
1. ノード編集時に「Link to Service」オプション
2. 接続済みコネクタから選択
3. サービス固有のリソースを選択
4. ノードにサービスアイコンが表示される

**CI/CDトリガー**:
1. ノード右クリック → Trigger CI/CD
2. 連携したGitHub Actionsを選択
3. パラメータ入力（必要に応じて）
4. 「Run」で実行
5. 進捗をリアルタイム表示

**データインポート**:
1. コネクタ右クリック → Import Data
2. インポート対象を選択
3. 自動的にノードとして配置

### 2-8. 言語切替機能

#### 対応言語
- English（英語）- EN
- Japanese（日本語）- JP

#### UI配置
- サイドバーフッターにトグルスイッチ
- 現在選択中: オレンジ背景
- 未選択: 暗いブルー背景

#### 翻訳対象
| 英語 | 日本語 |
|------|--------|
| FOLDERS | フォルダ |
| CONNECTORS | コネクタ |
| Add Node | ノード追加 |
| Node Name | ノード名 |
| Display Name | 表示名 |
| Category | カテゴリ |
| Custom Category | カスタムカテゴリ |
| Icon | アイコン |
| Color | 色 |
| Connected | 接続済み |
| Disconnected | 未接続 |
| Trigger CI/CD | CI/CD実行 |
| Link to Service | サービスにリンク |

### 2-9. 右クリックメニュー

#### ノード右クリック時
表示メニュー:
- **Edit**（編集） - 名前、アイコン、色など全て変更可能
- **Customize**（カスタマイズ） - 素早いカスタマイズ
- Memo（メモ）
- Set Status（ステータス設定）
- Link to Service（サービスにリンク）
- **Trigger CI/CD**（CI/CD実行） - GitHub Actions等を実行
- Open URL（URLを開く）
- Duplicate（複製）
- Delete（削除）

#### コネクタ右クリック時
表示メニュー:
- Settings（設定）
- Import Data（データインポート）
- **Trigger Workflow**（ワークフロー実行） - CI/CD用
- Test Connection（接続テスト）
- View Logs（ログ表示）
- Disconnect（切断）
- Remove（削除）

### 2-10. キーボードショートカット

| ショートカット | 機能 |
|--------------|------|
| Ctrl + S | ワークフロー保存 |
| Ctrl + O | ワークフロー読込 |
| Ctrl + N | 新規ノード追加 |
| Ctrl + E | ノード編集（選択中） |
| Ctrl + D | ノード複製（選択中） |
| Ctrl + F | 検索フォーカス |
| Ctrl + T | CI/CD実行（ノード選択中） |
| Delete | 選択削除 |
| Esc | 選択解除/モーダル閉じる |

---

---

## 3. データ永続化とストレージ戦略【最重要】

### 3-1. データ保存の2層構造

Flowna Configは**2層のストレージ戦略**を採用し、オフライン対応とクラウド永続化を両立：

```
┌──────────────────────────────────┐
│  Layer 1: localStorage           │ ← 高速アクセス・オフライン対応
│  - 全ワークフローのキャッシュ   │
│  - 現在の作業状態                │
│  - UI設定                        │
└──────────────────────────────────┘
           ↕ 自動同期
┌──────────────────────────────────┐
│  Layer 2: Firebase Firestore     │ ← 永続保存・クロスデバイス
│  - 全データのマスター            │
│  - バックアップ                  │
│  - 他デバイスとの共有            │
└──────────────────────────────────┘
```

### 3-2. ワークフロー保存フロー

#### 保存ボタンをクリックした時の動作

```javascript
// ユーザーが「Save」ボタンをクリック
async function saveWorkflow(workflowData) {
  // Step 1: localStorage に即座に保存（高速・オフライン対応）
  const workflowId = generateId();
  localStorage.setItem(`workflow_${workflowId}`, JSON.stringify(workflowData));
  
  // Step 2: サムネイル画像を自動生成
  const thumbnail = await generateThumbnail(canvasElement);
  
  // Step 3: Firebase Connector が接続済みなら Firestore に同期
  if (firebaseConnector.isConnected()) {
    try {
      await firestore
        .collection('users')
        .doc(currentUserId)
        .collection('workflows')
        .doc(workflowId)
        .set({
          title: workflowData.title,
          description: workflowData.description,
          folderId: workflowData.folderId,
          nodes: workflowData.nodes,
          connections: workflowData.connections,
          thumbnail: thumbnail, // Base64画像
          tags: workflowData.tags,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      
      showToast('✅ クラウドに保存しました', 'success');
    } catch (error) {
      showToast('⚠️ ローカルのみに保存（クラウド同期失敗）', 'warning');
    }
  } else {
    showToast('💾 ローカルに保存しました', 'info');
  }
}
```

### 3-3. アプリ起動時の読込フロー

```javascript
// アプリ起動時
async function initializeApp() {
  showLoadingScreen('データを読み込み中...');
  
  // Step 1: Firebaseコネクタの接続確認
  const isFirebaseConnected = await firebaseConnector.checkConnection();
  
  if (isFirebaseConnected) {
    // Step 2a: Firestoreから最新データを取得
    const cloudData = await loadFromFirestore(currentUserId);
    
    // Step 3a: localStorageと比較してマージ
    const localData = loadFromLocalStorage();
    const mergedData = mergeData(cloudData, localData);
    
    // Step 4a: localStorageを最新データで更新
    saveToLocalStorage(mergedData);
    
    // Step 5a: アプリに読み込み
    loadWorkflows(mergedData.workflows);
    loadFolders(mergedData.folders);
    loadSettings(mergedData.settings);
    
    hideLoadingScreen();
    showToast('🌐 クラウドから復元しました', 'success');
  } else {
    // Step 2b: localStorageのみから読込
    const localData = loadFromLocalStorage();
    
    // Step 3b: アプリに読み込み
    loadWorkflows(localData.workflows || []);
    loadFolders(localData.folders || defaultFolders);
    loadSettings(localData.settings || defaultSettings);
    
    hideLoadingScreen();
    showToast('💻 ローカルデータを読み込みました', 'info');
  }
}
```

### 3-4. フォルダとワークフローの表示

#### サイドバーのフォルダ・ワークフロー一覧

```
FOLDERS
📁 構成 ▾
   ┌─────────────────────────┐
   │ [サムネイル画像]        │ ← キャンバスの自動スクリーンショット
   │                         │
   │ Webアプリ開発フロー     │ ← タイトル（太字）
   │ フロントエンド→DB      │ ← 説明（小さい文字）
   │                         │
   │ 📊 5 nodes, 4 edges     │ ← ノード数・接続数
   │ 🕒 2時間前              │ ← 最終更新時刻
   │ 🏷️ 開発, Web           │ ← タグ
   └─────────────────────────┘
   
   ┌─────────────────────────┐
   │ [サムネイル画像]        │
   │                         │
   │ データ処理パイプライン  │
   │ ETL処理の全体フロー     │
   │                         │
   │ 📊 8 nodes, 7 edges     │
   │ 🕒 1日前                │
   │ 🏷️ データ, 分析         │
   └─────────────────────────┘

📁 接続 ▾
   ┌─────────────────────────┐
   │ [サムネイル画像]        │
   │ API連携設計             │
   │ ...                     │
   └─────────────────────────┘
```

#### ワークフローパッケージのクリック動作

```javascript
// ワークフローパッケージをクリック
workflowPackage.onclick = async function() {
  // 未保存の変更があるか確認
  if (hasUnsavedChanges()) {
    const confirm = await showConfirmDialog(
      '保存されていない変更があります。破棄しますか？'
    );
    if (!confirm) return;
  }
  
  // ワークフローを読み込み
  showLoadingScreen('ワークフローを読み込み中...');
  
  // localStorageから取得（高速）
  let workflow = localStorage.getItem(`workflow_${workflowId}`);
  
  if (!workflow && firebaseConnector.isConnected()) {
    // localStorageになければFirestoreから取得
    workflow = await firestore
      .collection('users')
      .doc(currentUserId)
      .collection('workflows')
      .doc(workflowId)
      .get();
  }
  
  // キャンバスにロード
  loadWorkflowToCanvas(JSON.parse(workflow));
  
  // アニメーション付きで表示
  animateNodesAppearance();
  
  hideLoadingScreen();
  showToast(`📂 "${workflow.title}" を開きました`, 'success');
};
```

### 3-5. データ復元の具体的シナリオ

#### シナリオ1: ブラウザキャッシュ削除
```
状況: 
- ユーザーがブラウザのキャッシュをクリア
- localStorageが完全に消去された

復元手順:
1. Flownaアプリを開く
2. Firebase Connectorが自動的に接続確認
3. 「ログインしてクラウドから復元」を提示
4. ログイン完了
5. Firestoreから全ワークフロー・フォルダを取得
6. localStorageに再構築
7. すべてのワークフローが表示される ✅

結果: 完全復元成功
```

#### シナリオ2: アプリ削除後の再インストール
```
状況:
- PCを初期化、または別のPCを使用
- Flownaアプリを新規インストール

復元手順:
1. Flownaアプリを起動（初回）
2. オンボーディング画面が表示
3. 「既存データを復元」を選択
4. Firebase Connectorに接続
5. Email/Googleアカウントでログイン
6. Firestoreから全データ取得
7. 以前のすべてのワークフローが復元 ✅

結果: 完全復元成功
```

#### シナリオ3: 別デバイスでの使用
```
状況:
- PCで作成したワークフローをタブレットで確認したい

手順:
1. タブレットでFlownaアプリを開く
2. Firebase Connectorに接続
3. PCと同じアカウントでログイン
4. Firestoreから全データを自動同期
5. PCで作成したワークフローがすべて表示 ✅
6. タブレットで編集可能
7. 編集内容は自動でFirestoreに保存
8. PC側でも最新状態が反映される ✅

結果: クロスデバイス同期成功
```

#### シナリオ4: オフライン作業
```
状況:
- インターネット接続がない環境で作業

動作:
1. Flownaアプリ起動
2. localStorageから既存データ読込 ✅
3. 通常通りワークフロー作成・編集可能 ✅
4. 「Save」ボタン → localStorageに保存 ✅
5. 「⚠️ オフライン: ローカルのみに保存」と表示
6. インターネット復帰を検知
7. 自動でFirestoreに同期開始
8. 「✅ クラウドに同期しました」と表示 ✅

結果: オフライン作業完全対応
```

### 3-6. Firestoreデータ構造の詳細

```javascript
// Firestore コレクション構造
users/
  {userId}/          // 例: "user_abc123"
    workflows/       // ワークフローコレクション
      {workflowId}/  // 例: "wf_20240130_001"
        {
          title: "Webアプリ開発フロー",
          description: "フロントエンドからDBまでの全体像",
          folderId: "folder-config",
          nodes: [
            {
              id: "node_1",
              title: "ユーザー入力",
              displayName: "ユーザー入力",
              category: "AGENT",
              icon: "🎯",
              color: "#a78bfa",
              x: 100,
              y: 200,
              width: 200,
              height: 100,
              description: "フォームからのデータ入力",
              status: "active",
              memo: "バリデーション必須"
            },
            // ... 他のノード
          ],
          connections: [
            {
              id: "conn_1",
              from: "node_1",
              to: "node_2",
              fromPort: "output",
              toPort: "input",
              style: "solid",
              animated: true
            },
            // ... 他の接続
          ],
          thumbnail: "data:image/png;base64,iVBORw0KGgoAAAANS...",
          tags: ["開発", "Web", "フロントエンド"],
          createdAt: Timestamp(2024, 1, 30, 10, 0, 0),
          updatedAt: Timestamp(2024, 1, 30, 15, 30, 0)
        }
    
    folders/         // フォルダコレクション
      {folderId}/    // 例: "folder-config"
        {
          name: "構成",
          icon: "📁",
          order: 1,
          color: "#60a5fa",
          createdAt: Timestamp(...)
        }
    
    customCategories/ // カスタムカテゴリ
      {categoryId}/
        {
          name: "データ処理",
          icon: "📊",
          color: "#4ade80",
          createdAt: Timestamp(...)
        }
    
    templates/       // ユーザー作成テンプレート
      {templateId}/
        {
          name: "カスタムETLテンプレート",
          description: "データ処理用",
          nodes: [...],
          connections: [...],
          thumbnail: "data:image/png;base64,...",
          createdAt: Timestamp(...)
        }
    
    settings/        // ユーザー設定（ドキュメント）
      {
        language: "ja",
        theme: "dark",
        onboardingCompleted: true,
        sidebarWidth: 280,
        defaultFolder: "folder-config",
        autoSave: true,
        syncInterval: 30000 // 30秒ごと
      }
```

### 3-7. データサイズと制限

#### localStorageの制限
- **容量**: 5-10MB（ブラウザ依存）
- **用途**: 直近30個のワークフローをキャッシュ
- **対策**: 古いワークフローはFirestoreから取得

#### Firestoreの制限（無料枠）
- **ストレージ**: 1GB
- **読取**: 50,000回/日
- **書込**: 20,000回/日

#### 容量計算
```
1ワークフロー:
  - ノード10個: 5KB
  - 接続10本: 2KB
  - サムネイル: 50KB
  - 合計: 約60KB

100ワークフロー = 6MB
500ワークフロー = 30MB
→ 無料枠で十分対応可能 ✅
```

### 3-8. 同期戦略

#### 自動同期のタイミング
```javascript
// 自動同期の実装
setInterval(async () => {
  if (firebaseConnector.isConnected() && hasUnsyncedChanges()) {
    await syncToFirestore();
    console.log('[Sync] 変更をFirestoreに同期しました');
  }
}, 30000); // 30秒ごと

// 手動同期
function forceSyncNow() {
  return syncToFirestore();
}
```

#### コンフリクト解決
```javascript
// 最終更新時刻で判定
function resolveConflict(localData, cloudData) {
  if (localData.updatedAt > cloudData.updatedAt) {
    // ローカルが新しい → Firestoreに上書き
    return 'upload';
  } else if (cloudData.updatedAt > localData.updatedAt) {
    // クラウドが新しい → ローカルに上書き
    return 'download';
  } else {
    // 同じ → 何もしない
    return 'skip';
  }
}
```

---

## 4. 実装優先度と段階的開発

### Phase 1: 基本機能（必須）
- [ ] デザイン実装（ダークブルーサイドバー + HUD）
- [ ] ノード追加UI（カスタム名・アイコン・色）
- [ ] ノードドラッグ移動
- [ ] インタラクティブ接続作成
- [ ] 接続削除
- [ ] 検索機能
- [ ] 言語切替

### Phase 2: ワークフロー管理（優先度高）
- [ ] フォルダ作成・管理
- [ ] ワークフロー保存機能
- [ ] ワークフロー読込機能
- [ ] サムネイル自動生成
- [ ] カスタムカテゴリ保存・復元

### Phase 3: コネクタ＋CI/CD（優先度高）
- [ ] コネクタ基盤実装
- [ ] **GitHub Connector（CI/CD連携）**
- [ ] **Claude Code Connector**
- [ ] **Firebase Connector**
- [ ] **Gemini Code Assist Connector**
- [ ] Custom API Connector
- [ ] Webhook受信機能

### Phase 4: 拡張機能
- [ ] ノード編集・カスタマイズUI
- [ ] メモ機能
- [ ] ステータス変更
- [ ] 右クリックメニュー（全種類）
- [ ] データインポート/エクスポート

---

## 4. UI/UXの詳細設計

### 4-1. ノードカスタマイズモーダル

#### レイアウト
```
┌─────────────────────────────┐
│ Customize Node              │
├─────────────────────────────┤
│ Node Name *                 │
│ [テキスト入力]              │
│                             │
│ Display Name                │
│ [テキスト入力]              │
│                             │
│ Category                    │
│ [既存選択 v] [+ New]        │
│                             │
│ Icon                        │
│ [😀] [🔧] [💡] [📁] [+]    │ ← 絵文字ピッカー
│                             │
│ Color                       │
│ [カラーピッカー]            │
│ [Purple][Blue][Orange][...]  │
│                             │
│ Description                 │
│ [テキストエリア]            │
├─────────────────────────────┤
│        [Cancel]  [Save]     │
└─────────────────────────────┘
```

### 4-2. GitHub Connector設定モーダル

#### レイアウト
```
┌─────────────────────────────┐
│ GitHub Connector Settings   │
├─────────────────────────────┤
│ [General][Auth][CI/CD][Logs]│ ← タブ
├─────────────────────────────┤
│ === CI/CD Settings ===      │
│                             │
│ ☑ Auto-trigger on save     │
│                             │
│ Repository                  │
│ [username/repo-name v]      │
│                             │
│ Branch                      │
│ [main v]                    │
│                             │
│ Workflows to trigger:       │
│ ☑ Run Tests                 │
│ ☑ Build & Deploy            │
│ ☐ Release                   │
│                             │
│ Webhook URL:                │
│ [https://flowna.app/...]    │
│ [Copy] [Regenerate]         │
├─────────────────────────────┤
│        [Cancel]  [Save]     │
└─────────────────────────────┘
```

### 4-3. 通知システム（CI/CD対応）

#### トースト通知
```
[緑バー] ワークフローを保存しました
[青バー] GitHub Actions: テスト実行中...
[緑バー] GitHub Actions: デプロイ成功
[赤バー] GitHub Actions: ビルド失敗
[黄バー] コネクタ: 再認証が必要です
```

---

## 5. 完成の定義

### 必須機能（Phase 1-3）
1. ノードの追加・編集・削除ができる
2. **ノード名・アイコン・色を自由にカスタマイズできる**
3. **カスタムカテゴリを作成できる**
4. ノードをドラッグで自由に配置できる
5. ポートをドラッグして接続を作成できる
6. フォルダを作成・管理できる
7. ワークフローを保存できる（カスタム情報も含む）
8. ワークフローを読み込める
9. **GitHub Connectorが動作する（CI/CD連携）**
10. **Claude Code Connectorが動作する**
11. **Firebase Connectorが動作する**
12. **Gemini Code Assist Connectorが動作する**
13. 言語切替が動作する

### デザイン品質
1. **サイドバーがダークブルーで統一されている**
2. **FLOWNAロゴがオレンジで目立つ**
3. ノードが半透明でガラスモーフィズム効果がある
4. 接続線が緑色で流れるアニメーションがある
5. 全体的に近未来的HUD感がある
6. **画像のデザインを忠実に再現している**

### CI/CD連携品質
1. **ワークフロー保存時にGitHub Actionsを自動実行できる**
2. **ノードから直接CI/CDをトリガーできる**
3. **GitHub Actionsの結果がFlownaで通知される**
4. **Webhookで外部イベントを受信できる**

---

## 最終定義

Flowna Config v4.1 は  
**「近未来的HUD UIで、カスタマイズ可能なノードを使い、  
思考と作業の流れをUE5 Blueprintの感覚で組み立て、  
CI/CD連携で実際の開発フローと統合する」**  
**完全に操作可能なノードベース・ワークフロー可視化Webアプリ**である。

### コアバリュー
1. **視覚的明瞭性**: ダークブルーHUD UI、半透明ノード、発光エフェクト
2. **完全カスタマイズ**: ノード名・アイコン・色・カテゴリを自由に変更
3. **動的表現**: 緑色パルス、データパケット、ベジェ曲線接続
4. **直感的操作**: ドラッグ＆ドロップ、UE5ライクな接続体験
5. **組織化**: フォルダによるワークフロー管理
6. **CI/CD統合**: GitHub Actions等との深い連携
7. **AI連携**: Claude Code、Gemini Code Assistとの統合
8. **拡張性**: 必要最小限のコネクタで高機能

この仕様書に従って実装すれば、デザイン・機能・CI/CD連携の全てが  
完璧に動作するプロフェッショナルなワークフロー管理アプリケーションが完成する。

---

END OF COMPLETE IMPLEMENTATION SPECIFICATION v4.1
