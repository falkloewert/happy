# Lokale Android-Builds auf dem Gaming-PC

Schneller Ersatz für EAS-Cloud-Builds (`eas build` braucht 15–20 Min und lief zuletzt auf dem
RAM-knappen `docker01` in einen OOM-Kill). Hier: erster Build 9 Min, Folgebuilds deutlich
schneller, Build läuft auf dem Handy ohne Cloud.

Stand: 2026-10-26, Zorin OS 18.1, Pixel 9 Pro (Android 17, arm64-v8a).

## Voraussetzungen (auf diesem Rechner eingerichtet)

| Was | Version / Pfad |
|---|---|
| Node | v22.23.2 (via nvm) |
| pnpm | 10.11.0 via corepack (`corepack enable pnpm`) |
| JDK | 17, `/usr/lib/jvm/java-17-openjdk-amd64` |
| Android SDK | `~/Android/Sdk` (build-tools 35/36, platform 34/36/37, NDK 27/29) |
| Android Studio | snap |
| adb | SDK/`platform-tools` + `~/.local/bin/adb`, udev-Regeln via `android-sdk-platform-tools-common` |

`~/.bashrc` setzt dafür:

```bash
export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
```

Achtung: `~/android-sdk` (463 MB) ist ein unvollständiger Altbestand und wird **nicht** benutzt.

## Bauen

```bash
cd ~/Projects/happy && pnpm --filter happy-app android:dev
```

- Kennung `com.slopus.happy.dev`, `APP_ENV=development` → läuft **parallel** zur EAS-Preview
  (`com.slopus.happy.preview`) und zur Play-Store-Version (`com.ex3ndr.happy`) auf dem Handy.
- Beim Start erscheint ein Android-Auswahldialog (alle Dev-Clients teilen `exp+happy://`) →
  **Happy (dev)** wählen.
- `android/` wird bei Bedarf per `expo prebuild` erzeugt (gitignored), `local.properties`
  mit `sdk.dir` schreibt expo selbst.

### Lokale Gradle-Anpassungen (gitignored, gehen bei `prebuild --clean` verloren)

`packages/happy-app/android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
reactNativeArchitectures=arm64-v8a
```

Nur `arm64-v8a` reicht für jedes moderne Handy und spart drei Kompilierungsläufe.

## Stolpersteine

### Schwarzer Bildschirm nach dem Start

Ursache: die App lädt Font-/Bild-Assets von der Metro-LAN-IP (`http://192.168.x.x:8081`).
Ist das Handy kurz im Mobilfunknetz oder ein anderes WLAN, schlägt der Download fehl
(`ExpoAsset.downloadAsync ... ERR_UNABLE_TO_DOWNLOAD_ASSET` im Logcat) und die App zeigt
nichts an. Der JS-Bundle kam vorher durch, deshalb sieht es nach einem Rendering-Fehler aus.

Fix — Metro über USB tunneln statt über WLAN:

```bash
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW \
  -d "exp+happy://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" \
  com.slopus.happy.dev
```

`adb reverse` nach jedem Neu-Anstecken wiederholen.

### Profil wird nicht geladen (`Failed to parse profile: ZodError`)

`GitHubProfileSchema` in `packages/happy-app/sources/sync/profile.ts` verlangte `name` als
`string` und `email` als `string | undefined`, der Server liefert aber beides als `null`
(`packages/happy-server/sources/app/api/types.ts`). Folge: das **komplette** Profil wurde
verworfen (Default-Werte), Name/Avatar fehlten. Behoben am 2026-10-26 (`name` und `email`
nullable). Der Fix ist lokal noch **nicht committet** und betrifft auch upstream
(`slopus/happy`) — dort als eigenen PR wert.

### Logcat statt Raten

```bash
adb logcat -d -t 3000 | grep ReactNativeJS | grep -iE "error|exception"
```

Screenshot: `adb exec-out screencap -p > /tmp/screen.png`

## Drei Happy-Installationen — Auswirkungen

`com.ex3ndr.happy` (Play Store), `com.slopus.happy.preview` (EAS), `com.slopus.happy.dev`
(lokal). Getrennte App-Daten, getrennte Anmeldungen, kein Konflikt. Einzige Überschneidung:
der `exp+happy://`-Scheme-Dialog beim Start eines Dev-Clients. Jede Installation meldet sich
in der Session-Liste als eigenes Gerät.
