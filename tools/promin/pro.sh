#!/bin/bash
# «Сцени Променя» для Pro: замовлення з GitHub (мітка scene) рендеряться на ЦЬОМУ Маку і йдуть у застосунок.
#   bash tools/promin/pro.sh                 переглянути замовлення: кожне показує сцену й питає «Рендерити? [y/N]»
#   bash tools/promin/pro.sh publish tuga    опублікувати свою сцену з inbox/tuga.txt у галерею
# Нічого не рендериться й не публікується без твого «y». Потрібні Java 11+ і gh (brew install openjdk gh).
set -e
cd "$(dirname "$0")"; ROOT="$(cd ../.. && pwd)"; REPO=rxvkbr/minvaibvet
export JAVA_TOOL_OPTIONS="-Dstdout.encoding=UTF-8 -Dfile.encoding=UTF-8"
# Homebrew's openjdk is keg-only: macOS's /usr/bin/java stub can't see it, so use it directly
if ! java -version >/dev/null 2>&1; then for d in "$(brew --prefix openjdk 2>/dev/null)/bin" /opt/homebrew/opt/openjdk/bin /usr/local/opt/openjdk/bin; do [ -x "$d/java" ] && export PATH="$d:$PATH" && break; done; fi
command -v java >/dev/null && java -version >/dev/null 2>&1 || { echo "Потрібна Java: brew install openjdk"; exit 1; }
mkdir -p inbox out "$ROOT/img/sceny"

# a scene from a stranger may only use Promin's own words, within sane limits
check() { python3 - "$1" <<'PY'
import sys,re
ok={"size","samples","bounces","camera","sky","fog","material","sphere","plane","box"};n=0
for l in open(sys.argv[1],encoding="utf-8"):
    l=l.strip()
    if not l or l.startswith("#"):continue
    w=l.split()
    if w[0] not in ok:sys.exit("невідоме слово: "+w[0])
    if not all(re.fullmatch(r"[-+]?\d+(\.\d+)?|[A-Za-z0-9_]{1,20}",x) for x in w[1:]):sys.exit("дивний рядок: "+l[:60])
    if w[0]=="size" and (int(float(w[1]))>1600 or int(float(w[2]))>1000):sys.exit("завелика картинка")
    if w[0]=="samples" and int(float(w[1]))>128:sys.exit("забагато samples")
    if w[0] in("sphere","box","plane"):n+=1
if n>60:sys.exit("забагато обʼєктів")
PY
}

publish() { # name title
  local n="$1" title="$2"
  java Promin.java "inbox/$n.txt" "out/$n.png" | tail -1
  sips -s format jpeg -s formatOptions 82 "out/$n.png" --out "$ROOT/img/sceny/$n.jpg" >/dev/null
  python3 - "$ROOT/img/sceny/index.json" "$n" "$title" <<'PY'
import json,sys,datetime
p,n,t=sys.argv[1:];a=[x for x in json.load(open(p)) if x["id"]!=n]
a.insert(0,{"id":n,"title":t,"date":datetime.date.today().isoformat()});json.dump(a,open(p,"w"),ensure_ascii=False,indent=1)
PY
  (cd "$ROOT" && git add img/sceny && git commit -qm "Сцени Променя: $title" && git pull -q --rebase && git push -q) && echo "✓ $n у галереї"
}

if [ "$1" = "publish" ]; then
  [ -f "inbox/$2.txt" ] || { echo "Немає inbox/$2.txt"; exit 1; }
  check "inbox/$2.txt" && publish "$2" "$(head -1 "inbox/$2.txt" | sed 's/^# *//')"; exit 0
fi

command -v gh >/dev/null || { echo "Потрібен gh: brew install gh && gh auth login"; exit 1; }
gh issue list -R $REPO --label scene --state open --json number,title,body > /tmp/promin-orders.json
python3 -c "import json;print(len(json.load(open('/tmp/promin-orders.json'))))" | grep -qx 0 && { echo "Нових замовлень немає ☀️"; exit 0; }
for num in $(python3 -c "import json;[print(o['number']) for o in json.load(open('/tmp/promin-orders.json'))]"); do
  python3 - "$num" <<'PY' > "inbox/pro-$num.txt"
import json,sys,re
o=[x for x in json.load(open("/tmp/promin-orders.json")) if x["number"]==int(sys.argv[1])][0]
m=re.search(r"```(?:scene)?\n(.*?)```",o["body"] or "",re.S)
print("# "+re.sub(r"[^\w\s'’«»,.!?-]","",o["title"])[:80]);print(m.group(1) if m else "")
PY
  echo; echo "════ Замовлення №$num ════"; cat "inbox/pro-$num.txt"
  if ! check "inbox/pro-$num.txt"; then echo "↷ пропускаю: сцена не пройшла перевірку"; rm -f "inbox/pro-$num.txt"; continue; fi
  read -r -p "Рендерити й опублікувати? [y/N] " a
  if [ "$a" = "y" ]; then
    publish "pro-$num" "$(head -1 "inbox/pro-$num.txt" | sed 's/^# *//')"
    gh issue close $num -R $REPO -c "Готово ✨ Сцена вже в галереї «Сцени Променя» у застосунку (з'явиться після оновлення вмісту)." >/dev/null
  else rm -f "inbox/pro-$num.txt"; echo "↷ лишаю на потім"; fi
done
