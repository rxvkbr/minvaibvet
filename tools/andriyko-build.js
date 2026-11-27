#!/usr/bin/env node
/* Build the trimmed excerpt set for «до Андрійка».
   node tools/andriyko-build.js /path/to/corpus.jsonl
   Reads public captions (jsonl: id, title, lang, text). Does not copy the raw
   transcripts into the app. Skips ehy5qUozzyA and ez1rZ94Q40U (noise).
   Writes vendor/andriyko-corpus.js: passages + a precomputed BM25 index.
   The suffix list and stopwords travel inside that file, so the page stems
   queries the same way this script stemmed the passages. */
"use strict";

const fs = require("fs");
const path = require("path");

const SKIP = new Set(["ehy5qUozzyA", "ez1rZ94Q40U"]);
const SRC = process.argv[2];
if (!SRC) {
  console.error("Вкажи корпус: node tools/andriyko-build.js corpus.jsonl");
  process.exit(1);
}

/* Longest suffix first. Stem must stay ≥ 4 letters. Keep in this order:
   the page uses the list exactly as shipped. */
const SUF = ["еннями", "аннями", "остями", "істями", "енням", "анням", "істю", "остю", "ення", "ання", "ість", "ості", "ами", "ями", "ові", "еві", "ому", "ему", "ого", "ими", "іми", "ою", "ею", "ати", "яти", "ути", "іти", "ння", "ття", "ах", "ях", "ів", "їв", "ам", "ям", "ий", "ій", "ов", "ев", "ом", "ем", "ей", "ти", "ся", "сь", "а", "я", "у", "ю", "і", "и", "е", "о", "є", "ь"];
const STOP_LIST = "і й та але або чи а бо ж би б не ні що як це той ця цей ці тих теж вже ще от ну тобто власне просто давайте вот щас ось так там тут мене мені моя мій моє мої ми ви він вона воно вони його її їх вам нас вас себе собі то тім тим яка який які яке якого якийсь якась щось хто коли де куди звідки якщо щоб чим про для над під при без до від по на в у з і я ти є бути був була було були буде будуть the a an of to and or in on for with from that this it is are was were be as at by you your we our i hello hi ok yes no".split(/\s+/);

const outPath = path.join(__dirname, "..", "vendor", "andriyko-corpus.js");

function normTok(w) { return w.toLowerCase().replace(/[^\p{L}\d]/gu, ""); }

/* \\b is ASCII-only, so Cyrillic repeats ("за ваш за ваш") have to be folded by tokens. */
function collapseRepeats(words) {
  const out = [];
  let i = 0;
  while (i < words.length) {
    let folded = false;
    for (let n = 4; n >= 1; n--) {
      if (i + 2 * n > words.length) continue;
      const a = words.slice(i, i + n).map(normTok).join(" ");
      const b = words.slice(i + n, i + 2 * n).map(normTok).join(" ");
      if (a && a === b && a.length > 1) { out.push(...words.slice(i, i + n)); i += 2 * n; folded = true; break; }
    }
    if (!folded) { out.push(words[i]); i++; }
  }
  return out;
}

function clean(raw) {
  let s = String(raw || "");
  s = s.replace(/\[[^\]]{0,48}\]/g, " ");
  s = s.replace(/>>+/g, " ");
  s = s.replace(/(^|\s)H(?=\s|$)/g, " ");
  s = s.replace(/\s+([,.!?;:…])/g, "$1");
  s = s.replace(/([.!?…])\1+/g, "$1");
  let words = s.split(/\s+/).filter(Boolean);
  words = collapseRepeats(collapseRepeats(words));
  return words.join(" ");
}

function sentences(s) {
  const bits = s.split(/(?<=[.!?…])\s+/);
  const out = [];
  let buf = "";
  const flush = () => { const t = buf.trim(); if (t) out.push(t); buf = ""; };
  for (const bit of bits) {
    buf = buf ? buf + " " + bit : bit;
    const n = buf.split(/\s+/).length;
    if ((n >= 14 && /[.!?…]$/.test(buf)) || n >= 48) flush();
  }
  flush();
  return out;
}

function wordsOf(s) { return s.split(/\s+/).filter(Boolean); }

function letterRatio(s, re) {
  const letters = (s.match(/[\p{L}]/gu) || []).length || 1;
  return (s.match(re) || []).length / letters;
}

