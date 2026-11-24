// Uploads the signed .aab to Google Play and rolls it out on a testing track.
// Auth comes from Application Default Credentials, set up keylessly by google-github-actions/auth.
// Usage: node scripts/play-upload.js <path-to.aab> [track]
const fs = require("fs");
const { google } = require("googleapis");

const PKG = "ua.pp.minvaibvet";
const [aab, trackArg] = process.argv.slice(2);
const TRACK = trackArg || process.env.PLAY_TRACK || "alpha"; // "alpha" is Play's id for the closed testing track

(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/androidpublisher"] });
  const play = google.androidpublisher({ version: "v3", auth });
  const edit = (await play.edits.insert({ packageName: PKG })).data;
  const editId = edit.id;
  try {
    const tracks = (await play.edits.tracks.list({ packageName: PKG, editId })).data.tracks || [];
    console.log("tracks:", tracks.map((t) => t.track).join(", "));
    if (!tracks.some((t) => t.track === TRACK)) throw new Error(`track "${TRACK}" not found`);
    const up = await play.edits.bundles.upload({
      packageName: PKG, editId,
      media: { mimeType: "application/octet-stream", body: fs.createReadStream(aab) },
    });
    const vc = String(up.data.versionCode);
    console.log("uploaded versionCode", vc);
    await play.edits.tracks.update({
      packageName: PKG, editId, track: TRACK,
      requestBody: {
        track: TRACK,
        releases: [{
          name: `Вайбвет FM ${vc}`,
          versionCodes: [vc],
          status: "completed",
          releaseNotes: [
            { language: "uk", text: "Свіжий випуск: нові новини, казки на ніч і дрібні виправлення." },
            { language: "en-US", text: "Fresh issue: new stories, bedtime tales and small fixes." },
          ],
        }],
      },
    });
    await play.edits.commit({ packageName: PKG, editId });
    console.log(`released ${vc} to ${TRACK}`);
  } catch (e) {
    await play.edits.delete({ packageName: PKG, editId }).catch(() => {});
    console.error(e.errors || e.message || e);
    process.exit(1);
  }
})();
