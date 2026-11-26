#!/bin/bash
# «Промінь» у хмарі: GitHub рендерить сцени з inbox/, а цей скрипт забирає готові картинки в out/.
#   bash tools/promin/cloud.sh            забрати всі готові картинки
#   bash tools/promin/cloud.sh tuga       забрати одну
# Нова сцена: поклади .txt у tools/promin/inbox/ і запуш (або попроси пана Клоденка) — за кілька хвилин картинка готова.
cd "$(dirname "$0")"
mkdir -p out
RAW="https://raw.githubusercontent.com/rxvkbr/minvaibvet/promin"
if [ -n "$1" ]; then names="$1"; else names=$(ls inbox/*.txt 2>/dev/null | xargs -n1 basename | sed 's/\.txt$//'); fi
for n in $names; do
  if curl -fsSL "$RAW/$n.png?$(date +%s)" -o "out/$n.png.part"; then mv "out/$n.png.part" "out/$n.png"; echo "✓ out/$n.png"
  else rm -f "out/$n.png.part"; echo "… $n ще рендериться (або такої сцени немає)"; fi
done
open out 2>/dev/null || true
