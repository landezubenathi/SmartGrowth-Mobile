# SmartGrowth — Personalised Business Intelligence (October 2026)

## What changed

This update extends the **same standalone mobile interface** that your team already built and deployed. It does not create another app, change the Firebase project, replace business records, or require your old FastAPI server.

- New **✦ Insights** bottom-navigation page, Home card, and More shortcut.
- Insight cards computed **per selected business in the current workspace**. In Cloud mode, the workspace is restricted to the signed-in Firebase account. Device-only examples remain separate.
- Recent **30 days vs previous 30 days**, income, expenses, recorded surplus, categories, invoice status and overdue counts.
- Rules-based alerts and action buttons to the correct Bookkeeping, Invoices, Growth Passport, Goals and Procurement pages.
- Monthly **revenue target** and **expense budget** stored as `insightSettings` on the business object. In Cloud mode this is uploaded with the same Firestore record when connected.
- Downloadable private text report and explicit data-quality/simulation warnings.
- A one-click `PUBLISH_WEB_WINDOWS.bat` script for publishing a rebuilt website; hosting configuration placed in `frontend/firebase.json`.

**Not generative AI:** these are deterministic, explainable suggestions computed from the entrepreneur's own saved records. No data is sent to an external LLM. Financial information is unverified and does not constitute bank accounting, credit scoring or professional financial advice.

## BACK UP BEFORE UPDATING

1. Open the current SmartGrowth on your phone or the website.
2. In **More → Backup and device privacy**, choose **Export data** and save the JSON backup somewhere safe. Exports are unencrypted: handle confidential details carefully.
3. For signed-in Cloud mode, confirm **Cloud connected — records up to date** and verify your records in the Firebase Console. The local device workspace is NOT synced automatically.
4. Keep a copy of the working project folder; do not overwrite it without a backup.

## Option A — Apply the small patch to your existing repo

Extract the PATCH ZIP into the **parent directory containing `SmartGrowth-Mobile`**, merging existing files. The patch does NOT contain `.env.local`, Firestore rules or any device/business data. It contains the new intelligence module, the updated screen, tests, documentation, workflow check and web publishing script.

The full ZIP is a clean source snapshot if you prefer a separate working folder.

## Test locally before publishing

In PowerShell, from your project's `frontend` folder:

```powershell
npm install --no-audit --no-fund --legacy-peer-deps
npm run build
npm start
```

From the repository root, you can also run the JS regression tests:

```powershell
node --test tests/*.test.mjs
```

No local FastAPI server is necessary for offline business records, Firebase Auth/Firestore or this Intelligence dashboard.

## How to publish EACH website change

From the root folder, double-click `PUBLISH_WEB_WINDOWS.bat` **or** run:

```powershell
cd frontend
npm run build
firebase deploy --only hosting --project smartgrowthmobile
```

The Firebase config for this project's React web app is loaded from `frontend/.env.local` on your computer (or CI environment variables). Do not commit `.env.local` or any Firebase service-account keys. Sign in to Firebase CLI with `firebase login` if required.

After deployment, open your Firebase Hosting URL and perform a hard refresh if an older cached interface appears. The website updates immediately; the installed Android APK does NOT.

## How to update the Android APK EACH time

1. Copy changes to your GitHub repo, commit, and push to `main` or `master`.
2. In GitHub → **Actions → SmartGrowth Android debug build**, confirm the new workflow ran (or choose **Run workflow**).
3. Wait for the web + APK build to pass, then download **smartgrowth-debug-apk** from the run's **Artifacts**.
4. Extract `app-debug.apk` and install on Android.
5. **Important:** GitHub-hosted debug builds may be signed by different ephemeral debug keys. If Android refuses to install an update over the existing app, DO NOT immediately uninstall the old app; first verify your Cloud workspace has synced and export a backup of device-only data. A stable release signing key is the right solution before wider distribution.
6. An APK installed on a phone does not need USB or your PC for the offline features. Live Treasury feeds and Firebase sync require internet.

## 10-minute UAT plan — one business at a time

1. Log into Cloud mode with Entrepreneur A, create or open Business A.
2. Open **Insights**. It should show Business A's name and account, with no data from anyone else.
3. Go to Money; add an income and an expense. Return to Insights and check the last-30-days figures and spending category.
4. Go to Invoices; create an **unpaid** invoice with a due date in the past. Return to Insights to see the overdue alert. Creating the invoice must NOT increase income.
5. Tap **Set goals**; set revenue and expense targets. Return to Insights. Change an amount in Bookkeeping, then verify your budget/goal progress changes.
6. Log out and log into Entrepreneur B, who should have separate businesses and insights. A's goals and transactions must not be visible.
7. On Account A, test offline edits, then reconnect and wait for sync confirmation. Open the web app with the same account and check that the same business goals/records appear.
8. Try the fictional demonstration business. Confirm the data-quality notice identifies SAMPLE records.
9. Export a text report and check that its numbers match the screen.
10. Test buttons from alerts and the bottom navigation on Android and web.

## Limitations / future work

- This is **rules-based intelligence**, not trained AI or verified financial analytics.
- There is no live bank transaction integration, payment settlement verification, legal eligibility decision, inventory forecasting, or credit score.
- Firestore sync uses per-business documents; conflicts from simultaneous devices still need broader tests. Always test with fictional data before relying on it for a business.
- Cloud mode continues to require Firebase Authentication, correctly published owner-only Firestore rules and your configured Firebase Web app.
- Web hosting and native APK need separate build/deploy actions.
- On-device storage and exported JSON are not encrypted; do not store real private financial documents until security and POPIA readiness are validated.
