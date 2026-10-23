# SmartGrowth v1.7 — clean, three-profile device seed

## What changed

- No Firebase Auth or Firestore seeding script is shipped in this version.
- Three **fully populated fictional** business profiles are bundled with the Android/web app as local learning data: Litha Catering Studio, BrightCode Digital Services and Makhulu Fresh Produce.
- They include business name, structure, industry, fictional address, director's fictional name, description, practice reference, transaction history and an unpaid practice invoice. No passwords or identification numbers are bundled.
- These profiles are visible via **Welcome → View three local example business profiles**. This is read-only and never bypasses real SmartGrowth sign-in.
- The data is not imported into Firebase or a user's private Firestore business collection. An import helper also explicitly excludes the local sample IDs.
- The old five-record simulated CIPC matching list has been reduced to three; these are **fictional format matches, not real CIPC verification**.

## What you and your colleagues should do

1. Keep a backup of the current working repository and Firestore data.
2. Apply the patch or use the full v1.7 source. Do not delete an existing Firebase project or user accounts.
3. Start the app, sign out, and tap **View three local example business profiles** to inspect their full details.
4. Register a genuinely new **SmartGrowth** test account with the complete v1.6 guided business signup form. Use invented test personal details—never real SA ID information for a demonstration.
5. Verify the new business appears in that person's own Firestore record and that **none** of the three local samples appear in `users/{uid}/businesses`.
6. Test login, registration information display, offline entries, subsequent Firestore sync and account separation.

### If you ran the old administrator seeder

Repository updates cannot and should not silently delete your existing Firebase Authentication users or Firestore documents. The five old accounts, if actually created, still exist in your Firebase project. For deliberate cleanup, review their email addresses under **Firebase Console → Authentication → Users**, then inspect **Firestore Database → Data → users/{uid}** and remove only the specific records you have confirmed belong to those test accounts. Export or back up first. Deleting an Auth account does **not** automatically delete its Firestore documents. Do not delete real testers' data.

### Existing local data

The app preserves existing `smartgrowth_standalone_device_v1` browser/device records rather than replacing them automatically. The new three samples initialise only a fresh device workspace; the preview on the welcome page is always available. To avoid data loss, do **not** clear application storage simply to see the new examples.

## Web release (from `frontend/`)

```
npm install --no-audit --no-fund --legacy-peer-deps
npm run build
firebase deploy --only hosting --project smartgrowthmobile
```

## Android release

Push to GitHub and run the existing **SmartGrowth Android debug build** GitHub Actions workflow. Download its APK artifact and test on a phone. The hosted website deployment does not update existing APK installations.

No new Firestore rule changes are necessary for this sample-data cleanup if your v1.6 account rules are already deployed.

## Security and accuracy

This is a **SmartGrowth practice-registration demo**. No real CIPC / BizPortal API is called; generated or example references are not legal registration numbers. Passwords are managed by Firebase Authentication, and the full director ID is not stored by this workflow.
