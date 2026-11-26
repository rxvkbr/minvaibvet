#!/usr/bin/env python3
"""Voices for the «Легіон» interface sound pack: espeak-ng + ffmpeg effects, one short mp3 per line.
Некромант from the beyond: low, slowed, a cave echo. Моряк Девід: warm, a little chorus, a room.
   python3 tools/legion-voices.py   →  audio/legion/<lang>/<who>-<kind>-<n>.mp3"""
import json, os, subprocess, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LINES = json.load(open(os.path.join(ROOT, "tools/legion-lines.json")))
VOICE = {"uk": "uk", "en": "en-gb", "nl": "nl", "ar": "ar", "zh": "cmn", "ru": "ru"}
SPEAK = {"nekromant": ["-p", "38", "-s", "138", "-a", "150"], "moriak": ["-p", "52", "-s", "148", "-a", "150"]}
FX = {
    # kinder: barely lowered, a soft room instead of a cave, rounded highs
    "nekromant": "asetrate=22050*0.95,aresample=22050,atempo=1.03,lowpass=f=4200,highpass=f=90,"
                 "aecho=0.85:0.5:60:0.15,volume=1.3,loudnorm=I=-18:TP=-2",
    "moriak": "asetrate=22050*0.99,aresample=22050,chorus=0.7:0.9:30:0.2:0.25:2,"
              "lowpass=f=5200,aecho=0.85:0.5:30:0.1,volume=1.3,loudnorm=I=-18:TP=-2",
}
n = 0
for who, kinds in LINES.items():
    for kind, langs in kinds.items():
        for lang, lines in langs.items():
            d = os.path.join(ROOT, "audio/legion", lang); os.makedirs(d, exist_ok=True)
            for i, text in enumerate(lines):
                with tempfile.NamedTemporaryFile(suffix=".wav") as w:
                    subprocess.run(["espeak-ng", "-v", VOICE[lang] + ("+m7" if who == "nekromant" else "+m1")] + SPEAK[who] + ["-w", w.name, text], check=True)
                    out = os.path.join(d, f"{who}-{kind}-{i}.mp3")
                    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", w.name, "-af", FX[who] + ",apad=pad_dur=0.25",
                                    "-ac", "1", "-ar", "22050", "-b:a", "40k", out], check=True)
                    n += 1
print(n, "clips")
