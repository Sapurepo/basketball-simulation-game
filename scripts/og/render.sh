#!/usr/bin/env bash
# OG 이미지(public/og.png)와 홈 화면 아이콘(public/apple-touch-icon.png)을 다시 만든다.
# 먼저 `pnpm dev` 를 띄우고 실행한다: scripts/og/render.sh [개발 서버 주소]
# 헤드리스 Chromium 경로는 CHROME 으로 바꿀 수 있다 (기본: Playwright 가 받아 둔 headless shell)
set -euo pipefail
cd "$(dirname "$0")/../.."
URL="${1:-http://localhost:5173}/scripts/og/og.html"
CHROME="${CHROME:-$(ls -d ~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell | tail -1)}"
shot() { "$CHROME" --headless --hide-scrollbars --virtual-time-budget=10000 --window-size="$1" --screenshot="$2" "$3" >/dev/null 2>&1; }
shot 1200,630 public/og.png "$URL"
shot 180,180 public/apple-touch-icon.png "$URL?icon"
echo "public/og.png, public/apple-touch-icon.png 생성"
