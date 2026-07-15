#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
command -v node >/dev/null 2>&1 || { echo "Node.js 20.19+ or 22.12+ is required."; exit 1; }
[ -d node_modules ] || npm ci
[ -f .env ] || npm run setup
npm run build
npm run doctor
npm start
