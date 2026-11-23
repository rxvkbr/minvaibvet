#!/bin/bash
# Saves the App Store Connect API key as GitHub secrets, so GitHub Actions can sign the iOS app and upload it to TestFlight.
# Run on your Mac:  bash make-ios-secrets.sh ~/Downloads/AuthKey_XXXXXXXXXX.p8
# Needs the GitHub CLI (brew install gh) signed in to the account that owns rxvkbr/minvaibvet.
set -euo pipefail
REPO="rxvkbr/minvaibvet"

P8="${1:-}"
if [ -z "$P8" ] || [ ! -f "$P8" ]; then
  echo "Вкажіть шлях до файлу .p8, наприклад: bash make-ios-secrets.sh ~/Downloads/AuthKey_ABC123XYZ9.p8"
  exit 1
fi

# The key ID is part of the file name Apple gives it: AuthKey_<KEY_ID>.p8
KEY_ID="$(basename "$P8" .p8)"; KEY_ID="${KEY_ID#AuthKey_}"
read -r -p "Key ID [$KEY_ID]: " ans; KEY_ID="${ans:-$KEY_ID}"
read -r -p "Issuer ID (App Store Connect → Users and Access → Integrations, над списком ключів): " ISSUER_ID
read -r -p "Team ID (developer.apple.com → Account → Membership details): " TEAM_ID

gh secret set ASC_KEY_ID --repo "$REPO" --body "$KEY_ID"
gh secret set ASC_ISSUER_ID --repo "$REPO" --body "$ISSUER_ID"
gh secret set APPLE_TEAM_ID --repo "$REPO" --body "$TEAM_ID"
base64 < "$P8" | tr -d '\n' | gh secret set ASC_KEY_P8_BASE64 --repo "$REPO"

echo "Готово: чотири секрети збережено в $REPO."
echo "Сам файл .p8 збережіть у надійному місці: Apple дає завантажити його лише один раз."
