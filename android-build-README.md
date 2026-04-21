# Build StreetScore.apk (Android)

The Lovable sandbox cannot build a signed APK directly (no Android SDK / JDK / keystore). You have **three** install paths — pick whichever fits.

---

## Option 1 — PWA install (fastest, zero build)

After publishing the app:

1. Open the published URL on Android Chrome.
2. Menu → **Add to Home Screen**.
3. The app installs with the StreetScore icon, runs fullscreen and works offline.

No APK file, but functionally identical for end users.

---

## Option 2 — PWABuilder (no local toolchain)

1. Publish the app and copy the published URL.
2. Go to <https://www.pwabuilder.com>, paste the URL.
3. Click **Package for Stores → Android**.
4. Download the generated **signed `.apk` / `.aab`** (~2 minutes).

Rename the file to `StreetScore.apk` if you want.

---

## Option 3 — Capacitor (local build, full control)

A `capacitor.config.ts` is already included.

### Prerequisites (install once on your machine)
- Node.js 20+
- JDK 17 (`brew install openjdk@17` on macOS, or AdoptOpenJDK)
- Android Studio with **Android SDK 34** + **Build Tools 34.0.0**
- `ANDROID_HOME` env var set to your SDK path

### Build commands

```bash
# 1. Install Capacitor
npm install -D @capacitor/cli
npm install @capacitor/core @capacitor/android

# 2. Build the web app
npm run build

# 3. Add the Android platform (creates ./android folder)
npx cap add android

# 4. Copy web assets + sync native plugins
npx cap sync android

# 5. (Optional) Replace launcher icons
#    Drop your icon variants into android/app/src/main/res/mipmap-*
#    or use a tool like https://icon.kitchen
#    The PWA icon at public/icon-512.png is already the StreetScore logo.

# 6. Build a debug APK (no signing needed, installs via adb)
cd android
./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk

# 7. Build a signed RELEASE APK
#    First, generate a keystore (one time):
keytool -genkey -v -keystore streetscore.keystore \
  -alias streetscore -keyalg RSA -keysize 2048 -validity 10000

#    Then add signing config to android/app/build.gradle (see Capacitor docs),
#    then:
./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk

# 8. Rename and install
mv app/build/outputs/apk/release/app-release.apk ../StreetScore.apk
adb install ../StreetScore.apk
```

### Updating the app later

Whenever you change the web app:

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
```

---

## Recommendation

For sharing with friends / installing on your own phone for matches: **Option 1 (PWA)** is enough and takes 10 seconds.

If you specifically need a `.apk` file to side-load or distribute: **Option 2 (PWABuilder)** is the easiest — no local toolchain.

Use **Option 3 (Capacitor)** only if you want native plugins, Play Store distribution, or full control over the Android wrapper.
