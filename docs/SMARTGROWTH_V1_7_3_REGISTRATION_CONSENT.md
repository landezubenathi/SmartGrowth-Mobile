# SmartGrowth v1.7.3 — Registration input and consent refinements

This release is based on the v1.7.2 Compliance Cleanup package. It changes the sign-up user interface and its local validation only. Existing Firebase accounts, Firestore rules, business records, and other features are not altered.

## What's changed

- The **South African ID** field accepts exactly 13 digits and checks the SA ID checksum locally. The entire ID is **not** stored in the business workspace or simulated registry.
- The **postal code** field accepts exactly four digits. On-screen inputs use `inputMode="numeric"`, and letter characters are blocked for typed, pasted and dropped input. Invalid mixed-character pastes are refused, not quietly cleaned.
- On the register form, a concise **Before you register** notice explains how the app uses information in Firebase, identifies the simulated workflow and links to CIPC's official guidance. Registration requires a checked consent box, validated both in the form and in the onboarding logic. The consent time and notice version are recorded with the business details, but not the director's ID.
- The previous large yellow disclaimer was removed from the **Registration complete** screen. The heading above the generated reference now says **SmartGrowth registration reference · not issued by CIPC**. The verification simulation is still identified during registration and does not claim official CIPC registration.

## Testing

From the repository root (`SmartGrowth-Mobile`):

```powershell
node --test tests/*.test.mjs
```

Manually check:

1. Select **New here? Register your business** on the sign-in screen. The short information notice and official CIPC link should appear before any business details are submitted.
2. Without checking the consent box, try to register. The form must not submit.
3. Enter letters, punctuation or mixed-character paste into the ID and postal fields. They should be rejected and explained; on mobile, the numeric keypad should appear.
4. Try a postal code of 3 digits, an ID with 12 digits or a failed ID checksum. The app should reject the submission. A complete 4-digit postal code and correct 13-digit ID checksum are required.
5. Complete a test registration. The completion screen must not contain the old large highlighted warning. It must identify the generated reference as belonging to SmartGrowth, not CIPC.
6. Sign in and check the business address, name and existing functionality. Existing records and Firebase accounts must remain unchanged.

## Publish to the hosted web app

Merge the **patch** into your existing `SmartGrowth-Mobile` folder (back up first), then from `frontend`:

```powershell
npm install --no-audit --no-fund --legacy-peer-deps
npm run build
firebase deploy --only hosting --project smartgrowthmobile
```

No new Firestore rules or database migration is required by this UI change.

## Update the Android app

Commit and push the changed source to GitHub. Run your existing **SmartGrowth Android debug build** GitHub Actions workflow, download the APK artifact, and install it. Updating Firebase Hosting does not update an installed APK. Confirm backups/cloud sync before uninstalling an old debug APK.

## Safety and future production use

A SmartGrowth practice registration does **not** submit to CIPC or BizPortal, and a locally checked ID format does **not** establish someone's identity. Before collecting real people's data at scale, complete your Terms and Privacy Notice, lawful-purpose and retention review under POPIA, and secure backend/data access review. Consent alone does not automatically satisfy every POPIA obligation.
