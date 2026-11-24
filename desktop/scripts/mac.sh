#!/bin/bash
# Builds Вайбвет Офіс for this Mac and puts it into /Applications.
# Usage: cd ~/minvaibvet && git pull && bash desktop/scripts/mac.sh
set -euo pipefail
cd "$(dirname "$0")/.."
command -v node >/dev/null || { echo "Немає node: brew install node"; exit 1; }
npm install --no-audit --no-fund
ARCH=$(uname -m); [ "$ARCH" = "arm64" ] || ARCH=x64
npm run prep
# not signed with a Developer ID yet: fine for this Mac, other Macs would show a Gatekeeper warning
CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --mac dir --$ARCH -c.mac.identity=null
APP=$(ls -d dist/mac*/*.app | head -1)
rm -rf "/Applications/Вайбвет Офіс.app"
cp -R "$APP" /Applications/
echo "Готово: /Applications/Вайбвет Офіс.app"
open "/Applications/Вайбвет Офіс.app"
