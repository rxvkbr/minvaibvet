#!/bin/bash
# Builds Вайбвет Офіс for this Mac and puts it into /Applications.
# Usage: cd ~/minvaibvet && git pull && bash desktop/scripts/mac.sh
set -euo pipefail
cd "$(dirname "$0")/.."
command -v node >/dev/null || { echo "Немає node: brew install node"; exit 1; }
npm install --no-audit --no-fund
ARCH=$(uname -m); [ "$ARCH" = "arm64" ] || ARCH=x64
npm run prep
rm -rf dist
CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --mac dir --$ARCH -c.mac.identity=- -c.mac.hardenedRuntime=false
APP=$(ls -d dist/mac*/*.app | head -1)
# Apple Silicon kills apps whose signature broke during packaging: re-sign ad hoc, inside out
xattr -cr "$APP"
codesign --force --deep --sign - "$APP"
codesign --verify --deep --strict "$APP" && echo "Підпис ок"
NAME=$(basename "$APP")
rm -rf "/Applications/Вайбвет Офіс.app" "/Applications/Vaibvet Office.app" "/Applications/$NAME"
cp -R "$APP" /Applications/
echo "Готово: /Applications/$NAME"
open "/Applications/$NAME" || true
