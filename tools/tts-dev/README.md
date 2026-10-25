# TTS-Entwurf (Piper)

Nur fuer lokale Tests des "Vorlesen"-Buttons (packages/happy-app/sources/components/MessageView.tsx).
Kein Teil der eigentlichen App, nicht fuer echten Betrieb (kein Auth, kein HTTPS).

## Setup

1. Piper-Binary + Modell laden (Linux x86_64 Beispiel):
   ```
   curl -sL https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz | tar -xz
   curl -sL "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/high/de_DE-thorsten-high.onnx" -o de_DE-thorsten-high.onnx
   ```
2. `node server.js` (hoert auf 127.0.0.1:5055)

## Offen vor echtem Einsatz
- Auth (die App schickt den vollen Nachrichtentext)
- HTTPS (Android blockiert Klartext-HTTP in Release-Builds)
- Wo laeuft das (docker01?), eigene Domain oder Tailscale-only
