# Wünsche & offene Punkte (Falks Fork)

Eigener Fork von [slopus/happy](https://github.com/slopus/happy) (MIT) unter `falkloewert/happy`,
`falk-agent` als Collaborator. `upstream`-Remote zeigt auf das Original zum Nachziehen.

## Base — ohne das ist nichts davon auf dem Handy nutzbar

- [ ] (2026-10-26) **Auf echtem Geraet verifizieren.** Bisher nur `tsc --noEmit` + `vitest` lokal,
      kein Lauf auf einem echten Android-Geraet/Simulator. Ein unveraenderter EAS-Build (Projekt
      `@falk53/happy`) wurde erfolgreich gebaut und installiert — das war die eigentliche
      Risiko-Pruefung (Cloud-Build-Pipeline funktioniert). Der Feature-Branch selbst (Vorlesen +
      Zeitstempel) noch nicht als eigener Build getestet.
- [ ] (2026-10-26) **TTS-Transport grundlegend neu bauen** — nicht mehr hardcodierte LAN-IP +
      Android-Cleartext-Ausnahme, sondern ueber Happys bestehenden RPC-Kanal (wie Session-Spawn/
      Resume und der Rig-Datei-Browser), damit es von ueberall funktioniert, nicht nur im selben
      WLAN, und ohne native Config-Aenderung auskommt. Vollstaendiger Plan mit Aufgabenliste:
      [`docs/self-hosted-tts-plan.md`](docs/self-hosted-tts-plan.md). Ersetzt den aktuellen
      WLAN-Prototyp vollstaendig (inkl. Sprachauswahl beim Setup: Thorsten/Deutsch,
      Englisch/Spanisch/... je ein eigenes Piper-Modell, kein "multilingual" Modell — gibt's bei
      Piper nicht).

## Als nächstes

- [ ] (2026-10-26) PR-Antwort von `slopus/happy` abwarten/bearbeiten (Codex-Review, menschliches
      Review, moegliche Ablehnung wegen Geschaeftsmodell-Naehe o.ae.) — siehe unten.
- [ ] (2026-10-26) Falls der PR angenommen wird: `fork/falk-features` auf das dann aktuelle
      `upstream/main` rebasen, damit der Vorlesen-Branch nicht doppelt denselben Code enthaelt.

## Umgesetzt (Entwurf, Branch `fork/falk-features`)

- [x] (2026-10-25) **Vorlesen-Button** an Agent-Antworten (Piper TTS, Thorsten-Stimme, CPU).
- [x] (2026-10-25) **Zeitstempel**: absolute Zeit bei jeder Agent-Antwort, relative Zeit
      zusaetzlich nur bei der jeweils letzten.
- [x] (2026-10-26) Review-Runde (reviewer-Agent) durchlaufen, alle gefundenen Bugs gefixt
      (Button blieb nach erstem Abspielen tot, Doppel-Tap-Race, haengender Request ohne Timeout,
      nie geloeschte temp-WAV-Dateien, unnoetige FlashList-Re-Renders, Markdown ging ungefiltert
      an Piper, Server lauschte offen fuers LAN).
- [x] (2026-10-26) Vorlesen-Button: groesser, Ladebalken, rotes Fehler-Icon + Modal mit echter
      Fehlermeldung bei Fehlschlag (vorher: sichtbar passierte nichts beim Draufdruecken).
- [x] (2026-10-26) **Zeitstempel als eigener PR an upstream**: aus `fork/falk-features` auf
      eigenen Branch `feature/message-timestamps` extrahiert (nur die reine Zeitstempel-Aenderung,
      kein Vorlesen/Piper-Code, keine Fork-only-Config), per `ponytail-review` bereinigt (eigener
      Kompakt-Formatter durch vorhandenes `formatLastSeen` ersetzt, Ref+`extraData`-Umweg in
      `ChatList.tsx` durch simples Dependency-Array ersetzt — 18 Zeilen weniger, gleiche Funktion).
      PR offen: https://github.com/slopus/happy/pull/1922
