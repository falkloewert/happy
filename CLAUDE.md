# CLAUDE.md — Fork `falkloewert/happy`

Gilt zusätzlich zu `AGENTS.md` (Upstream-Regeln, u. a. Release nur von einem lokalen `main`,
das exakt `origin/main` entspricht).

## Builds: Standard ist EAS Cloud

Native Android-Builds laufen über `eas build` in der Expo-Cloud (Profil `preview`). Falk hat
das am 27.10.2026 so entschieden: lokal ist es unterm Strich nicht schneller (gedrosselt 30+
Min, ungedrosselt ~9 Min, aber der PC muss dafür anbleiben und die Dienste auf dem Rechner
leiden), und die Cloud braucht keinen laufenden PC.

Lokal (`eas build --local`) nur, wenn Falk es in der laufenden Session ausdrücklich verlangt.
Wenn dort gebaut wird: drosseln (`systemd-run --user --scope -p CPUQuota=400%`), sonst kippt
der Rechner unter Gradle + NDK. Anleitung: [`docs/android-local-build.md`](docs/android-local-build.md).

Unabhängig vom Weg: nach jedem Build `eas channel:list` prüfen — ein Update im Branch kommt
nirgends an, solange kein Channel darauf zeigt.
