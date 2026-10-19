# SmartGrowth submission and Android build guide

## What can be submitted?

- **Android demo:** `app-debug.apk` from a successful GitHub Actions run. Debug APKs are for testing, not Google Play distribution.
- **Installable website:** built static `frontend/build/` hosted on HTTPS, or the `smartgrowth-static-web` GitHub Actions artifact uploaded to a static hosting provider.
- **Source:** repository link or this ZIP; share any additional information requested by the hackathon workspace.
- **iOS:** requires a Mac or compatible macOS cloud service with Xcode. The React UI and Capacitor config are iOS-capable, but an IPA has not been built or verified.

**Offline means independent of the laptop/backend**, not independent of a device to install on. The APK contains its own React pages, business calculations, rules engine and sample data. Opening CIPC, SARS, CSD or eTender links still requires internet. Hosted accounts require a backend, and cannot be used while offline without additional sync features.

## A. Get an APK through GitHub (no Android Studio download)

1. Create a repository such as `four-horsemen-tech/smartgrowth-mobile` and upload the **contents** of `SmartGrowth-Mobile` (not a nested ZIP). Do not commit actual customer records, SQLite database files, API secrets or `.env` files.
2. Ensure GitHub Actions is enabled. The repo contains `.github/workflows/smartgrowth-android.yml`.
3. Go to **Actions → SmartGrowth Android debug build → Run workflow**.
4. The cloud job installs Node 22 and JDK 21, runs the standalone tests, installs packages, builds React, generates/syncs the Capacitor Android project and runs Gradle `assembleDebug`.
5. Download the **smartgrowth-debug-apk** workflow artifact after a green run. Unzip the artifact; the APK is `app-debug.apk`.
6. Move the APK to Android (USB or secure file sharing), open it and allow installation from that source for this test build.
7. Open SmartGrowth and tap **Open SmartGrowth offline**. Turn off Wi-Fi/mobile data and check the business workflows. You should not need the Windows server or ADB reverse.

On workflow failure, inspect the first error in the step named **Install npm dependencies**, **Build web app** or **Build debug APK**. This deliverable has *not* been compiled in Android Studio in the current environment.

## B. Web/PWA version

From the `frontend` folder:

```powershell
npm install --legacy-peer-deps
npm run build
```

Host all of `frontend/build/` on an **HTTPS static host** (for example Netlify or Cloudflare Pages). Test the public URL, then try your browser's **Install App** option. The app may not work on the very first visit without a connection; open it online once for the service worker to cache its assets. The offline demo still stores different data on each device/browser.

## C. Local APK build with Android SDK already installed

Run `BUILD_ANDROID_APK_WINDOWS.bat`, or from `frontend` run:

```powershell
npm install --legacy-peer-deps
npm run build
npx cap add android          # once only, if android/ does not exist
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

Requires Node.js 22+, JDK 21 and a supported Android SDK/Gradle toolchain. Look for `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

Capacitor uses `webDir: "build"`; there is **no `server.url` pointing to Windows localhost** in the configuration. Do not add one to the APK build, because then the app stops being standalone.

## D. Six-minute hackathon demonstration

1. Open SmartGrowth in **Airplane Mode** and select **Open SmartGrowth offline**.
2. Select the fictional *Litha Catering (Sample)* business, inspect its Journey and current Passport.
3. Record a sale or issue a demo invoice; show that an unpaid invoice does **not** add revenue.
4. Mark that invoice **Simulate paid**; return to Money and Passport. It adds income only once.
5. Switch to fictional *BrightCode Studio (Sample)*; its business records and Journey are separate.
6. Create a totally new business using **My own industry** to show that SmartGrowth supports other sectors.
7. Open SmartShield, scan a sample message asking for an OTP and urgent processing fee.
8. Open Opportunities: show the **fictional practice matches**, then show the labelled official eTender link (internet required).
9. Export an on-device backup and explain how hosted accounts could be introduced later for syncing.

Explain clearly that the offline demo uses on-device storage and no payments, official identity checks, or live tender feeds have been integrated.

## Submission checklist

- [ ] GitHub Actions build is green
- [ ] Installable `app-debug.apk` exists and opens on an actual Android phone
- [ ] App functions with phone in Airplane Mode after installation
- [ ] All core features work with the backend fully switched off
- [ ] Existing React account mode still works with a running FastAPI backend (if used)
- [ ] Export/import and business switching work
- [ ] No real identities, banking details, passwords or customer records are shown during the demo
- [ ] Static website URL is HTTPS and tested
- [ ] FNB challenge requirements have been checked separately; APK debug availability is not the same as formal submission acceptance
