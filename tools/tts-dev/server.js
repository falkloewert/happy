"use strict";
// Entwurf: minimaler TTS-Server um Piper. Kein Framework, nur node:http.
// POST /tts  { "text": "...", "voice": "en"|"de" }  -> audio/wav
const http = require("node:http");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const PIPER = path.join(__dirname, "piper", "piper");
// Piper hat kein mehrsprachiges Modell, eine Stimme pro Sprache. Die App
// schickt "voice" nicht mit, dann gilt TTS_VOICE (Default: Englisch).
const VOICES = { en: "en_US-hfc_female-medium", de: "de_DE-thorsten-high" };
const DEFAULT_VOICE = VOICES[process.env.TTS_VOICE] ? process.env.TTS_VOICE : "en";
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
    let voice;
    try {
      ({ text, voice } = JSON.parse(body));
    } catch {
      res.writeHead(400).end("ungueltiges JSON");
      return;
    }
    if (typeof text !== "string" || !text.trim()) {
      res.writeHead(400).end("text fehlt");
      return;
    }
    text = text.slice(0, MAX_TEXT);

    const modelPath = path.join(__dirname, `${VOICES[voice] || VOICES[DEFAULT_VOICE]}.onnx`);
    if (!fs.existsSync(modelPath)) {
      res.writeHead(500).end(`Modell fehlt: ${path.basename(modelPath)}`);
      return;
    }

    const piper = spawn(PIPER, ["--model", modelPath, "--output_file", "-"]);
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
