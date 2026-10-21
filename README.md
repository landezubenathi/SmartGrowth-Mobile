> **SmartGrowth v1.2:** Business Compliance Hub added. See [Compliance guide](docs/SMARTGROWTH_V1_2_COMPLIANCE.md). This release offers offline readiness checks and official portal links; it does not yet conduct automatic government registration verification.

# SmartGrowth — Personalised Business Intelligence Upgrade

**New:** `✦ Insights` presents business-specific income/expense trends, overdue invoice reminders, spending categories, monthly goals and explainable actions while keeping the app offline-first. See [upgrade and deployment instructions](docs/INTELLIGENCE_UPGRADE_AND_RELEASE.md).

**Web release:** double-click `PUBLISH_WEB_WINDOWS.bat` after backing up data. **Android release:** push to GitHub → Actions → download the new APK. These are independent updates.

---

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

---

## SmartGrowth v1.2.1 — team refinement

The updated source implements the team's requested login-home redirect, private-to-shared opt-in market listings, more diagnostic National Treasury fetching, fictional CIPC-like demo matching, a consolidated local FAQ/business-data assistant, modern primary icons, and in-app notifications.

**Start here:** [`docs/SMARTGROWTH_V1_2_1_TEAM_REFINEMENT.md`](docs/SMARTGROWTH_V1_2_1_TEAM_REFINEMENT.md).

Do not mistake the local registry demo for official verification, the offline help bot for a live ChatGPT API, or in-app notifications for OS push notifications. Real cross-account publication requires deploying the included updated Firebase Firestore security rules. Browser live procurement data may need a deployed HTTPS Worker. The existing Firebase project and saved data should not be reset.
