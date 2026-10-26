# TTS-Entwurf (Piper)

Nur fuer lokale Tests des "Vorlesen"-Buttons (packages/happy-app/sources/components/MessageView.tsx).
Kein Teil der eigentlichen App, nicht fuer echten Betrieb (kein Auth, kein HTTPS).

## Setup

1. Piper-Binary + Modelle laden (Linux x86_64 Beispiel):
   ```
   curl -sL https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz | tar -xz
   curl -sL "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx" -o en_US-lessac-high.onnx
   curl -sL "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx.json" -o en_US-lessac-high.onnx.json
   ```
   Deutsche Stimme optional dazu: `de/de_DE/thorsten/high/de_DE-thorsten-high` (gleiches Muster).
2. `node server.js` (hoert auf 127.0.0.1:5055)

## Stimme waehlen

`POST /tts` nimmt `{"text":"...","voice":"en"|"de"}`. Die App schickt kein `voice`,
dann gilt die Umgebungsvariable `TTS_VOICE` (`en` oder `de`, Default `en`):

```
TTS_VOICE=de node server.js
```

Modelle, die der Server kennt: `VOICES` oben in `server.js`.

## Offen vor echtem Einsatz
- Auth (die App schickt den vollen Nachrichtentext)
- HTTPS (Android blockiert Klartext-HTTP in Release-Builds)
- Wo laeuft das (docker01?), eigene Domain oder Tailscale-only
