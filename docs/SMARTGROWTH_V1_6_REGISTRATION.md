# SmartGrowth v1.6 — First-open registration journey

This release builds on v1.5. It preserves the Firebase Authentication workspace, existing simulated registry, bookkeeping, Growth Passport, marketplace, Treasury, Intelligence, and offline account cache.

## Exactly what a user sees

1. New installation: **Sign in** or **Register your business**. Existing Firebase accounts sign in with email/password.
2. New registration: email, new SmartGrowth password, business name, structure, industry, province, street address, town/city, postal code, owner/director full name, 13-digit SA ID format, and a short description.
3. On Register, the interface shows six progress steps with small delays. **No checks are sent to CIPC, BizPortal, Home Affairs or any government service.** The format check is local only.
4. Firebase Authentication creates a genuine SmartGrowth account; a Firestore business record and private simulated-registry record are created with a **practice registration reference**. This is NOT a CIPC registration number or evidence of legal company registration.
5. The screen displays the practice reference. Select **Continue to sign in** and log in with the new SmartGrowth email/password.
6. Home and Business Profile show the new business; Business Profile shows the original registration fields as read-only. Account owners can still manage finances, invoices and other working tools.
7. Previously created Firebase accounts remain supported. New releases no longer create test Firebase accounts; three fictional profiles are available read-only on the welcome screen.

## Sensitive-data treatment

- Director ID number is **validated for 13-digit format and Luhn checksum locally only**, then discarded. It is not stored in Firebase, Firestore or the business record. Passing the check does not prove identity.
- Passwords are sent only to Firebase Authentication; no business or registry document contains a password.
- Director name and business address ARE stored in the account-owned business document; this is personal information. Use test data in judging demonstrations and publish a privacy notice before accepting real applicants.
- Creating an account requires an internet connection the first time. A previously signed-in account can continue with cached records offline as supported in earlier releases.
- The simulated registry is scoped to each Firebase UID and cannot authoritatively establish CIPC status. Do not use its generated references on official forms.

## Install/update without deleting your data

**Patch:** Back up the repository and extract the patch at the folder containing `SmartGrowth-Mobile`, preserving your `frontend/.env.local` and any local backups.

**Website:** From `SmartGrowth-Mobile/frontend`:

```powershell
npm install --no-audit --no-fund --legacy-peer-deps
npm run build
firebase deploy --only hosting --project smartgrowthmobile
```

No Firestore rules update is required from v1.5: the existing `users/{uid}/businesses` payload allows registration details, and the private `users/{uid}/simulatedRegistry` schema is unchanged.

**Android:** Commit/push to GitHub `main`; use **Actions → SmartGrowth Android debug build → Run workflow**, download the APK artifact and test over the previous installed app. Back up device-only data and confirm cloud sync before uninstalling if Android refuses to install over the existing package.

**Note:** Deploying Firebase Hosting does not update an existing APK; rebuild Android separately. If GitHub build fails, inspect the specific failed test/step, not only deprecated-package warnings.

## Acceptance checks

- New registration form rejects missing address, invalid SA ID format, short business name or short password.
- Registration progress tells the truth about simulation, then generates a practice reference; account and business exist in Firebase / Firestore.
- Sign in with that email/password: correct business name, owner/director, address, description, industry and reference appear.
- Business Profile displays original registry details without an edit option for practice-registered records.
- Logout/login does not duplicate the business. Another user cannot see private business records.
- Existing real Firebase accounts still log in. Three fictional local profiles do not have login passwords.
- Bookkeeping, Journey, market listings, Passport and Intelligence still work; saved offline changes resync to the signed-in workspace.

**Verification:** JavaScript unit/regression suite and TypeScript JSX parser run locally. Firebase live registration, React production build, cloud deployment and APK installation must be tested with your configured project.
