#!/usr/bin/env python3
"""Voices for the «Легіон» interface sound pack: espeak-ng + ffmpeg effects, one short mp3 per line.
Некромант from the beyond: low, slowed, a cave echo. Моряк Девід: warm, a little chorus, a room.
   python3 tools/legion-voices.py   →  audio/legion/<lang>/<who>-<kind>-<n>.mp3"""
import json, os, subprocess, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LINES = json.load(open(os.path.join(ROOT, "tools/legion-lines.json")))
VOICE = {"uk": "uk", "en": "en-gb", "nl": "nl", "ar": "ar", "zh": "cmn", "ru": "ru"}
SPEAK = {"nekromant": ["-p", "22", "-s", "128", "-a", "170"], "moriak": ["-p", "46", "-s", "150", "-a", "170"]}
FX = {
    "nekromant": "asetrate=22050*0.86,aresample=22050,atempo=1.08,lowpass=f=3400,aecho=0.8:0.7:90|260:0.35|0.22,"
                 "aecho=0.6:0.5:520:0.18,volume=1.6,loudnorm=I=-17:TP=-2",
    "moriak": "asetrate=22050*0.96,aresample=22050,atempo=1.02,chorus=0.6:0.9:40|55:0.35|0.3:0.25|0.4:2|1.5,"
              "lowpass=f=5200,aecho=0.8:0.6:35:0.12,volume=1.4,loudnorm=I=-17:TP=-2",
}
n = 0
for who, kinds in LINES.items():
    for kind, langs in kinds.items():
        for lang, lines in langs.items():
            d = os.path.join(ROOT, "audio/legion", lang); os.makedirs(d, exist_ok=True)
            for i, text in enumerate(lines):
                with tempfile.NamedTemporaryFile(suffix=".wav") as w:
                    subprocess.run(["espeak-ng", "-v", VOICE[lang] + ("+m3" if who == "nekromant" else "+m1")] + SPEAK[who] + ["-w", w.name, text], check=True)
                    out = os.path.join(d, f"{who}-{kind}-{i}.mp3")
                    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", w.name, "-af", FX[who] + ",apad=pad_dur=0.25",
                                    "-ac", "1", "-ar", "22050", "-b:a", "40k", out], check=True)
                    n += 1
print(n, "clips")
