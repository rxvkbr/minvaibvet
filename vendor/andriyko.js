/* «до Андрійка»: local retrieval, local prompt, online continuation, offline chain.
   The corpus and the stem list live in andriyko-corpus.js. The address of the
   model lives in andriyko-config.js and can be overridden on the device. */
(function () {
  "use strict";
  var C = window.ANDRIYKO_CORPUS;
  if (!C || !C.docs) {
    window.ANDRIYKO = { ready: false, retrieve: function () { return []; }, assemble: function () { return { system: "", user: "" }; }, offline: function () { return ""; }, complete: function () { return Promise.resolve({ text: "", source: "offline", hits: [], error: "corpus" }); } };
    return;
  }

  var STOP = {};
  (C.stop || []).forEach(function (w) { STOP[w] = 1; });
  var SUF = C.suf || [];
  var K1 = 1.2, B = 0.75;

  var SYSTEM = [
    "Ти продовжуєш репліку Андрія Аманда (отець Андрій; англійською — Father Andrew) його власним усним голосом. Це не пародія, не енциклопедія і не чужий літературний стиль.",
    "Два регістри. Підхопи той, у якому почато фразу.",
    "1. Гурток / лекція. Звертання, названий термін, одне речення визначення, етична позиція, довгі періоди з «і власне» та «не X, а Y», клінічна лексика: дельта, прогалина, регістр, мовлення, називання. Фінал повертає до вже введеного слова, потім подяка і побажання дня або здоров'я.",
    "2. Студія / вайб. Короткі такти: «От.», «Ну.», «Так.». Показ дії, пан Клоденко, побутова деталь. Частки от, ну, тобто, власне, просто, іноді вот і щас — каркас думки, не вся фраза. Кінець: «Всім гарного дня», «Пуньк», «Кнопочка» або «Father Andrew is out».",
    "Як продовжувати:",
    "Не повторюй поданий початок і не починай спочатку. Договори з місця обриву.",
    "Не випрасовуй у нейтральну правильну українську. Лишай його частки, але не зводь текст до самих часток.",
    "Нову думку назви, коротко визнач, покрути навколо неї.",
    "Перша особа, чоловічий рід українською. Якщо початок англійською — тепліший розхристаний регістр того ж курсу, Father Andrew.",
    "Лайка рідко і влучно. У лекції майже ніколи.",
    "Уривки нижче — публічні субтитри, орієнтир ритму. Не копіюй їх дослівно і не відтворюй явно бите слово авторозпізнавання.",
    "Обсяг: близько 90–160 слів, один живий блок, без заголовків і без списків."
  ].join("\n");

  function stem(w) {
    w = String(w || "").toLowerCase().replace(/['’ʼ`-]/g, "");
    if (w.length < 5) return w;
    var i, s;
    for (i = 0; i < SUF.length; i++) {
      s = SUF[i];
      if (w.length - s.length >= 4 && w.slice(-s.length) === s) return w.slice(0, -s.length);
    }
    return w;
  }

  function tokens(text) {
    return (String(text || "").toLowerCase().match(/[a-zа-яіїєґ0-9''’ʼ-]+/gi) || [])
      .map(function (w) { return w.replace(/['’ʼ`-]/g, ""); })
      .filter(function (w) { return w.length >= 3; });
  }

  function retrieve(query, k) {
    k = k || 3;
    var q = {}, raw, t, i;
    var list = tokens(query);
    for (i = 0; i < list.length; i++) {
      raw = list[i];
      if (STOP[raw]) continue;
      t = stem(raw);
      if (!t || t.length < 3 || STOP[t] || !C.inv[t]) continue;
      q[t] = 1;
    }
    var terms = Object.keys(q), N = C.docs.length, scores = [];
    for (i = 0; i < N; i++) scores.push(0);
    var ti, post, idf, j, tf, denom;
    for (ti = 0; ti < terms.length; ti++) {
      post = C.inv[terms[ti]];
      idf = Math.log(1 + (N - post.length + 0.5) / (post.length + 0.5));
      for (j = 0; j < post.length; j++) {
        tf = post[j][1];
        denom = tf + K1 * (1 - B + B * C.dl[post[j][0]] / C.avgdl);
        scores[post[j][0]] += idf * (tf * (K1 + 1)) / denom;
      }
    }
    var order = [];
    for (i = 0; i < N; i++) if (scores[i] > 0) order.push(i);
    order.sort(function (a, b) { return scores[b] - scores[a]; });
    var out = [];
    for (i = 0; i < order.length && out.length < k; i++) {
      var d = C.docs[order[i]];
      out.push({ id: d.id, title: d.title, reg: d.reg, text: d.text, score: scores[order[i]] });
    }
    return out;
  }

  function fallbackHits(seed) {
    var latin = /[a-z]/i.test(seed) && !/[а-яіїєґ]/i.test(seed);
    var want = latin ? "en" : "lec";
    var out = [], i, d;
    for (i = 0; i < C.docs.length && out.length < 3; i++) {
      d = C.docs[i];
      if (d.reg === want) out.push({ id: d.id, title: d.title, reg: d.reg, text: d.text, score: 0 });
    }
    for (i = 0; i < C.docs.length && out.length < 3; i++) {
      d = C.docs[i];
      if (!out.some(function (x) { return x.text === d.text; })) out.push({ id: d.id, title: d.title, reg: d.reg, text: d.text, score: 0 });
    }
    return out;
  }

  function clip(text, n) {
    if (text.length <= n) return text;
    var s = text.slice(0, n);
    var cut = Math.max(s.lastIndexOf(". "), s.lastIndexOf("! "), s.lastIndexOf("? "));
    if (cut > n * 0.55) return s.slice(0, cut + 1);
    return s.trim() + "…";
  }

  function registerOf(seed) {
    var s = seed.toLowerCase();
    if (/[a-z]/i.test(seed) && !/[а-яіїєґ]/i.test(seed)) return "en";
    var stu = /ну що|щас|вот|клод|студі|мандар|кнопочк|плюс-мінус/.test(s);
    var lec = /добрий день|шановн|громад|гіпотез|дельта|регістр|психолінгв|прогалин/.test(s);
    if (stu && !lec) return "stu";
    if (lec && !stu) return "lec";
    return "mix";
  }

  function langOf(seed) {
    return /[a-z]/i.test(seed) && !/[а-яіїєґ]/i.test(seed) ? "en" : "uk";
  }

  function assemble(seed, hits) {
    var reg = registerOf(seed);
    var lang = langOf(seed);
    var regName = reg === "stu" ? "студія" : reg === "lec" ? "лекція" : reg === "en" ? "англійський курс" : "мішане, дивись на початок";
    var bits = (hits || []).map(function (h, i) {
      return (i + 1) + ". (" + (h.reg === "en" ? "англійською" : h.reg === "stu" ? "студія" : "лекція") + ") " + clip(h.text, 520);
    });
    var system = SYSTEM + "\n\nУривки його мовлення, орієнтир ритму, не цитата:\n" + bits.join("\n\n");
    var user = "Мова продовження: " + (lang === "en" ? "англійська." : "українська.")
      + " Регістр початку: " + regName + ".\n"
      + "Продовж з місця обриву. Не повторюй цей початок.\n\n" + String(seed || "").trim();
    return { system: system, user: user, lang: lang, reg: reg };
  }

  /* ---------- word chain, built once from the excerpts ---------- */
  var chain = null;
  function lex(s) {
    return (String(s || "").toLowerCase().match(/[a-zа-яіїєґ0-9''’ʼ-]+|[.!?]/gi) || []);
  }
  function ensureChain() {
    if (chain) return chain;
    var one = {}, bi = {}, i, j, toks, a, b, c3, bag;
    for (i = 0; i < C.docs.length; i++) {
      toks = lex(C.docs[i].text);
      for (j = 0; j < toks.length; j++) {
        if (j + 1 < toks.length) {
          a = toks[j];
          bag = one[a] || (one[a] = {});
          bag[toks[j + 1]] = (bag[toks[j + 1]] || 0) + 1;
        }
        if (j + 2 < toks.length) {
          b = toks[j] + "\0" + toks[j + 1];
          bag = bi[b] || (bi[b] = {});
          c3 = toks[j + 2];
          bag[c3] = (bag[c3] || 0) + 1;
        }
      }
    }
    chain = { one: one, bi: bi };
    return chain;
  }

  function pickWeighted(dist, wantCyr) {
    var keys = [], weights = [], tot = 0, k, cyr, punct;
    for (k in dist) {
      if (!Object.prototype.hasOwnProperty.call(dist, k)) continue;
      punct = k === "." || k === "!" || k === "?";
      cyr = /[а-яіїєґ]/.test(k);
      if (wantCyr === true && !cyr && !punct) continue;
      if (wantCyr === false && cyr) continue;
      keys.push(k);
      weights.push(dist[k]);
      tot += dist[k];
    }
    if (!keys.length) return wantCyr === null ? null : pickWeighted(dist, null);
    var r = Math.random() * tot, i;
    for (i = 0; i < keys.length; i++) { r -= weights[i]; if (r <= 0) return keys[i]; }
    return keys[keys.length - 1];
  }

  function detok(toks) {
    var s = "", i, t;
    for (i = 0; i < toks.length; i++) {
      t = toks[i];
      if (t === "." || t === "!" || t === "?") s += t;
      else s += (s ? " " : "") + t;
    }
    s = s.replace(/(^|[.!?]\s+)([a-zа-яіїєґ])/g, function (m, a, b) { return a + b.toUpperCase(); });
    return s;
  }

  function offline(seed, hits) {
    var M = ensureChain();
    var wantCyr = langOf(seed) !== "en";
    var words = lex(seed).filter(function (t) { return t !== "." && t !== "!" && t !== "?"; });
    var prev = words.length > 1 ? words[words.length - 2] : "";
    var cur = words.length ? words[words.length - 1] : "";
    if (!M.one[cur]) {
      var i;
      for (i = words.length - 1; i >= 0; i--) if (M.one[words[i]]) { prev = i ? words[i - 1] : ""; cur = words[i]; break; }
    }
    if (!M.one[cur] && hits && hits.length) {
      var hw = lex(hits[0].text);
      for (i = 0; i < hw.length - 1; i++) if (M.one[hw[i]] && hw[i] !== "." && hw[i] !== "!" && hw[i] !== "?") { prev = i ? hw[i - 1] : ""; cur = hw[i]; break; }
    }
    var out = [], guard = 0, next, dist, same = 0;
    while (out.length < 110 && guard++ < 400) {
      dist = (prev && M.bi[prev + "\0" + cur]) || M.one[cur];
      if (!dist) break;
      next = pickWeighted(dist, wantCyr);
      if (!next) break;
      if (!out.length && (next === "." || next === "!" || next === "?")) { prev = cur; cur = next; continue; }
      if (next === cur) { same++; if (same > 1) { cur = next; continue; } } else same = 0;
      out.push(next);
      prev = cur;
      cur = next;
      if (out.length > 52 && (next === "." || next === "!" || next === "?")) break;
    }
    if (out.length && out[out.length - 1] !== "." && out[out.length - 1] !== "!" && out[out.length - 1] !== "?") out.push(".");
    return detok(out);
  }

  function lsGet(k) {
    try { return window.localStorage ? localStorage.getItem(k) : null; } catch (e) { return null; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  }

  function settings() {
    var file = window.ANDRIYKO_CONFIG || {};
    if (lsGet("andriyko-custom") === "1") {
      return {
        provider: lsGet("andriyko-provider") || "openai",
        endpoint: lsGet("andriyko-endpoint") || "",
        model: lsGet("andriyko-model") || "",
        key: lsGet("andriyko-key") || ""
      };
    }
    return {
      provider: file.provider || "openai",
      endpoint: file.endpoint || "",
      model: file.model || "",
      key: file.key || ""
    };
  }

  function resolveURL(ep, provider) {
    ep = String(ep || "").trim().replace(/\/+$/, "");
    if (!ep) return "";
    if (provider === "anthropic") {
      if (/\/v1$/i.test(ep)) return ep + "/messages";
      return ep;
    }
    if (/\/v1$/i.test(ep)) return ep + "/chat/completions";
    return ep;
  }

  function hash(s) {
    var h = 5381, i;
    for (i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  function cacheRead(key) {
    var all;
    try { all = JSON.parse(lsGet("andriyko-cache") || "[]"); } catch (e) { all = []; }
    for (var i = 0; i < all.length; i++) if (all[i].k === key) return all[i].t;
    return null;
  }
  function cacheWrite(key, text) {
    var all;
    try { all = JSON.parse(lsGet("andriyko-cache") || "[]"); } catch (e) { all = []; }
    all = all.filter(function (x) { return x.k !== key; });
    all.unshift({ k: key, t: text });
    if (all.length > 20) all.length = 20;
    lsSet("andriyko-cache", JSON.stringify(all));
  }

  function readOut(data) {
    if (!data) return "";
    if (data.choices && data.choices[0]) {
      var c = data.choices[0];
      if (c.message && typeof c.message.content === "string") return c.message.content.trim();
      if (typeof c.text === "string") return c.text.trim();
    }
    if (data.content && data.content[0] && data.content[0].text) {
      return data.content.map(function (p) { return p.text || ""; }).join("").trim();
    }
    if (typeof data.text === "string") return data.text.trim();
    if (typeof data.continuation === "string") return data.continuation.trim();
    if (typeof data.output === "string") return data.output.trim();
    return "";
  }

  function errMsg(status, data, key) {
    var m = "";
    if (data && data.error) m = typeof data.error === "string" ? data.error : (data.error.message || "");
    if (!m && data && data.message) m = data.message;
    m = String(m || "").replace(/\s+/g, " ").slice(0, 180);
    if (key && m.indexOf(key) >= 0) m = m.split(key).join("…");
    if (status && m) return status + " " + m;
    return m || (status ? String(status) : "");
  }

  function complete(seed, opts) {
    opts = opts || {};
    seed = String(seed || "").trim();
    var hits = retrieve(seed, 3);
    if (!hits.length) hits = fallbackHits(seed);
    var built = assemble(seed, hits);
    var cfg = settings();
    var url = resolveURL(cfg.endpoint, cfg.provider);
    var local = function (why) {
      return { text: offline(seed, hits), source: "offline", hits: hits, error: why || "", reg: built.reg };
    };
    if (!url) return Promise.resolve(local(""));
    var key = hash(cfg.provider + "\n" + url + "\n" + (cfg.model || "") + "\n" + seed + "\n" + hits.map(function (h) { return h.id; }).join(","));
    if (!opts.redo) {
      var hit = cacheRead(key);
      if (hit) return Promise.resolve({ text: hit, source: "cache", hits: hits, reg: built.reg });
    }
    try { if (navigator.onLine === false) return Promise.resolve(local("offline")); } catch (e) {}

    var provider = cfg.provider === "anthropic" ? "anthropic" : "openai";
    var headers = { "Content-Type": "application/json" };
    var body;
    if (provider === "anthropic") {
      headers["anthropic-version"] = "2023-06-01";
      headers["anthropic-dangerous-direct-browser-access"] = "true";
      if (cfg.key) headers["x-api-key"] = cfg.key;
      body = {
        model: cfg.model || "claude-sonnet-4-5",
        max_tokens: 480,
        temperature: 0.9,
        system: built.system,
        messages: [{ role: "user", content: built.user }]
      };
    } else {
      if (cfg.key) headers.Authorization = "Bearer " + cfg.key;
      body = {
        temperature: 0.9,
        max_tokens: 480,
        messages: [
          { role: "system", content: built.system },
          { role: "user", content: built.user }
        ]
      };
      if (cfg.model) body.model = cfg.model;
    }
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 28000) : null;
    return fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
      referrerPolicy: "no-referrer",
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      return res.text().then(function (raw) {
        var data = null;
        try { data = JSON.parse(raw); } catch (e) { data = null; }
        if (!res.ok) throw new Error(errMsg(res.status, data, cfg.key) || ("HTTP " + res.status));
        var text = readOut(data);
        if (!text) throw new Error("порожня відповідь");
        cacheWrite(key, text);
        return { text: text, source: "online", hits: hits, reg: built.reg };
      });
    }).catch(function (e) {
      var why = e && e.name === "AbortError" ? "час вийшов" : (e && e.message ? e.message : "мережа");
      if (cfg.key && why.indexOf(cfg.key) >= 0) why = why.split(cfg.key).join("…");
      var ans = local(why);
      return ans;
    }).then(function (ans) { if (timer) clearTimeout(timer); return ans; });
  }

  window.ANDRIYKO = {
    ready: true,
    retrieve: retrieve,
    assemble: assemble,
    offline: offline,
    complete: complete,
    settings: settings,
    registerOf: registerOf,
    saveSettings: function (o) {
      lsSet("andriyko-custom", "1");
      lsSet("andriyko-provider", o.provider || "openai");
      lsSet("andriyko-endpoint", o.endpoint || "");
      lsSet("andriyko-model", o.model || "");
      if (o.key != null && o.key !== "") lsSet("andriyko-key", o.key);
      if (o.clearKey) lsSet("andriyko-key", "");
    },
    clearSettings: function () {
      try {
        localStorage.removeItem("andriyko-custom");
        localStorage.removeItem("andriyko-provider");
        localStorage.removeItem("andriyko-endpoint");
        localStorage.removeItem("andriyko-model");
        localStorage.removeItem("andriyko-key");
      } catch (e) {}
    }
  };
})();