function score(text, manual) {
  const words = wordsOf(text);
  const n = words.length;
  if (n < 50 || n > 170) return -1;
  const uniq = new Set(words.map((w) => w.toLowerCase().replace(/[^\p{L}]/gu, ""))).size;
  if (uniq / n < 0.48) return -1;
  /* і, в, з, я are ordinary Ukrainian words, not caption stutter */
  const func1 = { і: 1, й: 1, з: 1, в: 1, у: 1, я: 1, а: 1, о: 1, є: 1, е: 1, и: 1 };
  const singles = words.filter((w) => {
    const t = w.toLowerCase().replace(/[^\p{L}]/gu, "");
    return t.length === 1 && !func1[t];
  }).length;
  if (singles / n > 0.05) return -1;
  let sc = uniq / n * 8 + Math.min(n, 130) / 50;
  if (manual) sc += 1.2;
  if (/дельта|регістр|прогалин|мовленн|свідом|архетип|метафікц/i.test(text)) sc += 0.35;
  if (/це прогалина|між словом і ділом|тримаю шов|не наука про/i.test(text)) sc += 1.8;
  if (/^(добрий день|доброго ранку|доброго вечора|hello|ну що|пуф\b)/i.test(text)) sc += 0.7;
  if ((text.match(/е-е|м-м|а-а|ну-ну/gi) || []).length > 2) sc -= 1.4;
  return sc;
}

function videoReg(v) {
  if (/^en/i.test(v.lang)) return "en";
  const blob = (v.title + " " + v.text.slice(0, 280)).toLowerCase();
  const short = wordsOf(v.text).length < 900;
  if (short && /інструкц|вайб|студі|прогулян|встанов|клод|застосун|читає/.test(blob)) return "stu";
  if (short && wordsOf(v.text).length < 250) return "stu";
  return "lec";
}

function passagesOf(v) {
  const manual = /manual/i.test(v.lang);
  const en = videoReg(v) === "en";
  const sents = sentences(v.text).filter((t) => {
    const n = wordsOf(t).length;
    if (n < 8) return false;
    const ratio = letterRatio(t, en ? /[A-Za-z]/g : /[а-яіїєґА-ЯІЇЄҐ]/g);
    return ratio >= 0.62;
  });
  const seen = new Set();
  const uniq = [];
  for (const t of sents) {
    const key = t.toLowerCase().replace(/[^\p{L}\s]/gu, "").replace(/\s+/g, " ").slice(0, 96);
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(t);
  }
  const cands = [];
  let buf = [];
  let wn = 0;
  const emit = () => {
    if (!buf.length) return;
    const text = buf.join(" ");
    const sc = score(text, manual);
    if (sc > 0) cands.push({ text, sc, at: cands.length });
    buf = []; wn = 0;
  };
  for (const t of uniq) {
    const n = wordsOf(t).length;
    if (wn && wn + n > 150) emit();
    buf.push(t); wn += n;
    if (wn >= 90) emit();
  }
  emit();
  return cands;
}

function pick(cands, limit) {
  if (!cands.length) return [];
  const chosen = [];
  const take = (c) => { if (c && !chosen.includes(c) && chosen.length < limit) chosen.push(c); };
  take(cands[0]);
  const last = cands[cands.length - 1];
  if (/дякую|гарного|до нових|кнопочк|i'm out|father andrew is out|всім гарного/i.test(last.text)) take(last);
  const quart = [[], [], [], []];
  cands.forEach((c, i) => quart[Math.min(3, Math.floor(i / cands.length * 4))].push(c));
  quart.forEach((q) => { if (!q.length) return; q.sort((a, b) => b.sc - a.sc); take(q[0]); });
  const rest = cands.slice().sort((a, b) => b.sc - a.sc);
  for (const c of rest) {
    if (chosen.length >= limit) break;
    if (chosen.some((x) => jaccard(x.text, c.text) > 0.55)) continue;
    take(c);
  }
  chosen.sort((a, b) => a.at - b.at);
  return chosen;
}

function jaccard(a, b) {
  const A = new Set(wordsOf(a.toLowerCase()));
  const B = new Set(wordsOf(b.toLowerCase()));
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter || 1);
}

