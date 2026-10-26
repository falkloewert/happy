# Plan: Self-Hosted Read-Aloud (Piper TTS over RPC)

Fork-only feature. Replaces the current WLAN-only prototype (hardcoded LAN IP,
Android cleartext-HTTP exception) with something that works from anywhere,
for anyone who sets it up — no IP, no native config, no manual server.

## Why the current prototype doesn't scale

`packages/happy-app/sources/components/MessageView.tsx` (`MessageReadAloudButton`)
POSTs directly to a hardcoded `http://192.168.178.11:5055/tts`. That only works:
- on the same WiFi as the machine running Piper
- with `expo-build-properties` forcing `usesCleartextTraffic: true` (a native
  AndroidManifest change — breaks OTA-only updates, needs a full native
  rebuild whenever touched)
- for exactly one person's one machine's one IP

None of that is true for anyone else running their own fork.

## The fix: route through Happy's existing RPC channel

Happy already has a point-to-point RPC system between the app and the
CLI/daemon running on a machine — see `docs/realtime-sync-and-rpc.md`. It's
the same channel session spawn/resume and the Rig file browser use. It is:
encrypted, relayed through Happy's own server, works over mobile data (not
just LAN), and needs zero new native permissions.

```
Phone app                         Happy server                    docker01 (CLI/daemon)
MessageReadAloudButton
  rpcCall('<machineId>:readAloud', { text })
                                   relays over Socket.IO  ────►    RpcHandlerManager
                                                                     'readAloud' handler
                                                                       spawns Piper locally
                                   ◄──── { audioBase64, mimeType } ────
  decode, write to File (expo-file-system), play (expo-audio)
```

## Work items

### 1. CLI side — `packages/happy-cli`

- **`src/voice/piperVoices.ts`**: static list of offered (language, voice,
  download URL) tuples (implemented; German, both English candidates and the
  Piper binary were actually downloaded and played on 2026-10-26, the other
  model URLs were only checked to resolve):
  - German — Thorsten (`de_DE-thorsten-high`)
  - English — `en_US-hfc_female-medium` (the most natural-sounding English
    Piper voice; `en_US-lessac-high` is the clearer, more announcer-like
    alternative)
  - Spanish — `es_ES-davefx-medium`
  - French — `fr_FR-siwis-medium`
  - Italian — `it_IT-paola-medium`
  - Portuguese — `pt_BR-faber-medium`
  All from `https://huggingface.co/rhasspy/piper-voices` — same host/path
  pattern as the German one already in `tools/tts-dev/`. Piper has no
  single multilingual model; it's one model per language/voice, which is
  exactly what the setup prompt should surface as a pick-list, not try to
  paper over with a fake "multilingual" option.
- **`src/voice/piperSetup.ts`**: interactive step (reuse the `auth login`
  Ink-style prompt pattern) — "Set up local text-to-speech for read-aloud?"
  → if yes, show the voice list above, download the Piper binary (platform
  detection: linux/mac/win x86_64/arm64 — only linux x86_64 has been tested
  so far) + the chosen `.onnx`+`.onnx.json` pair into `~/.happy/voice/`.
  Store the active choice in `~/.happy/voice/config.json`.
  Also exposed standalone as `happy voice setup` for changing it later.
- **`src/voice/synthesize.ts`**: `synthesize(text: string): Promise<Buffer>` —
  spawns the downloaded Piper binary, same logic as the prototype's
  `tools/tts-dev/server.js` (strip markdown before synthesizing — reuse
  `stripMarkdown` conventions from the app side, or move that util
  somewhere both packages can import), returns WAV bytes. No HTTP server,
  no listening port at all.
- **`src/claude/registerReadAloudHandler.ts`** (model: the existing
  `registerKillSessionHandler.ts`, a few lines): registers RPC method
  `readAloud` on `RpcHandlerManager`, calls `synthesize`, returns
  `{ audioBase64, mimeType: 'audio/wav' }`. Only registers the handler if
  `~/.happy/voice/config.json` exists — if the user never ran setup, the
  method simply isn't there, and the app side needs to treat "RPC method
  not found" distinctly from "request failed" (see below).

### 2. App side — `packages/happy-app`

- `MessageReadAloudButton` (`sources/components/MessageView.tsx`): replace
  the raw `fetch(TTS_ENDPOINT, ...)` with the machine-scoped RPC call.
  Exact caller API still needs locating — `sources/sync/apiSocket.ts` has a
  generic `rpcCall(method, params)`; find or add the machine-prefixed
  wrapper used elsewhere (session spawn/resume, Rig's file reads) and reuse
  its pattern rather than calling `apiSocket` directly.
- Decode `audioBase64` → `Uint8Array`, write via `expo-file-system`
  (`File`/`Paths`, same as the prototype), play via `expo-audio`
  (`useAudioPlayer`/`useAudioPlayerStatus`, same as the prototype). The
  playback-rate control already built (`readAloudPlaybackRate` setting,
  `player.setPlaybackRate`) carries over unchanged.
- Distinguish "no voice configured on this machine" from a real failure in
  the error Modal — point the first case at `happy voice setup` instead of
  a generic error message.
- New or extended settings surface: `sources/app/(app)/settings/voice.tsx`
  already exists for the ElevenLabs voice assistant — either add a
  read-aloud section there or a sibling screen, showing which machine(s)
  have local TTS configured and in which voice.
- **Remove** once this lands: the hardcoded `TTS_ENDPOINT` LAN IP, and the
  `expo-build-properties` / `usesCleartextTraffic: true` plugin entry in
  `app.config.js` — no longer needed, and removing it restores OTA-only
  updates for this feature (no native rebuild required for future JS-only
  changes).

### 3. Open questions for whoever implements this

- **RPC payload size**: is there a message-size cap on Happy's RPC channel?
  A base64 WAV for a long reply could be several hundred KB. If there's a
  cap, chunk the response or have the handler return a short-lived
  download URL instead of inline bytes — not investigated yet.
- **Which Piper voices per language** beyond German — the list above is a
  reasonable starting guess (commonly used default Piper voices), not
  verified to still be the current recommended ones on the Piper voices
  page. Verify before hardcoding.
- **Markdown stripping**: `stripMarkdown` currently lives in
  `packages/happy-app/sources/utils/messageUtils.ts`. The CLI-side
  `synthesize()` needs the same stripping (so code fences/asterisks etc.
  aren't read aloud) — either duplicate the (short, dependency-free)
  function on the CLI side, or move it to a package both can import. Given
  the function is ~15 lines of regex with no app-specific imports,
  duplicating it is probably the pragmatic choice over a new shared package.
- **Platform support for the Piper binary**: only linux x86_64 has actually
  been downloaded and run in this session (on `docker01`). macOS/Windows/ARM
  binaries exist upstream (rhasspy/piper releases) but weren't tested.

## What NOT to change

- The playback-rate feature (`readAloudPlaybackRate` setting, the ×1/×1.5/×2
  cycle button) is already built and works independently of the transport —
  keep it as-is.
- The absolute+relative timestamp feature is unrelated, already split into
  its own PR (`feature/message-timestamps`, slopus/happy#1922) — don't touch.

## Why this is worth doing before a PR

Once the hardcoded IP and the native cleartext permission are gone, this
becomes a plausible upstream feature on its own: opt-in, self-hosted,
doesn't touch Sync/Encryption/Voice-core, and doesn't compete with their
paid ElevenLabs conversational Voice (this is a one-way "read this message"
button, not a live conversation).
