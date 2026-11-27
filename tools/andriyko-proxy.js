#!/usr/bin/env node
/* Маленький проксі для «до Андрійка». Ключ тільки зі змінної середовища.
   node tools/andriyko-proxy.js
   ANDRIYKO_KEY=…                  обов'язково
   ANDRIYKO_PROVIDER=openai        openai (типово) або anthropic
   ANDRIYKO_UPSTREAM=https://…     куди слати; типово api.x.ai або api.anthropic.com
   ANDRIYKO_MODEL=grok-4.7         якщо задано — підміняє модель у запиті
   ANDRIYKO_PORT=8787
   ANDRIYKO_HOST=127.0.0.1         постав 0.0.0.0, лише якщо свідомо відкриваєш у мережу

   Клієнту в вікні: адреса http://127.0.0.1:8787/v1/chat/completions,
   провайдер «проксі», ключ порожній. Цей процес відповідає як chat completions,
   навіть якщо сам ходить до Клода. */
"use strict";

var http = require("http");
var https = require("https");
var URL = require("url").URL;

var PORT = Number(process.env.ANDRIYKO_PORT || process.env.PORT || 8787);
var HOST = process.env.ANDRIYKO_HOST || "127.0.0.1";
var KEY = process.env.ANDRIYKO_KEY || "";
var PROVIDER = String(process.env.ANDRIYKO_PROVIDER || "openai").toLowerCase();
var MODEL = process.env.ANDRIYKO_MODEL || "";
var UPSTREAM = process.env.ANDRIYKO_UPSTREAM || (PROVIDER === "anthropic"
  ? "https://api.anthropic.com/v1/messages"
  : "https://api.x.ai/v1/chat/completions");

if (!KEY) {
  console.error("Потрібна змінна ANDRIYKO_KEY. У файл і в аргументи її не пиши.");
  process.exit(1);
}

function send(res, code, obj) {
  var body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function forward(url, headers, payload, cb) {
  var u = new URL(url);
  var lib = u.protocol === "http:" ? http : https;
  var req = lib.request({
    protocol: u.protocol,
    hostname: u.hostname,
    port: u.port || undefined,
    path: u.pathname + u.search,
    method: "POST",
    headers: headers
  }, function (up) {
    var data = "";
    up.on("data", function (c) { data += c; });
    up.on("end", function () { cb(up.statusCode || 502, data); });
  });
  req.on("error", function (e) { cb(502, JSON.stringify({ error: { message: e.message } })); });
  req.write(payload);
  req.end();
}

var server = http.createServer(function (req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type, authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    });
    res.end();
    return;
  }
  if (req.method !== "POST") { send(res, 404, { error: { message: "POST only" } }); return; }
  var raw = "";
  req.on("data", function (c) {
    raw += c;
    if (raw.length > 400000) req.destroy();
  });
  req.on("end", function () {
    var body;
    try { body = JSON.parse(raw || "{}"); }
    catch (e) { send(res, 400, { error: { message: "bad json" } }); return; }
    var payload, headers;
    if (PROVIDER === "anthropic") {
      var msgs = (body.messages || []).filter(function (m) { return m.role !== "system"; });
      var sys = (body.messages || []).filter(function (m) { return m.role === "system"; }).map(function (m) { return m.content; }).join("\n\n");
      payload = JSON.stringify({
        model: MODEL || body.model,
        max_tokens: body.max_tokens || 480,
        temperature: body.temperature == null ? 0.9 : body.temperature,
        system: sys,
        messages: msgs.map(function (m) { return { role: m.role, content: m.content }; })
      });
      headers = {
        "content-type": "application/json",
        "x-api-key": KEY,
        "anthropic-version": "2023-06-01",
        "content-length": Buffer.byteLength(payload)
      };
    } else {
      if (MODEL) body.model = MODEL;
      payload = JSON.stringify(body);
      headers = {
        "content-type": "application/json",
        "authorization": "Bearer " + KEY,
        "content-length": Buffer.byteLength(payload)
      };
    }
    forward(UPSTREAM, headers, payload, function (code, data) {
      if (PROVIDER !== "anthropic") {
        res.writeHead(code, {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        });
        res.end(data);
        console.log(code, "openai-shape", data.length, "B");
        return;
      }
      var parsed;
      try { parsed = JSON.parse(data); }
      catch (e) { send(res, code, { error: { message: String(data).slice(0, 300) } }); return; }
      if (code >= 400) { send(res, code, parsed); console.log(code, "anthropic error"); return; }
      var text = (parsed.content || []).map(function (p) { return p.text || ""; }).join("");
      send(res, 200, { choices: [{ message: { content: text } }] });
      console.log(200, "anthropic", text.length, "chars");
    });
  });
});

server.listen(PORT, HOST, function () {
  console.log("до Андрійка · проксі http://" + HOST + ":" + PORT + "/v1/chat/completions");
  console.log("провайдер:", PROVIDER, "→", UPSTREAM);
});
