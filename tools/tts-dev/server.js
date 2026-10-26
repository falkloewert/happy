"use strict";
// Entwurf: minimaler TTS-Server um Piper. Kein Framework, nur node:http.
// POST /tts  { "text": "..." }  -> audio/wav
const http = require("node:http");
const { spawn } = require("node:child_process");
const path = require("node:path");

const PIPER = path.join(__dirname, "piper", "piper");
const MODEL = path.join(__dirname, "de_DE-thorsten-high.onnx");
const PORT = process.env.PORT || 5055;
const MAX_TEXT = 4000;

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/tts") {
    res.writeHead(404).end();
    return;
  }
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > MAX_TEXT * 4) req.destroy();
  });
  req.on("end", () => {
    let text;
    try {
      text = JSON.parse(body).text;
    } catch {
      res.writeHead(400).end("ungueltiges JSON");
      return;
    }
    if (typeof text !== "string" || !text.trim()) {
      res.writeHead(400).end("text fehlt");
      return;
    }
    text = text.slice(0, MAX_TEXT);

    const piper = spawn(PIPER, ["--model", MODEL, "--output_file", "-"]);
    const chunks = [];
    let responded = false;
    piper.stdout.on("data", (c) => chunks.push(c));
    piper.stderr.on("data", () => {}); // Piper schreibt Logs nach stderr
    piper.on("error", (err) => {
      // z.B. Binary fehlt/kein Exec-Recht - ohne diesen Handler stuerzt der Prozess ab.
      if (responded) return;
      responded = true;
      console.error("piper-Prozess konnte nicht gestartet werden:", err.message);
      res.writeHead(500).end("piper nicht gestartet");
    });
    piper.stdin.on("error", () => {}); // EPIPE, falls piper schon tot ist, wenn wir schreiben
    piper.on("close", (code) => {
      if (responded) return;
      responded = true;
      if (code !== 0 || chunks.length === 0) {
        res.writeHead(500).end("piper fehlgeschlagen");
        return;
      }
      const wav = Buffer.concat(chunks);
      res.writeHead(200, { "Content-Type": "audio/wav", "Content-Length": wav.length });
      res.end(wav);
    });
    piper.stdin.write(text);
    piper.stdin.end();
  });
});

// ENTWURF, nur fuer den WLAN-Test: bewusst offen fuers LAN (0.0.0.0), kein Auth.
// Jeder im selben Netz kann Piper-Prozesse anstossen. Nicht so stehen lassen -
// vor echtem Einsatz durch die HTTPS+Auth-Variante ersetzen (siehe WUENSCHE.md).
const BIND = process.env.BIND || "0.0.0.0";
server.listen(PORT, BIND, () => console.log(`TTS-Entwurf hört auf ${BIND}:${PORT}`));
