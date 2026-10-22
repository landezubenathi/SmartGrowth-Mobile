# SmartGrowth v1.5 — One-stop sign-in and simulated business registry

## What the upgrade does

- One **SmartGrowth login** (Firebase email/password) gates the app on Android and web.
- On later offline launches, the last signed-in account may use locally cached records without USB or your PC. A fresh first login requires internet.
- After signing in, the app watches `users/{uid}/simulatedRegistry` and imports registered business names, types, provinces and practice registration references into the account's normal SmartGrowth businesses.
- Accounts without a business are guided to in-app registration. This generates a **fictional practice reference**, saves a real usable SmartGrowth business locally and queues the registry/business documents for Firestore sync.
- Old account business records, finance, market listings, intelligence and other features are kept; the default Litha/BrightCode device sample state is not imported into new Firebase accounts.

**Important:** This does NOT authenticate against CIPC/BizPortal, access CIPC records, register an official company, or prove CIPC verification. A user should **never** enter their real CIPC/BizPortal password in SmartGrowth. The five provided companies, email accounts and registration numbers are fictional testing data.

## Firebase architecture

Authentication: `Firebase Authentication`, email/password; passwords never stored in Firestore.

Existing owner-private business data:

    users/{firebaseUid}/businesses/{businessId}
        ownerUid: firebaseUid
        payload: {business name, industry, region, bookkeeping, invoices, ...}
        modifiedAt: ISO string

New private practice registry:

    users/{firebaseUid}/simulatedRegistry/{businessId}
        ownerUid: firebaseUid
        email: authenticated user's email
        businessId: a stable business identifier
        businessName, industry, province, registrationNumber
        source: smartgrowth-simulated-registry
        status: practice
        createdAt, modifiedAt

Every business is isolated by Firebase user ID. Only its account can read or create its records; data never becomes an official CIPC status. Public marketplace documents remain in the existing marketplace collection with the existing restricted rules.

## Upgrade an already deployed SmartGrowth project

1. Back up the working repository. Back up data from devices that has not yet synchronised.
2. Use `SmartGrowth-v1.5-One-Stop-Update-Patch.zip` and merge the `frontend`, `firestore.rules`, `seed-registry`, `tests`, and `docs` files into your existing `SmartGrowth-Mobile` repository. Keep your `frontend/.env.local` unchanged.
3. **Deploy the new Firestore security rules BEFORE testing registration**. From the `frontend` directory:

       firebase deploy --only firestore:rules --project smartgrowthmobile

4. Build and publish the web app (from `frontend`):

       npm install --no-audit --no-fund --legacy-peer-deps
       npm run build
       firebase deploy --only hosting --project smartgrowthmobile

5. Test with a **new Firebase account**: create account -> fill out business form -> save -> check `users/{uid}/simulatedRegistry` and `/businesses` in Firestore -> record a transaction -> sign out -> sign in again -> verify same business/transactions.
6. Existing Firebase accounts with previously saved business records should still show their businesses after login. Their records need not exist in the practice registry to remain usable.
7. Commit and push the changes to GitHub to trigger the Android debug build or run the workflow manually. Download the debug APK artifact. Publishing Firebase Hosting **does not** update installed APKs.
8. When Android refuses to install an update because of debug signing differences, do NOT uninstall until account sync is verified and any device-only records have been backed up.

## Seed five fictional existing businesses (optional, one-time)

**Do not upload a service-account JSON to GitHub, ChatGPT, email, or your website.** Run the seeder on a private administrator computer, only against a project you own.

1. Firebase Console -> Project settings -> Service accounts -> Generate new private key. Store that key in a protected directory OUTSIDE the repository (e.g. `C:\private-keys\smartgrowth-service-account.json`).
2. Open PowerShell from the repository root, and set an environment variable **for this terminal session only**:

       $env:GOOGLE_APPLICATION_CREDENTIALS='C:\private-keys\smartgrowth-service-account.json'
       $env:FIREBASE_PROJECT_ID='smartgrowthmobile'

3. Run:

       cd seed-registry
       npm install
       npm run seed

4. The script creates **five fictional Firebase Authentication accounts**, each with a strong, randomly generated **SmartGrowth password**, and writes its practice business record under that account's user ID. It prints the passwords ONCE in your terminal. Store these privately for testers. An account that already exists is not reset; its password remains unchanged.
5. Use one of the created email/password pairs on the live SmartGrowth login. Its business should appear automatically after connecting to Firestore.
6. If the email/password pairs were previously seeded, retrieve/reset credentials through your own Firebase administrator process—never put plaintext passwords in Firestore.

Fictional test accounts (NO passwords in the source):

| Account email | Business name | Type | Practice registration reference |
|---|---|---|---|
| litha.catering@smartgrowth.example | Litha Catering Studio | Catering | 2026/840201/07 |
| brightcode@smartgrowth.example | BrightCode Digital Services | Technology | 2026/840202/07 |
| makhulu.fresh@smartgrowth.example | Makhulu Fresh Produce | Agriculture | 2026/840203/07 |
| ubuntu.repairs@smartgrowth.example | Ubuntu Home Repairs | Construction | 2026/840204/07 |
| sisonke.beauty@smartgrowth.example | Sisonke Beauty Collective | Beauty & Wellness | 2026/840205/07 |

These `.example` addresses are fictional and do not receive email. They are demonstration accounts, not real persons or verified organisations.

## One-stop acceptance testing

| ID | Test | Expected |
|---|---|---|
| 01 | Open web app or APK signed out | Email/password screen appears; old sample data isn't accessible |
| 02 | Sign in as a seeded fictional account | Correct preloaded business appears with registration number and industry |
| 03 | Sign in as a different seeded account | First account's bookkeeping and registry records are absent |
| 04 | Create a new SmartGrowth account | Registration onboarding appears; no sample businesses auto-import |
| 05 | Complete new business registration | Generated practice reference appears on business header |
| 06 | Inspect Firestore | Registry and normal business documents exist under that Firebase UID |
| 07 | Save transaction / invoice | Survives refresh, sign out/sign in, and cloud sync |
| 08 | Close app and go offline | Previously signed-in account and locally cached business still work |
| 09 | Reconnect | Offline changes are uploaded when Firestore becomes available |
| 10 | Check Compliance Hub | Shows practice registration; **not** CIPC verified |
| 11 | Check other modules | Growth Passport, SmartShield, Journey, Intelligence, Marketplace and Procurement still load |
| 12 | Attempt cross-account Firestore read | Access denied by security rules |

## Notes and production limitations

- A practice registration reference does not reserve a company name or establish company registration in South Africa. This is a guided simulation for a hackathon.
- Client-side practice registration is account-owned but NOT authoritative or fraud resistant. Replace it with secured backend verification and authorised CIPC APIVerse integration before deploying it as a real government registration service.
- Local browser/device cache should not be treated as encrypted storage. Protect devices, use Firebase rules, and apply POPIA requirements for real user information.
- Firebase cloud sync requires internet; previously cached signed-in user data continues working offline. No local FastAPI server is needed for this version.
