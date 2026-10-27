# CLAUDE.md — Fork `falkloewert/happy`

Gilt zusätzlich zu `AGENTS.md` (Upstream-Regeln, u. a. Release nur von einem lokalen `main`,
das exakt `origin/main` entspricht).

## Builds laufen lokal

Native Android-Builds entstehen **lokal auf dem Gaming-PC**, nicht über `eas build` in der
Expo-Cloud. Falk hat das am 27.10.2026 entschieden; der Cloud-Weg wurde bis dahin benutzt und
kostete 15–20 Min Wartezeit pro Build. Anleitung und Voraussetzungen:
[`docs/android-local-build.md`](docs/android-local-build.md). `eas build` nur, wenn Falk es in
der laufenden Session ausdrücklich verlangt.
