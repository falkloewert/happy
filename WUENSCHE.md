# Wünsche & offene Punkte (Falks Fork)

Eigener Fork von [slopus/happy](https://github.com/slopus/happy) (MIT) unter `falkloewert/happy`,
`falk-agent` als Collaborator. `upstream`-Remote zeigt auf das Original zum Nachziehen.

## Base — ohne das ist nichts davon auf dem Handy nutzbar

- [ ] (2026-10-26) **Auf echtem Geraet verifizieren.** Bisher nur `tsc --noEmit` + `vitest` lokal,
      kein Lauf auf einem echten Android-Geraet/Simulator. Ein unveraenderter EAS-Build (Projekt
      `@falk53/happy`) wurde erfolgreich gebaut und installiert — das war die eigentliche
      Risiko-Pruefung (Cloud-Build-Pipeline funktioniert). Der Feature-Branch selbst (Vorlesen +
      Zeitstempel) noch nicht als eigener Build getestet.
- [ ] (2026-10-26) **TTS-Endpoint-Entscheidung vor echtem Einsatz.** `MessageView.tsx` hat aktuell
      `http://localhost:5055/tts` hardcoded (nur Testzweck). Fuer echten Betrieb vom Handy aus noetig:
      - Wo laeuft der Piper-Server (docker01, siehe `tools/tts-dev/`)?
      - Wie erreicht ihn das Handy von ausserhalb des LAN (eigene Domain+TLS, oder Tailscale)?
      - Auth (die App schickt den vollen Nachrichtentext im Klartext an den Endpoint).
      - Android blockiert Klartext-HTTP in Release-Builds — ohne HTTPS geht's auf dem echten Geraet
        gar nicht, nur im Dev-Client.
      Danach: Endpoint/Token aus `Settings`-Schema statt Konstante (siehe Konvention in
      `packages/happy-app/sources/sync/settings.ts` — flach, kein Nesting, synct geraeteuebergreifend).

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
