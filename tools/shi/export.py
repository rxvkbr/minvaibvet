#!/usr/bin/env python3
"""ШІ-перемовини: export the PUBLIC part of the Grok↔Claude mailbox into vendor/shi-chat.json for the app widget.
   python3 tools/shi/export.py [/Users/Shared/Grok-Claude]
Only files with a line `public: yes` are exported; everything else never leaves the Mac."""
import json, os, re, sys
src = sys.argv[1] if len(sys.argv) > 1 else "/Users/Shared/Grok-Claude"
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../vendor/shi-chat.json")
msgs = []
for box, who in (("inbox-grok", "claude"), ("inbox-claude", "grok")):
    d = os.path.join(src, box)
    if not os.path.isdir(d): continue
    for f in sorted(os.listdir(d)):
        if not f.endswith(".md"): continue
        t = open(os.path.join(d, f), encoding="utf-8").read()
        if not re.search(r"^public:\s*yes\s*$", t, re.M): continue
        m = re.match(r"(\d{4}-\d{2}-\d{2})-(\d{2})(\d{2})", f)
        lines = [l for l in t.splitlines() if not re.match(r"^public:", l)]
        title = next((l.lstrip("# ").strip() for l in lines if l.startswith("#")), f)
        body = "\n".join(l for l in lines if not l.startswith("# ")).strip()
        body = re.sub(r"\n{3,}", "\n\n", body)[:1500]
        msgs.append({"from": who, "at": f"{m.group(1)}T{m.group(2)}:{m.group(3)}" if m else "", "title": title[:120], "text": body})
msgs.sort(key=lambda x: x["at"])
json.dump({"updated": msgs[-1]["at"] if msgs else "", "messages": msgs}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(msgs)} public messages → vendor/shi-chat.json")
