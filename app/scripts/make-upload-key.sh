#!/bin/bash
# Створює ключ завантаження для Google Play і зберігає його в секретах GitHub,
# щоб робочий процес «Android release (Google Play)» міг підписувати збірки.
#
# Запускати один раз, у Терміналі на своєму Mac:
#   bash make-upload-key.sh
#
# Потрібно: Java (keytool) і GitHub CLI (gh), у який ти вже увійшов (gh auth login).
# Якщо їх немає:  brew install openjdk gh
set -euo pipefail

REPO="rxvkbr/minvaibvet"
KS="$HOME/vaibvet-fm-upload-key.jks"

command -v keytool >/dev/null || { echo "Немає keytool. Встанови Java: brew install openjdk"; exit 1; }
command -v gh >/dev/null || { echo "Немає gh. Встанови: brew install gh, потім gh auth login"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Спершу увійди в GitHub: gh auth login"; exit 1; }
[ -e "$KS" ] && { echo "Ключ уже існує: $KS. Нічого не змінюю."; exit 1; }

read -r -s -p "Придумай пароль для ключа (щонайменше 6 символів): " PW; echo
read -r -s -p "Повтори пароль: " PW2; echo
[ "$PW" = "$PW2" ] || { echo "Паролі не збігаються."; exit 1; }
[ ${#PW} -ge 6 ] || { echo "Закороткий пароль."; exit 1; }

keytool -genkeypair -keystore "$KS" -alias upload -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "$PW" -keypass "$PW" -dname "CN=Vibecat FM, O=Vibecat FM, C=UA" >/dev/null

base64 -i "$KS" | gh secret set UPLOAD_KEYSTORE_BASE64 -R "$REPO"
printf %s "$PW"  | gh secret set UPLOAD_STORE_PASSWORD -R "$REPO"
printf %s "$PW"  | gh secret set UPLOAD_KEY_PASSWORD   -R "$REPO"
printf upload    | gh secret set UPLOAD_KEY_ALIAS      -R "$REPO"
unset PW PW2

echo
echo "Готово. Секрети збережено в репозиторії $REPO."
echo "Сам ключ лежить тут: $KS"
echo "Збережи його копію і пароль у менеджері паролів. Без них нові версії в Google Play не завантажиш."
