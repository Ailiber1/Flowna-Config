#!/bin/bash

# Claude Code テンプレートインストーラー
# このスクリプトでCLAUDE_TEMPLATE.mdを~/.claude/CLAUDE.mdにインストールします

TEMPLATE_SOURCE="$(dirname "$0")/CLAUDE_TEMPLATE.md"
CLAUDE_DIR="$HOME/.claude"
CLAUDE_MD="$CLAUDE_DIR/CLAUDE.md"

# ~/.claudeディレクトリ作成
mkdir -p "$CLAUDE_DIR"

# 既存ファイルのバックアップ
if [ -f "$CLAUDE_MD" ]; then
    BACKUP="$CLAUDE_MD.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$CLAUDE_MD" "$BACKUP"
    echo "既存のCLAUDE.mdをバックアップしました: $BACKUP"
fi

# テンプレートをコピー
cp "$TEMPLATE_SOURCE" "$CLAUDE_MD"

echo ""
echo "============================================"
echo "  インストール完了"
echo "============================================"
echo ""
echo "テンプレートの場所: $CLAUDE_MD"
echo ""
echo "使い方:"
echo "  1. ターミナルで 'claude' を起動"
echo "  2. 仕様書を貼り付け"
echo "  3. 自動でアプリ作成→デプロイ"
echo ""
