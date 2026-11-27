#!/bin/bash
# «Промінь»: local render agents on the Mac. One worker per core; scenes go into inbox/, pictures come out in out/.
#   bash tools/promin/agents.sh            watch inbox/ and render every new or changed scene
#   bash tools/promin/agents.sh scene.txt  render one scene now
#   (no Java or a warm Air? the cloud renders it: push the scene into inbox/, then bash tools/promin/cloud.sh)
cd "$(dirname "$0")"
# Homebrew's openjdk is keg-only: macOS's /usr/bin/java stub can't see it, so use it directly
if ! java -version >/dev/null 2>&1; then for d in "$(brew --prefix openjdk 2>/dev/null)/bin" /opt/homebrew/opt/openjdk/bin /usr/local/opt/openjdk/bin; do [ -x "$d/java" ] && export PATH="$d:$PATH" && break; done; fi
if ! command -v java >/dev/null || ! java -version >/dev/null 2>&1; then
  echo "Потрібна Java 11+. Встанови: brew install openjdk && sudo ln -sfn \$(brew --prefix)/opt/openjdk/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk.jdk"
  exit 1
fi
export JAVA_TOOL_OPTIONS="-Dstdout.encoding=UTF-8 -Dfile.encoding=UTF-8"
if [ -n "$1" ]; then exec java Promin.java "$1" "out/$(basename "${1%.*}").png"; fi
mkdir -p inbox out
echo "Кидай сцени (.txt) у $(pwd)/inbox — картинки з'являтимуться в $(pwd)/out"
open out 2>/dev/null
exec java Promin.java --watch inbox out
