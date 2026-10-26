# Handoff: Stand und Kontext (2026-10-26)

Für eine neue Claude-Code-Session (z. B. auf dem Gaming-PC, Zorin OS, `~/Projects/happy`),
die hier weiterarbeiten soll. `git pull` holt diese Datei und alles Committete; was unten als
"noch nicht gepusht" markiert ist, fehlt lokal noch.

## Was das hier ist

Eigener Fork von [slopus/happy](https://github.com/slopus/happy) (MIT) unter
`falkloewert/happy`. `falk-agent` ist Collaborator (Standard-GitHub-Account für Commits/PRs),
`upstream`-Remote zeigt aufs Original. Ausgangspunkt: Falk wollte eine Vorlesen-Funktion
(Text-to-Speech) für Agent-Antworten in der Happy-App, die es dort nicht gibt — daraus ist ein
echtes Mehrfach-Feature-Projekt geworden.

## Branches — Stand und was NICHT anfassen

| Branch | Stand | Anfassen? |
|---|---|---|
| `fork/falk-features` | Vorlesen-Button (WLAN-Prototyp, Piper TTS), Zeitstempel, Stop-Funktion, Geschwindigkeitsregler (1x/1.5x/2x). Alles getestet auf echtem Android-Geraet per EAS-Cloud-Build. Gepusht. | Ja, Haupt-Arbeitsbranch |
| `feature/message-timestamps` | Nur die Zeitstempel-Aenderung, sauber extrahiert, per `ponytail-review` bereinigt. **Offener Pull Request:** https://github.com/slopus/happy/pull/1922 | **Nicht anfassen**, außer um auf PR-Feedback zu reagieren |
| `feature/self-hosted-tts` | Ersetzt den WLAN-Prototyp durch eine RPC-basierte Loesung (siehe unten). **Lief zuletzt auf `docker01` durch einen Hintergrund-Agenten, noch NICHT nach GitHub gepusht** (Stand: 3 lokale Commits dort, ein File noch uncommitted — CLI-RPC-Handler + `happy voice setup`, App-seitiger RPC-Aufruf, Settings-UI). | **Nicht parallel dran arbeiten**, bis er gepusht ist — sonst Konflikte. Erst nachfragen/pruefen ob er fertig/gepusht ist. |

## Warum WLAN-Prototyp → RPC (wichtigste Architekturentscheidung)

Der urspruengliche Vorlesen-Button schickte eine rohe HTTP-Anfrage an eine hardcodierte
LAN-IP (`http://192.168.178.11:5055/tts`) und brauchte eine native Android-Ausnahme fuer
Klartext-HTTP (`expo-build-properties`/`usesCleartextTraffic` in `app.config.js`). Das
funktioniert nur im selben WLAN und erzwingt bei jeder Aenderung einen vollen nativen Build
(kein OTA-Update moeglich).

Happy hat bereits einen verschluesselten RPC-Kanal zwischen App und CLI/Daemon (fuer
Session-Spawn/Resume, den Rig-Datei-Browser). Der neue Ansatz registriert `readAloud` als
RPC-Methode im CLI-Daemon (Piper laeuft dort lokal, kein offener Port noetig), die App ruft
sie ganz normal ueber den bestehenden Kanal auf — funktioniert von ueberall, nicht nur im
selben Netz, keine native Config mehr noetig. Voller Plan mit Aufgabenliste:
[`docs/self-hosted-tts-plan.md`](self-hosted-tts-plan.md) (liegt auf `fork/falk-features`).

Sobald `feature/self-hosted-tts` fertig und gemerged ist, werden der hardcodierte
`TTS_ENDPOINT` und die `expo-build-properties`-Ausnahme aus `fork/falk-features` ueberfluessig
und sollten entfernt werden.

## Infrastruktur

- **EAS-Projekt:** `@falk53/happy` (Expo-Account `falk53`), Profil `preview`. Native Builds
  (`eas build --platform android --profile preview --environment preview --non-interactive`)
  brauchen ~15-20 Min (Upload + Cloud-Kompilierung). Reine JS-Aenderungen gehen schneller per
  `eas update --branch preview --environment preview --non-interactive` (OTA, kein neuer
  Install noetig).
- **`docker01`** (RAM-knapp, ~11 GB, viele andere Dienste laufen dort — Immich, Jellyfin,
  Nextcloud, etc.): **Lektion aus dieser Session** — ein EAS-Update-Export parallel zu einem
  Coding-Agenten hat am 26.10. echte Dienste per OOM-Kill abgeschossen (Elasticsearch/
  Nextcloud-Volltextsuche, kurzzeitig ein `flaresolverr`-Firefox-Prozess). Beides hat sich
  selbst erholt (Docker-Restart-Policy), aber: **auf `docker01` nie zwei schwere
  Build/Typecheck/Test-Prozesse gleichzeitig laufen lassen.**
- **Gaming-PC (Zorin OS, `~/Projects/happy`):** extra eingerichtet fuer lokale native
  Android-Builds, deutlich schneller als EAS und ohne das RAM-Problem von `docker01`. Node 22,
  pnpm via corepack, Android Studio + SDK unter `~/Android/Sdk`, `adb` ueber USB/udev
  eingerichtet. Ein-Befehl-Build: `cd ~/Projects/happy && pnpm --filter happy-app android:dev`
  (Kennung `com.slopus.happy.dev`, laeuft parallel zur EAS-Preview-Installation auf dem
  Handy). `gradle.properties`: `reactNativeArchitectures` auf `arm64-v8a` reduziert fuer
  schnellere Builds (fast jedes moderne Handy ist arm64).

## GitHub-Accounts

- `falk-agent`: Standard, fuer Commits/PRs/normale Arbeit (`gh auth status` zeigt ihn als
  aktiv).
- `falkloewert`: nur fuer Admin-Schritte (Fork anlegen, Collaborator einladen) kurz
  reingewechselt, danach sofort zurueck auf `falk-agent`.

## Offene Punkte (Stand dieser Uebergabe)

1. `feature/self-hosted-tts` fertigstellen (laeuft/lief auf `docker01`), dann review +
   pushen + auf echtem Geraet testen (RPC-Kanal, nicht WLAN-abhaengig).
2. Ein OTA-Update fuer den Stop-Fix (Branch `fork/falk-features`, Commit `247f9736`) ist
   wegen des OOM-Kills fehlgeschlagen und muss erneut angestossen werden — entweder von
   `docker01` (einzeln, nicht parallel zu anderem) oder von hier aus.
3. Sobald `feature/self-hosted-tts` steht: `fork/falk-features` aufraeumen (WLAN-Hack-Commits
   obsolet).
4. `feature/message-timestamps`-PR (https://github.com/slopus/happy/pull/1922) beobachten,
   auf Review-Kommentare reagieren.

## Weitere Doku im Repo

- [`WUENSCHE.md`](../WUENSCHE.md) (Repo-Root) — laufende Wunschliste/Backlog, nach Reiseplaner-
  Projekt-Konvention gefuehrt (Base / Als naechstes / Umgesetzt).
- [`docs/self-hosted-tts-plan.md`](self-hosted-tts-plan.md) — detaillierter Plan fuer
  `feature/self-hosted-tts` (Architektur, Aufgaben pro Paket, offene Fragen).
