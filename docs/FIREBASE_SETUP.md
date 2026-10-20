> **SmartGrowthMobile preconfigured edition:** This package already includes Four Horsemen Tech’s public Firebase Web configuration in `frontend/.env.local` (excluded from Git). Read [`SMARTGROWTHMOBILE_FIREBASE_CONNECTED.md`](SMARTGROWTHMOBILE_FIREBASE_CONNECTED.md) first; the generic steps below remain as reference. Do not replace the supplied configuration with example placeholders.

# SmartGrowth: cloud accounts, offline sync and live National Treasury data

**No locally running FastAPI server is required for the new mobile app.** The Android APK embeds the React application. Device-only business data is saved locally; when a Firebase project is configured, cloud account data is saved per user in Firestore. This integration has been implemented, but YOU must create/own the Firebase project to activate it. Avoid committing real credentials, passwords or business documents.

## A. Activate Firebase (team setup, required once)

1. Go to https://console.firebase.google.com/ and create a new Firebase project owned by Four Horsemen Tech. The project needs to be on a plan that allows the Firestore/Auth usage you expect. Review current pricing and usage limits before enabling billing.
2. Under **Build → Authentication → Sign-in method**, enable **Email/Password**.
3. Under **Build → Firestore Database**, create a Firestore database in a suitable region. Before collecting any real data, review South African POPIA requirements and the chosen hosting region.
4. Open **Firestore → Rules** and paste **`firestore.rules`** from this repository. Publish the rules. They restrict each entrepreneur to `/users/<their-auth-uid>/businesses/*` and block all other paths.
5. Under **Project settings → General → Your apps**, register a **Web app**. Copy the *public* Firebase web config values (`apiKey`, `authDomain`, `projectId`, `appId`). Do not use service account JSON or private keys in React.
6. Copy `frontend/.env.example` to `frontend/.env.local` and replace all four placeholders with your real project values. Keep `.env.local` out of Git. From the `frontend` folder run `npm install` and `npm run build`. Restart React after changing environment values.
7. For GitHub Actions cloud builds, go to your repository **Settings → Secrets and variables → Actions → Variables**. Add `REACT_APP_FIREBASE_API_KEY`, `REACT_APP_FIREBASE_AUTH_DOMAIN`, `REACT_APP_FIREBASE_PROJECT_ID`, and `REACT_APP_FIREBASE_APP_ID`. Trigger a new build to embed these public identifiers in the APK. These are project identifiers (not secret server credentials); secure your database using Firestore rules.
8. Install the APK, open **More → Cloud account & sync** and create an account while online. After that, restarting offline should reopen the cached private workspace. A first-time sign-in or password reset requires connectivity.

**Always test database access rules with two different accounts.** Sign into Account A, add a transaction, sign into Account B and confirm the record is not visible. Use the Firestore Rules Playground and Emulator Suite for more thorough testing.

### Data and privacy notes

- Cloud sync is optional. **The fictional device-only businesses are never uploaded by default**. To upload them, sign in and explicitly select **Copy device businesses to cloud**.
- While you are signed in, records for each Firebase user are kept in a separate device cache and in their own Firestore user path. This is appropriate for a hackathon pilot, not audited banking software.
- Offline changes are written locally first. Firestore queues writes while offline when persistence works, and synchronises when available. Records have stable IDs. Distinct sales/invoices/listings are combined by ID. The latest-edited business profile wins. **Concurrent offline edits to the SAME invoice/business on different phones can still conflict**. Avoid simultaneous edits in the demo and export backups.
- Storage on the device is not encrypted by this app. Require a phone lock, avoid real financial/customer secrets for the hackathon, implement account recovery/email verification, consent/privacy terms, retention/deletion flows and formal POPIA review before real users.
- Deleting your app/browser storage removes locally cached data. The last *successfully uploaded* Firestore data can be restored after signing in again.

## B. Use National Treasury's official live OCDS API

The source is National Treasury's public endpoint:

`https://ocds-api.etenders.gov.za/api/OCDSReleases?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&PageNumber=1`

Documented by National Treasury at https://data.etenders.gov.za/Home/LearnMore and by the Open Contracting Partnership's source connector. SmartGrowth sends only date-range and page parameters, not private entrepreneur data. It displays the original publication date, *when fetched*, clearly marks cached records and never labels a tender definitely open just because the closing date is later.

**Android/iOS**: Native Capacitor HTTP requests directly target Treasury over HTTPS. The phone must have internet for the first successful fetch. If the Treasury service is unreachable, cached records remain visible; no pretend results are generated.

**Static web build**: Cross-origin requests may be blocked by CORS. We have included `cloudflare/treasury-worker.js`, a restricted GET-only serverless relay, which needs no *local* server. To deploy:

1. Create a Cloudflare account and a Worker using the `cloudflare/` folder (`npx wrangler deploy` after installing/logging into Wrangler).
2. Set the Worker's **ALLOWED_ORIGIN** variable to the exact HTTPS origin serving the SmartGrowth web app, for example `https://smartgrowth.example.org`. Do not use `*` for a public relay.
3. Set `REACT_APP_TREASURY_PROXY_URL=https://your-worker.your-subdomain.workers.dev/` in the frontend build environment. Rebuild/redeploy the web app.
4. On the APK, the native client connects directly to the official upstream, ignoring the web proxy.

A relay adds an external dependency, but **no Windows localhost process is required**. Data is still fetched from National Treasury, not fabricated by SmartGrowth. Confirm live endpoint behaviour and source uptime from your own device; it was not reachable from the automated build environment.

### Live procurement test

- With internet on, open **More → Procurement → National Treasury → Fetch official data** and select the last 7 days. Verify records show an actual source link; the screen must display an error if none can be fetched.
- Turn on flight mode; reopen Procurement. Records from the last successful fetch should be marked saved/cached with the previous fetch date.
- Compare a few OCIDs and deadlines on https://www.etenders.gov.za/. Treasury warns that its open data is incomplete and may be delayed.
- Never present example procurement briefs as live tenders.

## C. Build the APK without your computer's server

1. Push this project to GitHub. Keep `.env.local` and `backend/data/*` private.
2. Set the GitHub Actions Variables described above.
3. Run the **SmartGrowth Android debug build** workflow. Download the `smartgrowth-debug-apk` artifact and install the debug APK.
4. Disable Wi-Fi and unplug USB. Open SmartGrowth, use bookkeeping and create an invoice. They should still work. Reconnect internet to use cloud sync / official live procurement.

A debug APK is an installable demonstration app, not a signed Play Store release. A real production release also needs testing, signing and security hardening. iOS still requires an iOS build toolchain or cloud build.
