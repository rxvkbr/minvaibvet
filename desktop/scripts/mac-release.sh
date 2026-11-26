#!/bin/bash
# Publishes Вайбвет Офіс for Mac so anyone can download and open it:
# signs with your Developer ID, notarizes with Apple (same App Store Connect key as TestFlight),
# builds DMGs for Apple Silicon and Intel and uploads them to the "office-latest" GitHub release.
#
# Usage (on your Mac):
#   cd ~/minvaibvet && git fetch && git reset --hard origin/main && \
#   bash desktop/scripts/mac-release.sh ~/Downloads/AuthKey_75J47D8CW6.p8 33853eec-7fb9-4ba3-841d-a093168b2bd0
set -euo pipefail
KEY="${1:?Перший аргумент: шлях до AuthKey_XXXX.p8}"
ISSUER="${2:?Другий аргумент: Issuer ID з App Store Connect}"
[ -f "$KEY" ] || { echo "Немає файлу ключа: $KEY"; exit 1; }
KEY="$(cd "$(dirname "$KEY")" && pwd)/$(basename "$KEY")"
KEYID="$(basename "$KEY" | sed -E 's/^AuthKey_(.*)\.p8$/\1/')"
cd "$(dirname "$0")/.."
command -v node >/dev/null || { echo "Немає node: brew install node"; exit 1; }

ID="$(security find-identity -v -p codesigning | sed -n 's/.*"\(Developer ID Application: [^"]*\)".*/\1/p' | head -1)"
if [ -z "$ID" ]; then
  cat <<'T'
Немає сертифіката «Developer ID Application» у Keychain. Створи його один раз (1 хвилина):
  Xcode → Settings… → Accounts → твій Apple ID → команда → Manage Certificates…
  → «+» внизу ліворуч → Developer ID Application → Done.
Потім запусти цей скрипт ще раз.
T
  exit 1
fi
echo "Підписую як: $ID"

npm install --no-audit --no-fund
npm run prep
rm -rf dist
export APPLE_API_KEY="$KEY" APPLE_API_KEY_ID="$KEYID" APPLE_API_ISSUER="$ISSUER"
npx electron-builder --mac dmg --arm64 --x64 \
  -c.mac.identity="${ID#Developer ID Application: }" -c.mac.notarize=true --publish never

# the DMG itself: sign, notarize, staple, so the download opens without warnings
for D in dist/*.dmg; do
  codesign --force --sign "$ID" --timestamp "$D"
  echo "Нотаризую $D (кілька хвилин)…"
  xcrun notarytool submit "$D" --key "$KEY" --key-id "$KEYID" --issuer "$ISSUER" --wait
  xcrun stapler staple "$D"
  spctl -a -t open --context context:primary-signature -v "$D" && echo "Gatekeeper ок: $D"
done

if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  gh release upload office-latest dist/*.dmg --clobber -R rxvkbr/minvaibvet
  echo "Готово: https://minvaibvet.pp.ua/join#desk"
else
  open dist
  echo
  echo "DMG готові у desktop/dist (вікно Finder відкрито), але завантажити їх на GitHub нема чим."
  echo "Один раз:  brew install gh && gh auth login   (увійди у свій GitHub у браузері)"
  echo "Потім:     gh release upload office-latest desktop/dist/*.dmg --clobber -R rxvkbr/minvaibvet"
fi
