#!/usr/bin/env node
/*
 * Ships an iOS build to the external TestFlight group «Слухачі» with the App Store Connect API key.
 *
 *   node app/scripts/testflight-release.js <AuthKey_XXXX.p8> <issuer-id> status
 *       shows the last builds and where each one stands in beta review
 *   node app/scripts/testflight-release.js <AuthKey_XXXX.p8> <issuer-id> [build-number]
 *       adds the build (default: the newest processed one) to «Слухачі», fills «What to test»
 *       and submits it to Beta App Review if it still needs one
 *
 * No dependencies: Node 18+ (fetch, crypto).
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const [p8, issuer, arg] = process.argv.slice(2);
if (!p8 || !issuer || !fs.existsSync(p8)) {
  console.log("Як запускати: node app/scripts/testflight-release.js ~/Downloads/AuthKey_XXXX.p8 <Issuer ID> [status | номер збірки]");
  process.exit(1);
}
const KEY_ID = path.basename(p8, ".p8").replace(/^AuthKey_/, "");
const BUNDLE = "ua.pp.minvaibvet";
const GROUP = "Слухачі";
const WHAT_TO_TEST =
  "Вайбкет FM: радіо, газета, «Гладити», Вайбкет Стіл (нотатки, таблиці, задачі, покупки), " +
  "хвилина мовчання о 9:00. Будь ласка, спробуйте все й надішліть відгук скріншотом через TestFlight.";

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function token() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "ES256", kid: KEY_ID, typ: "JWT" }));
  const body = b64url(JSON.stringify({ iss: issuer, iat: now, exp: now + 15 * 60, aud: "appstoreconnect-v1" }));
  const sig = crypto.sign("sha256", Buffer.from(head + "." + body), { key: fs.readFileSync(p8), dsaEncoding: "ieee-p1363" });
  return head + "." + body + "." + b64url(sig);
}
async function api(method, url, data) {
  const r = await fetch("https://api.appstoreconnect.apple.com" + url, {
    method,
    headers: { Authorization: "Bearer " + token(), "Content-Type": "application/json" },
    body: data ? JSON.stringify(data) : undefined,
  });
  const text = await r.text();
  const json = text ? JSON.parse(text) : {};
  if (!r.ok) {
    const e = (json.errors || []).map((x) => x.detail || x.title).join("; ") || r.status;
    const err = new Error(e);
    err.status = r.status;
    throw err;
  }
  return json;
}

(async () => {
  const app = (await api("GET", "/v1/apps?filter[bundleId]=" + BUNDLE)).data[0];
  if (!app) throw new Error("Не знайшов застосунок " + BUNDLE);
  const builds = (await api("GET", `/v1/builds?filter[app]=${app.id}&sort=-uploadedDate&limit=12&include=betaAppReviewSubmission,buildBetaDetail`));
  const inc = {};
  (builds.included || []).forEach((x) => (inc[x.type + x.id] = x));
  const state = (b) => {
    const s = b.relationships.betaAppReviewSubmission && b.relationships.betaAppReviewSubmission.data;
    const d = b.relationships.buildBetaDetail && b.relationships.buildBetaDetail.data;
    return {
      review: s ? (inc[s.type + s.id] || {}).attributes?.betaReviewState : "не подано",
      external: d ? (inc[d.type + d.id] || {}).attributes?.externalBuildState : "?",
    };
  };

  if (arg === "status") {
    for (const b of builds.data) {
      const s = state(b);
      console.log(`${b.attributes.version}  обробка: ${b.attributes.processingState}  рев'ю: ${s.review}  зовнішнє: ${s.external}`);
    }
    return;
  }

  const build = arg
    ? builds.data.find((b) => b.attributes.version === arg)
    : builds.data.find((b) => b.attributes.processingState === "VALID");
  if (!build) throw new Error(arg ? "Немає збірки " + arg : "Ще немає обробленої збірки");
  console.log("Збірка", build.attributes.version);

  const group = (await api("GET", `/v1/betaGroups?filter[app]=${app.id}&filter[name]=${encodeURIComponent(GROUP)}`)).data[0];
  if (!group) throw new Error("Немає групи «" + GROUP + "»");

  // «What to test» in Ukrainian, so testers know what to look at
  const locs = (await api("GET", `/v1/builds/${build.id}/betaBuildLocalizations`)).data;
  const uk = locs.find((l) => /^uk/.test(l.attributes.locale)) || locs[0];
  if (uk) await api("PATCH", `/v1/betaBuildLocalizations/${uk.id}`, { data: { type: "betaBuildLocalizations", id: uk.id, attributes: { whatsNew: WHAT_TO_TEST } } });
  else await api("POST", "/v1/betaBuildLocalizations", { data: { type: "betaBuildLocalizations", attributes: { locale: "uk", whatsNew: WHAT_TO_TEST }, relationships: { build: { data: { type: "builds", id: build.id } } } } });
  console.log("✓ «Що тестувати» заповнено");

  await api("POST", `/v1/betaGroups/${group.id}/relationships/builds`, { data: [{ type: "builds", id: build.id }] });
  console.log("✓ Додано в групу «" + GROUP + "»");

  const s = state(build);
  if (s.review === "не подано") {
    try {
      await api("POST", "/v1/betaAppReviewSubmissions", { data: { type: "betaAppReviewSubmissions", relationships: { build: { data: { type: "builds", id: build.id } } } } });
      console.log("✓ Подано на Beta App Review. Зазвичай від кількох годин до доби.");
    } catch (e) {
      console.log("! Подати на рев'ю не вдалося:", e.message);
      console.log("  Найчастіше це означає, що інша збірка цієї версії ще чекає рішення. Коли її схвалять, запусти скрипт ще раз.");
    }
  } else {
    console.log("Рев'ю:", s.review);
  }
})().catch((e) => {
  console.error("Помилка:", e.message);
  process.exit(1);
});
