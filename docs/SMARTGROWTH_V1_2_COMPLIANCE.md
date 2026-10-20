# SmartGrowth v1.2 — Business Compliance Hub

By Four Horsemen Tech · October 2026

## What this release actually does

Adds a **Business Compliance** screen to the same offline-first interface you already use. Business structure, CIPC enterprise number (optional), and CSD supplier number (optional) are stored as part of the chosen business; a signed-in entrepreneur's business record synchronises through the existing Firebase Firestore workflow. Nothing is uploaded automatically to CIPC, SARS or CSD.

- Chooses relevant compliance **preparation steps** from the structure and government-supplier preference.
- Checks **number formatting locally**, but does not confirm that a number exists or belongs to the user.
- Links to authentic CIPC BizPortal, SARS TCS verification and CSD webpages.
- Lets entrepreneurs date-stamp that they **personally reviewed** the official portal. These are *self-reported reviews*, not third-party verification.
- Clears the previous CIPC/CSD review when the corresponding number changes.
- Shows the next preparation step in Growth Advisor/Business Journey. Manual portal reviews never automatically grant Growth Passport verification points.
- Works offline using existing on-device storage and synchronises with the *same* Firebase account data when signed in and connected.
- Accepts no SARS PINs, logins, identity numbers, CIPC client secrets or document uploads.

**Important:** We did not connect a live CIPC company-verification API because Four Horsemen Tech has not supplied authorised CIPC APIVerse access. The UI explicitly says **NOT API-VERIFIED**.

## How to enable genuine automatic CIPC company checks later

1. Visit https://developer.cipc.co.za/ and create a developer account.
2. Request access to the Authorisation API and **Companies API**; obtain the official API operation details, scopes, allowed uses, pricing and applicable privacy conditions.
3. Implement a secure Firebase Cloud Function or equivalent server-side adapter that stores the OAuth client secret in managed secret storage, validates Firebase user authentication and only queries the business records the signed-in user owns.
4. Return a limited verified result (e.g. registered name, enterprise number, current status, `checkedAt`, `source`) to the app. Compare it with the user-entered company details, and handle no match, rate limits, unavailable and mismatched registration numbers.
5. Provide a clear last-verified timestamp and source. Do not equate successful number format validation or a self-reported review with official verification. Recheck when necessary.
6. Never put OAuth client secrets in React environment variables, GitHub Actions public Variables or Firestore documents.

The current APK and Firebase-hosted website do **not** need a local FastAPI process for this feature. A future official CIPC lookup will need a reachable, authenticated server-side API proxy.

## Why SARS and CSD are handled separately

- SARS Tax Compliance Status is checked via eFiling or the SARS Online Query System when authorised by the taxpayer with a valid TCS PIN. The app **must not collect, store, or auto-reuse** that sensitive PIN.
- CSD supplier status and registration reports are managed in the official CSD portal. A supplier number is not a government-verified API lookup.
- Different business structures have different legal obligations. Sole proprietors should not be incorrectly told that registering a CIPC company is universally compulsory.

Official references:
- https://developer.cipc.co.za/
- https://www.bizportal.gov.za/
- https://www.sars.gov.za/individuals/manage-your-tax-compliance-status/how-to-verify-tax-compliance-status/
- https://secure.csd.gov.za/Account/_RegistrationProcess

## Safe installation — current deployed repository

**Use the update patch** if you already have v1.1 deployed.
1. Back up the repository and any local-only business data.
2. Stop the React development process if running.
3. Extract `SmartGrowth-v1.2-Business-Compliance-Patch.zip` into the **parent directory of** `SmartGrowth-Mobile` and merge matching files.
4. Keep the existing `frontend/.env.local` file. The patch does not include environment settings, Firestore security rules or your databases.
5. Open a terminal from `SmartGrowth-Mobile/frontend` and run:

```
npm install
npm run build
firebase deploy --only hosting --project smartgrowthmobile
```

Website: refresh the hosted site and check **More → App version** (v1.2.0). Firebase account and business records remain stored in the existing Firestore project.

Android: commit/push source changes to GitHub. From repository **Actions**, run the existing SmartGrowth Android debug build; download and install the new APK. An already-installed APK does not update when the web deploy is changed. Back up locally stored records and confirm Firebase sync before uninstalling an APK with a different debug signature.

## Five-minute UAT

1. Open a business → **More → Business compliance**. Select **Individual / sole proprietor**; ensure the CIPC enterprise check is not marked mandatory.
2. Select **Registered company** and enter `2026/123456/07`; confirm the UI says formatting looks plausible but **not checked against CIPC**. Try a malformed value.
3. Open the CIPC BizPortal link, return to SmartGrowth, and select **I reviewed this on the portal**. Verify that the status says **Self-reported** rather than **Verified**.
4. Change the enterprise number. Ensure the previous review is cleared.
5. Enable government-supplier mode; review the CSD link and optional `MAAA...` number.
6. Visit **My Journey**, **Growth Advisor** and **Growth Passport**. Confirm relevant actions and that self-reporting has not added automatic Passport points.
7. Sign in to Firebase, create/update a business compliance profile, go offline, reopen the app, then reconnect. Check the same business shows the saved details on another signed-in device. Different accounts should remain isolated.

## Tests completed in the source package

- 50 Node.js tests passed (including eight compliance tests).
- Five Python backend regression tests passed.
- React JSX and production build, official CIPC API connection, Android APK rebuild and end-to-end Firebase sync still require verification on the team's devices.
