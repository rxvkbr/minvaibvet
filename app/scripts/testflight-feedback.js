#!/usr/bin/env node
/*
 * Downloads TestFlight feedback for Вайбкет FM (screenshot reports and crash reports) with the App Store Connect API key.
 *   node app/scripts/testflight-feedback.js <AuthKey_XXXX.p8> <issuer-id> <out-dir>
 * Writes <out-dir>/feedback.json and the screenshots / crash logs next to it. Prints only counts (CI logs are public).
 */
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const [p8, issuer, out] = process.argv.slice(2);
if (!p8 || !issuer || !out || !fs.existsSync(p8)) { console.log("usage: testflight-feedback.js <p8> <issuer> <out>"); process.exit(1); }
const KEY_ID = path.basename(p8, ".p8").replace(/^AuthKey_/, ""), BUNDLE = "ua.pp.minvaibvet";
const b64url = (b) => Buffer.from(b).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
function token() {
  const now = Math.floor(Date.now() / 1000);
  const h = b64url(JSON.stringify({ alg: "ES256", kid: KEY_ID, typ: "JWT" })), p = b64url(JSON.stringify({ iss: issuer, iat: now, exp: now + 900, aud: "appstoreconnect-v1" }));
  return h + "." + p + "." + b64url(crypto.sign("sha256", Buffer.from(h + "." + p), { key: fs.readFileSync(p8), dsaEncoding: "ieee-p1363" }));
}
async function api(url) {
  const r = await fetch(url.startsWith("http") ? url : "https://api.appstoreconnect.apple.com" + url, { headers: { Authorization: "Bearer " + token() } });
  const t = await r.text(); const j = t ? JSON.parse(t) : {};
  if (!r.ok) { const e = new Error((j.errors || []).map((x) => x.detail || x.title).join("; ") || r.status); e.status = r.status; throw e; }
  return j;
}
async function all(url) { let res = [], inc = [], next = url; while (next) { const j = await api(next); res = res.concat(j.data || []); inc = inc.concat(j.included || []); next = j.links && j.links.next; } return { data: res, included: inc }; }
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const app = (await api("/v1/apps?filter[bundleId]=" + BUNDLE)).data[0];
  const report = { fetched: new Date().toISOString(), screenshots: [], crashes: [], errors: [] };
  const builds = {};
  try { (await all(`/v1/builds?filter[app]=${app.id}&limit=50`)).data.forEach((b) => (builds[b.id] = b.attributes.version)); } catch (e) { report.errors.push("builds: " + e.message); }
  try {
    const s = await all(`/v1/apps/${app.id}/betaFeedbackScreenshotSubmissions?limit=50&include=build`);
    for (const f of s.data) {
      const a = f.attributes, item = { id: f.id, date: a.createdDate, comment: a.comment, device: a.deviceModel, os: a.osVersion, platform: a.appPlatform, locale: a.locale,
        build: builds[(f.relationships && f.relationships.build && f.relationships.build.data || {}).id] || null, connection: a.connectionType, battery: a.batteryPercentage, files: [] };
      let i = 0;
      for (const sc of a.screenshots || []) {
        try { const r = await fetch(sc.url); const fn = `shot-${f.id.slice(0, 8)}-${i++}.png`; fs.writeFileSync(path.join(out, fn), Buffer.from(await r.arrayBuffer())); item.files.push(fn); } catch (e) { report.errors.push("shot " + e.message); }
      }
      report.screenshots.push(item);
    }
  } catch (e) { report.errors.push("screenshots: " + e.status + " " + e.message); }
  try {
    const c = await all(`/v1/apps/${app.id}/betaFeedbackCrashSubmissions?limit=50&include=build`);
    for (const f of c.data) {
      const a = f.attributes, item = { id: f.id, date: a.createdDate, comment: a.comment, device: a.deviceModel, os: a.osVersion, build: builds[(f.relationships && f.relationships.build && f.relationships.build.data || {}).id] || null, file: null };
      try { const l = await api(`/v1/betaFeedbackCrashSubmissions/${f.id}/crashLog`); const fn = `crash-${f.id.slice(0, 8)}.txt`; fs.writeFileSync(path.join(out, fn), (l.data && l.data.attributes && l.data.attributes.logText) || JSON.stringify(l)); item.file = fn; } catch (e) { report.errors.push("crashlog " + e.message); }
      report.crashes.push(item);
    }
  } catch (e) { report.errors.push("crashes: " + e.status + " " + e.message); }
  fs.writeFileSync(path.join(out, "feedback.json"), JSON.stringify(report, null, 2));
  console.log(`screenshot reports: ${report.screenshots.length}, crash reports: ${report.crashes.length}, errors: ${report.errors.length}`);
})().catch((e) => { console.error("failed:", e.status || "", e.message); process.exit(1); });
