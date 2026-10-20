> **SmartGrowthMobile Firebase setup:** The attached ZIP now includes your actual Web App settings in Git-ignored `frontend/.env.local`. See [`docs/SMARTGROWTHMOBILE_FIREBASE_CONNECTED.md`](docs/SMARTGROWTHMOBILE_FIREBASE_CONNECTED.md). Firebase Authentication and Firestore still must be enabled and rules published in your own Firebase Console. For GitHub cloud APK builds, copy the four required Web App values into Actions Variables.

# SmartGrowth — Offline-First Mobile + Cloud Accounts + Real Procurement Data

Four Horsemen Tech's entrepreneur-focused app. **Android/iOS/web frontend does not need a local FastAPI server**. The React application is bundled into the Capacitor app; business records are available offline. Optional Firebase Auth + Cloud Firestore adds private accounts and automatic sync when the connection returns. Procurement cards can fetch official public National Treasury OCDS release data, then display saved records offline.

## Start here

- **Firebase activation, sync and National Treasury live API:** `docs/FIREBASE_SETUP.md`
- **APK building and submission:** `docs/SUBMISSION_AND_BUILD.md`
- **Core standalone testing:** `docs/STANDALONE_UAT.md`

### Run as a website for development

```sh
cd frontend
npm install
npm start
```

Visit http://localhost:3501. This local address is **only for development**, not required by the compiled APK. No FastAPI process is needed for the offline-first app. To build a static website use `npm run build` and host `frontend/build` on any HTTPS static host.

### Mobile APK

Run the `.github/workflows/smartgrowth-android.yml` workflow on GitHub to produce `smartgrowth-debug-apk`. It embeds the interface and local data engine. An online account requires that you first configure a Firebase project and provide its public frontend config variables at build time.

### Architecture

- `frontend/src/features/standalone`: mobile UI, bookkeeping, invoices, Passport, Journey, SmartShield, public procurement
- `frontend/src/features/standalone/cloud-firebase.js`: optional Firebase Auth and account-specific Firestore read/write
- `frontend/src/features/standalone/cloud-store.mjs`: per-user offline caches and record merging
- `frontend/src/features/standalone/treasury-data.mjs`: official OCDS normalisation and offline cache
- `cloudflare/treasury-worker.js`: optional serverless proxy for web browsers restricted by CORS
- `firestore.rules`: Firestore isolation for account-owned business data
- `backend/`: **legacy optional** FastAPI workflows kept for reference; not needed by the current app

**Not implemented:** real money transfers, independent CIPC/SARS verification, fraud-model AI, authorised procurement applications. Readiness scoring and advice are explainable rules-based estimates. No cloud project or API key has been created on your behalf.
