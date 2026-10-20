# SmartGrowth — Offline / Online Sync + National Treasury UAT

## Setup
- Build and install the APK with Firebase config variables embedded (see `FIREBASE_SETUP.md`).
- Publish `firestore.rules` before creating any test account.
- For web testing, deploy the optional Worker and set its URL if browser CORS prevents the direct Treasury request.
- Use **fictional** business/customer data only.

## Functional test cases

1. **No USB/backend:** Close your PC's SmartGrowth/FastAPI servers, unplug USB. Open the installed APK. Home, Journey, Passport, bookkeeping, invoices, SmartShield must render.
2. **Device-only privacy:** Open the default local workspace. Its fictional Litha Catering and BrightCode Studio examples must not be automatically uploaded when you register a new account.
3. **Create account:** With internet, open More → Cloud account & sync. Register Account A; it should open an account-specific workspace.
4. **Account business:** Edit your account business profile, enter R1,000 income and R200 expense. Growth Passport and Journey must update from these records.
5. **Cloud connected:** Check the UI reports connected/up to date. Verify Firestore contains these records under `users/<Account A UID>/businesses/<ID>`.
6. **Offline edits:** Enable flight mode, record R350 more income, issue an unpaid R500 invoice. The app must still work and show the invoice as unpaid; no extra R500 income.
7. **Restart offline:** Force-close/relaunch while offline. The last signed-in account's cached data and its offline edits should remain visible. The status should say cached/offline, not falsely 'connected'.
8. **Reconnect:** Disable flight mode, wait for the connection status, then compare Firestore records. They should contain the R350 income and the new invoice.
9. **Second device:** Install the APK with the same Firebase project config and sign in as Account A. Confirm the records appear. Make one new transaction and observe it on the first device when online.
10. **Account isolation:** Sign out and register Account B. Account A's records must not appear in the Account B workspace. Verify Firestore security rules deny cross-account reads.
11. **Explicit copy:** In Account B, select 'Copy device businesses to cloud' and confirm; the fictional device-only businesses should then appear in Account B. Account A must remain unchanged.
12. **Password reset:** Request a reset using a configured Firebase email account; ensure password reset is sent without disclosing whether an account exists in the UI.
13. **Live National Treasury:** Connect internet, More → Procurement → Fetch official data (last 7 days). If source responds, inspect title, OCID, buyer, publication/closing dates and official links; verify against Treasury.
14. **Treasury offline:** Disconnect internet and refresh. Previously fetched records must show a cached date and not be labelled live. If no fetch has ever succeeded, the screen must say unavailable, not invent opportunities.
15. **Treasury web CORS:** Deploy the restricted Cloudflare Worker with the site HTTPS origin. Check the static website can retrieve records through it. Inspect the browser network tab; private business records must not be sent to the Worker/Treasury.
16. **APK build:** GitHub Actions must successfully produce `smartgrowth-debug-apk`. Install it on a physical Android device and repeat tests 1, 4, 6, 8 and 13.

## Known constraints
- Without your own Firebase configuration, only device-only mode works; account sync is not activated.
- The National Treasury endpoint's existence is documented, but upstream uptime, response rate and published data completeness aren't guaranteed. Confirm an actual live fetch on a physical device before your presentation.
- The sync is a pilot, not a transaction-grade distributed ledger: avoid simultaneous edits to the same invoice/business on two offline phones.
- A compiled APK bundles the UI and device data logic; it does not embed a Firebase server or National Treasury's data. Cloud sync and new public data require internet.
- Web browsers need HTTPS hosting and may require the optional proxy; a locally tested React site is not itself a distributed production service.