function stem(w) {
  w = w.toLowerCase().replace(/['’ʼ`-]/g, "");
  if (w.length < 5) return w;
  for (const s of SUF) {
    if (w.length - s.length >= 4 && w.endsWith(s)) return w.slice(0, -s.length);
  }
  return w;
}

function tokens(text) {
  return (text.toLowerCase().match(/[a-zа-яіїєґ0-9''’ʼ-]+/gi) || [])
    .map((w) => w.replace(/['’ʼ`-]/g, ""))
    .filter((w) => w.length >= 3);
}

const lines = fs.readFileSync(SRC, "utf8").trim().split("\n");
const videos = [];
for (const line of lines) {
  const o = JSON.parse(line);
  if (SKIP.has(o.id)) continue;
  const text = clean(o.text);
  if (wordsOf(text).length < 40) continue;
  videos.push({ id: o.id, title: o.title, lang: o.lang || "", text });
}

const docs = [];
for (const v of videos) {
  const reg = videoReg(v);
  const limit = reg === "stu" ? 2 : reg === "en" ? 3 : 5;
  for (const p of pick(passagesOf(v), limit)) {
    docs.push({ id: v.id, title: v.title, reg, text: p.text });
  }
}

const stop = {};
for (const w of STOP_LIST) stop[w] = 1;

const inv = {};
const dl = docs.map((d) => {
  const counts = {};
  let n = 0;
  for (const raw of tokens(d.text)) {
    if (stop[raw]) continue;
    const t = stem(raw);
    if (!t || t.length < 3 || stop[t]) continue;
    counts[t] = (counts[t] || 0) + 1;
    n++;
  }
  d._tf = counts;
  return n;
});
docs.forEach((d, i) => {
  for (const t of Object.keys(d._tf)) {
    (inv[t] = inv[t] || []).push([i, d._tf[t]]);
  }
  delete d._tf;
});
for (const t of Object.keys(inv)) inv[t].sort((a, b) => a[0] - b[0]);

const avgdl = dl.reduce((s, n) => s + n, 0) / (dl.length || 1);
const words = docs.reduce((s, d) => s + wordsOf(d.text).length, 0);
const vids = new Set(docs.map((d) => d.id));

const payload = {
  v: 1,
  skipped: ["ehy5qUozzyA", "ez1rZ94Q40U"],
  avgdl: Math.round(avgdl * 100) / 100,
  suf: SUF,
  stop: STOP_LIST,
  dl,
  docs: docs.map((d) => ({ id: d.id, title: d.title, reg: d.reg, text: d.text })),
  inv
};

const header = "/* до Андрійка · trimmed public captions of @andrew_amand.\n"
  + "   Not the raw transcripts. Built by tools/andriyko-build.js.\n"
  + "   Videos " + vids.size + ", passages " + docs.length + ", words " + words + ".\n"
  + "   Skipped as noise: ehy5qUozzyA, ez1rZ94Q40U.\n"
  + "   inv is a BM25 posting list: stem -> [[doc, tf], ...]. */\n";
const body = "window.ANDRIYKO_CORPUS=" + JSON.stringify(payload) + ";\n";
fs.writeFileSync(outPath, header + body);

function search(q, k) {
  const qtf = {};
  for (const raw of tokens(q)) {
    if (stop[raw]) continue;
    const t = stem(raw);
    if (!t || stop[t] || !inv[t]) continue;
    qtf[t] = (qtf[t] || 0) + 1;
  }
  const terms = Object.keys(qtf);
  const N = docs.length;
  const scores = new Array(N).fill(0);
  const k1 = 1.2, b = 0.75;
  for (const t of terms) {
    const post = inv[t];
    const idf = Math.log(1 + (N - post.length + 0.5) / (post.length + 0.5));
    for (const [i, tf] of post) {
      const denom = tf + k1 * (1 - b + b * dl[i] / avgdl);
      scores[i] += idf * (tf * (k1 + 1)) / denom;
    }
  }
  return scores.map((s, i) => ({ s, i })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, k);
}

const probes = [
  "дельта прогалина між словом і ділом",
  "ну що показуємо на клоді мандаринка",
  "Hello and welcome back to psycho linguistics"
];
console.log("passages", docs.length, "videos", vids.size, "words", words, "bytes", Buffer.byteLength(header + body));
console.log("by reg", docs.reduce((m, d) => (m[d.reg] = (m[d.reg] || 0) + 1, m), {}));
for (const q of probes) {
  const hit = search(q, 1)[0];
  console.log("Q:", q);
  if (!hit) { console.log("  (none)"); continue; }
  console.log("  ", docs[hit.i].reg, docs[hit.i].id, docs[hit.i].title.slice(0, 70));
  console.log("  ", docs[hit.i].text.slice(0, 180).replace(/\s+/g, " "));
}
