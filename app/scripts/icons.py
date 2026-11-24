#!/usr/bin/env python3
"""Generates the alternate app icons (iOS asset catalogs, Android adaptive mipmaps, web previews)
by recolouring the swallow icon in app/assets. Run from the repo root: python3 app/scripts/icons.py"""
import json, os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
A = os.path.join(ROOT, "app", "assets")
IOS = os.path.join(ROOT, "app", "ios", "App", "App", "Assets.xcassets")
RES = os.path.join(ROOT, "app", "android", "app", "src", "main", "res")
WEB = os.path.join(ROOT, "img", "icons")

# name: bg edge, bg centre, swallow, glow, scale, needle
P = {
    "zona":     ("#0c0f08", "#2c3a1c", "#f1f5e0", "#9fd66a", "#d9a441", "#e0603f"),
    "nich":     ("#04070d", "#12305a", "#eaf6ff", "#6fc3ff", "#7af0d0", "#ff6f91"),
    "burshtyn": ("#0e0900", "#4a2c00", "#fff3d6", "#ffb000", "#ffcf73", "#ff7a2f"),
    "okop":     ("#12060f", "#4a1440", "#ffe9f6", "#ff6fb5", "#c7a2ff", "#ff5d73"),
    "ukr":      ("#06173d", "#0e47b3", "#fff6cc", "#ffd500", "#ffd500", "#ffffff"),
    "mono":     ("#0a0a0a", "#3a3a3a", "#ffffff", "#bdbdbd", "#dddddd", "#ffffff"),
    "svitanok": ("#d9c9a3", "#fbf3df", "#1a100b", "#ff5d47", "#b4552e", "#e0603f"),
}

def rgb(h): h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def lerp(a, b, t): return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))

BG = Image.open(os.path.join(A, "icon-background.png")).convert("RGB")
FG = Image.open(os.path.join(A, "icon-foreground.png")).convert("RGBA")
E0, C0 = (22, 12, 7), (73, 36, 21)

def background(edge, centre):
    edge, centre = rgb(edge), rgb(centre)
    out = Image.new("RGB", BG.size)
    src, dst = BG.load(), out.load()
    for y in range(BG.size[1]):
        for x in range(BG.size[0]):
            r = src[x, y][0]
            t = max(0.0, min(1.0, (r - E0[0]) / (C0[0] - E0[0])))
            dst[x, y] = lerp(edge, centre, t)
    return out

def foreground(core, glow, scale, needle):
    core, glow, scale, needle = map(rgb, (core, glow, scale, needle))
    out = Image.new("RGBA", FG.size)
    src, dst = FG.load(), out.load()
    for y in range(FG.size[1]):
        for x in range(FG.size[0]):
            r, g, b, a = src[x, y]
            if a == 0:
                continue
            if y >= 590:  # the tuning scale and its needle
                c = scale if g > 130 else needle
            else:         # the swallow: glow red blends into the light body
                c = lerp(glow, core, max(0.0, min(1.0, (g - 81) / 159)))
            dst[x, y] = c + (a,)
    return out

def full(bg, fg):
    """iOS / legacy icon: the swallow bigger, as on the original icon-only.png."""
    s = 1.667
    big = fg.resize((round(1024 * s), round(1024 * s)), Image.LANCZOS)
    img = bg.copy().convert("RGBA")
    off = (round(512 - 512 * s), round(512 - 512 * s + 8))
    img.alpha_composite(big, (max(0, off[0]), max(0, off[1])), (max(0, -off[0]), max(0, -off[1])))
    return img.convert("RGB")

ADAPTIVE = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_{n}_bg" />
    <foreground android:drawable="@mipmap/ic_launcher_{n}_fg" />
</adaptive-icon>
"""

os.makedirs(WEB, exist_ok=True)
Image.open(os.path.join(A, "icon-only.png")).convert("RGB").resize((180, 180), Image.LANCZOS).save(os.path.join(WEB, "efir.png"))
for n, (e, c, core, glow, scale, needle) in P.items():
    bg, fg = background(e, c), foreground(core, glow, scale, needle)
    icon = full(bg, fg)
    d = os.path.join(IOS, "AppIcon-%s.appiconset" % n)
    os.makedirs(d, exist_ok=True)
    icon.save(os.path.join(d, "icon.png"))
    json.dump({"images": [{"idiom": "universal", "platform": "ios", "size": "1024x1024", "filename": "icon.png"}],
               "info": {"author": "xcode", "version": 1}}, open(os.path.join(d, "Contents.json"), "w"), indent=2)
    m = os.path.join(RES, "mipmap-xxxhdpi")
    fg.resize((432, 432), Image.LANCZOS).save(os.path.join(m, "ic_launcher_%s_fg.png" % n))
    bg.resize((432, 432), Image.LANCZOS).save(os.path.join(m, "ic_launcher_%s_bg.png" % n))
    small = icon.resize((192, 192), Image.LANCZOS)
    small.save(os.path.join(m, "ic_launcher_%s.png" % n))
    mask = Image.new("L", (192, 192), 0); ImageDraw.Draw(mask).ellipse((0, 0, 191, 191), fill=255)
    rnd = Image.new("RGBA", (192, 192), (0, 0, 0, 0)); rnd.paste(small, (0, 0), mask); rnd.save(os.path.join(m, "ic_launcher_%s_round.png" % n))
    for suffix in ("", "_round"):
        open(os.path.join(RES, "mipmap-anydpi-v26", "ic_launcher_%s%s.xml" % (n, suffix)), "w").write(ADAPTIVE.format(n=n))
    icon.resize((180, 180), Image.LANCZOS).save(os.path.join(WEB, n + ".png"))
    print("icon", n)
