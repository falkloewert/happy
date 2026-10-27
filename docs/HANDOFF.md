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
| `main` | Alles aus `fork/falk-features` + `feature/self-hosted-tts` (Fast-Forward am 2026-10-26). Das ist der Stand, der im Preview-Kanal ausgeliefert wird. | Ja, Hauptbranch |
| `fork/falk-features` | Aelterer Stand, vollstaendig in `main` enthalten. | Nur noch Historie |
| `feature/self-hosted-tts` | Aelterer Stand, vollstaendig in `main` enthalten. | Nur noch Historie |
| `feature/message-timestamps` | Nur die Zeitstempel-Aenderung, sauber extrahiert, per `ponytail-review` bereinigt. **Offener Pull Request:** https://github.com/slopus/happy/pull/1922 | **Nicht anfassen**, außer um auf PR-Feedback zu reagieren |
| `pr/read-aloud` | Sauberer PR-Branch **ab `upstream/main`** nur mit Vorlesen (24 Dateien, +758/−7). **Offener Pull Request:** https://github.com/slopus/happy/pull/1923 | Ja, fuer Review-Feedback |
| `pr/profile-null` | Zwei Zeilen: GitHub-Profil mit `name: null` / `email: null`. **Offener Pull Request:** https://github.com/slopus/happy/pull/1924 | Ja, fuer Review-Feedback |

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

## Offene Punkte (Stand 2026-10-26, Ende der Session)

1. Drei PRs warten auf Upstream: [#1922](https://github.com/slopus/happy/pull/1922)
   (Zeitstempel), [#1923](https://github.com/slopus/happy/pull/1923) (Vorlesen),
   [#1924](https://github.com/slopus/happy/pull/1924) (Profil-Fix). 1922 und 1923 fassen
   dieselbe Aktionszeile in `MessageView.tsx` an — wer zuerst gemerged wird, beim anderen
   nachziehen.
2. Das OTA vom 26.10. (Commit `428bbdcd`, Runtime 21) **kam nie auf dem Geraet an**, obwohl
   es im Branch `preview` lag: am Channel `preview` hing kein Branch, und die APK fragte wegen
   `requestHeaders` in `app.config.js` den Kanal `production` ab, den es im Projekt nicht
   gibt — jeder Update-Check lief in `ERR_UPDATES_CHECK`. Behoben am 27.10.: Channel
   `preview` → Branch `preview` verknuepft, `requestHeaders` entfernt (Kanal kommt jetzt aus
   dem Build-Profil). **Lektion:** nach jedem Build pruefen, dass `eas channel:list` einen
   Branch zeigt — ein Update im Branch allein kommt nirgends an.
   **Uebergangsloesung, wieder abbauen:** die noch installierte APK fragt weiter `production`
   an, deshalb zeigt der Channel `production` (angelegt 27.10.) vorlaeufig auf Branch
   `preview`. Sobald eine neu gebaute APK installiert ist (deren Kanal ist `preview`),
   `eas channel:delete production` — sonst bekaeme ein echter Production-Build
   Preview-Updates.
3. Der alte WLAN-TTS-Server (`tools/tts-dev/server.js`, Port 5055 auf `docker01`) ist
   gestoppt und wird von der App nicht mehr benutzt; die zwei Stimmen liegen weiter in
   `~/tts-dev/` fuer einen schnellen `curl`-Test.
4. Die Zeitstempel-Aenderung lebt in zwei PRs (1922 sauber, 1923 ohne) — nichts zu tun,
   ausser Review-Kommentare zu beantworten.

## Weitere Doku im Repo

- [`WUENSCHE.md`](../WUENSCHE.md) (Repo-Root) — laufende Wunschliste/Backlog, nach Reiseplaner-
  Projekt-Konvention gefuehrt (Base / Als naechstes / Umgesetzt).
- [`docs/self-hosted-tts-plan.md`](self-hosted-tts-plan.md) — detaillierter Plan fuer
  `feature/self-hosted-tts` (Architektur, Aufgaben pro Paket, offene Fragen).
