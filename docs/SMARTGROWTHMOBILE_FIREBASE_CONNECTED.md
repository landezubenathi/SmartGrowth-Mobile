# SmartGrowthMobile — Firebase is now configured in the source package

The enclosed `frontend/.env.local` contains the **public Firebase Web App configuration** provided by Four Horsemen Tech. React automatically loads it when you run `npm start` or `npm run build` from `frontend`. The existing Firebase modular SDK integration already provides email/password account registration, login, sign-out, password reset and Firestore sync. **Do not paste the generic Firebase Console code into `App.js`**; doing so would initialise the app twice.

## Setup in Firebase Console (cannot be completed just by editing source)

1. Project: **SmartGrowthMobile**, project ID **`smartgrowthmobile`**.
2. Authentication > Sign-in method > enable **Email/Password**.
3. Firestore Database > Create database if not already created. Choose a suitable location and read POPIA obligations before real data collection.
4. Firestore Database > Rules > paste this repository's `firestore.rules` and press **Publish**. The default `allow read, write: if false` blocks SmartGrowth; do not use open/test rules in production.
5. Test with a NEW test email and fake business data. In SmartGrowth use **More > Cloud account & sync > Create account**; add a business and transaction. In Firestore look for `/users/{Firebase UID}/businesses/{businessId}`.
6. Sign in with a second Firebase account. Ensure it cannot see the first account's records. Make a transaction while offline, reopen the app, reconnect, and verify the transaction appears in Firestore/another signed-in device.

### Local development

```powershell
cd SmartGrowth-Mobile
node scripts/verify_firebase_config.mjs
cd frontend
npm install
npm start
```

No FastAPI backend is needed for this standalone app. `.env.local` is deliberately excluded by `.gitignore`, so it stays on your PC when you push the source to GitHub. **Firebase Web API keys are public app identifiers, not private server/service account keys**; Firebase Authentication and Firestore security rules are what protect users. Do not commit service-account JSON or actual customer data.

### GitHub Actions builds — IMPORTANT

Your PC's `.env.local` file will not be in your GitHub repository. Therefore you **must** set the following Actions repository **Variables**, not secret credentials, at `GitHub > Settings > Secrets and variables > Actions > Variables`:

- `REACT_APP_FIREBASE_API_KEY` — copy `apiKey` from Firebase Console
- `REACT_APP_FIREBASE_AUTH_DOMAIN` — `smartgrowthmobile.firebaseapp.com`
- `REACT_APP_FIREBASE_PROJECT_ID` — `smartgrowthmobile`
- `REACT_APP_FIREBASE_APP_ID` — copy the web `appId`

Optional variables: `REACT_APP_FIREBASE_STORAGE_BUCKET`, `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`, `REACT_APP_FIREBASE_MEASUREMENT_ID`, `REACT_APP_TREASURY_PROXY_URL`.

The updated Android workflow now stops with a clear Firebase setup message if these four variables are absent; this prevents a successful APK build with a silently disconnected cloud login. Run `Actions > SmartGrowth Android debug build > Run workflow`, download the debug APK artifact, and install it on your phone.

### Are demo/sample businesses uploaded?

**No, not automatically.** The two fictional sample businesses remain in your device-only workspace. Only data created in the signed-in cloud workspace is synced. Copying device businesses into the account requires pressing **Copy device businesses to cloud** and confirming the action. An empty initial cloud placeholder is not uploaded until it becomes an actual business. Do not import fake records into a live business account by mistake.

### Analytics

Firebase Console's `getAnalytics(app)` line is **not included** in this project. Analytics is optional, not needed for login or Firestore. Initialising Analytics in unsupported native/offline WebViews can introduce failures. You can add it later with platform-support checks and user-consent considerations.

### Security / readiness

The current client uses on-device localStorage for some account cache data; that cache is not encrypted at rest. Do not collect production financial information until consent, data handling, conflict resolution, device security and POPIA requirements have been reviewed. Only the *last successfully synced* changes are recoverable on another device. The app remains usable offline with its embedded UI and locally available data.
