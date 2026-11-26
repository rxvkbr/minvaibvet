#!/bin/bash
# Builds the iOS app on this Mac and uploads it to TestFlight with the App Store Connect API key.
# Needs: Xcode (with its command line tools), Node.js 20+, CocoaPods (brew install cocoapods).
# Run from anywhere inside the repo:
#   bash app/scripts/ios-testflight.sh ~/Downloads/AuthKey_75J47D8CW6.p8 <ISSUER_ID>
set -euo pipefail

P8="${1:-}"; ISSUER_ID="${2:-}"; TEAM_ID="${TEAM_ID:-G52558SB6U}"
if [ -z "$P8" ] || [ ! -f "$P8" ] || [ -z "$ISSUER_ID" ]; then
  echo "Як запускати: bash app/scripts/ios-testflight.sh ~/Downloads/AuthKey_XXXX.p8 <Issuer ID>"; exit 1
fi
KEY_ID="$(basename "$P8" .p8)"; KEY_ID="${KEY_ID#AuthKey_}"
P8="$(cd "$(dirname "$P8")" && pwd)/$(basename "$P8")"

for tool in xcodebuild node npm pod; do
  command -v "$tool" >/dev/null || { echo "Не знайдено $tool. Встановіть: Xcode з App Store, Node.js з nodejs.org, CocoaPods: brew install cocoapods"; exit 1; }
done

APP="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP"
echo "→ Готую сайт для додатка"
npm ci --silent
npm run -s web
npx cap sync ios
ruby scripts/ios-add-widgets.rb   # the WidgetKit extension (does nothing if it is already there)

BUILD="$(date +%y%m%d%H%M)"
OUT="$(mktemp -d)"
cd ios/App
AUTH=(-allowProvisioningUpdates -authenticationKeyPath "$P8" -authenticationKeyID "$KEY_ID" -authenticationKeyIssuerID "$ISSUER_ID")

echo "→ Збираю й підписую (збірка $BUILD). Це займе кілька хвилин."
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$OUT/App.xcarchive" \
  DEVELOPMENT_TEAM="$TEAM_ID" CODE_SIGN_STYLE=Automatic CURRENT_PROJECT_VERSION="$BUILD" \
  "${AUTH[@]}" archive -quiet

cat > "$OUT/ExportOptions.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>upload</string>
  <key>teamID</key><string>$TEAM_ID</string>
  <key>signingStyle</key><string>automatic</string>
  <key>manageAppVersionAndBuildNumber</key><false/>
</dict></plist>
EOF

echo "→ Завантажую в App Store Connect"
xcodebuild -exportArchive -archivePath "$OUT/App.xcarchive" -exportOptionsPlist "$OUT/ExportOptions.plist" \
  -exportPath "$OUT/export" "${AUTH[@]}" -quiet

echo "Готово: збірка $BUILD у дорозі в TestFlight. Apple обробляє її 10–20 хвилин, потім прийде лист."
