# SmartGrowth: accounts, data and Android testing

This is the **account-enabled local pilot**, built on the working SmartGrowth Mobile codebase. It is **not** the original SmartFund funding-provider system.

## Run on Windows

1. Back up the old SmartGrowth folder and any `backend/data/growth_demo.sqlite3` before replacing files.
2. Extract this ZIP to a **new** folder.
3. If you have existing data, **stop the old backend first** and copy `backend/data/growth_demo.sqlite3` to the same relative location in the new folder.
4. Run `START_SMARTGROWTH_WINDOWS.bat` (requires Python 3.10+, Node 22+).
5. Open `http://localhost:3501`. Unlike the previous shared demo, you now see **Sign in / Create account**.

The Windows launcher opts into seeding **local-only** test accounts. If you start the backend manually, use the environment variable `SMARTGROWTH_SEED_DEMO=1` only for local testing, e.g. PowerShell: `$env:SMARTGROWTH_SEED_DEMO="1"` before `python -m uvicorn main:app --host 127.0.0.1 --port 8000`.

## Test credentials

| Account | Email | Password | Data owner |
|---|---|---|---|
| Existing demo entrepreneur | `demo@smartgrowth.local` | `SmartDemo!2026` | `demo` (your existing Phase 1 data remains here if migrated) |
| Second demo entrepreneur | `buyer@smartgrowth.local` | `BuyerDemo!2026` | `buyer` (separate records) |

**These are shared local test credentials. Never enable demo seeding when hosting publicly.** They are deliberately documented in this demo package. Don't enter real financial or customer records in these test accounts.

To test an individual entrepreneur, select **Create account** and use a unique email and 10+ character password. That account gets its own ID and separate persistent SQLite records. The database stores salted PBKDF2 password hashes, not plain-text passwords. Sessions expire after seven days or after sign out; password changes revoke sessions. There is no email verification or forgot-password email flow yet.

## Test account separation

1. Sign in as `demo@smartgrowth.local`, create an invoice or transaction, and review the Passport.
2. Sign out under **Account**.
3. Sign in as `buyer@smartgrowth.local`; the first user's bookkeeping and invoices must **not** appear.
4. Create a separate business profile and invoice as the second user.
5. Sign out, return to the first account, and confirm its data remains intact.
6. Test a new registration, password change, refresh and sign-out.

**Marketplace exception:** Business listings intentionally appear in the shared community catalogue to other signed-in users. Private financial records, business profiles, advisor tasks and incoming enquiries are account-scoped.

## Phone (Android Chrome over USB, no Android Studio required)

Run the app normally on your PC. With USB debugging and ADB available, execute:

```powershell
adb devices
adb reverse tcp:3501 tcp:3501
adb reverse tcp:8000 tcp:8000
```

Open `http://localhost:3501` on your phone, sign in and use SmartGrowth. If needed, choose **Backend connection settings** on the sign-in screen and set `http://localhost:8000` (ADB port forwarding is what makes phone-localhost work). Keep the USB cable and both PC servers active. This is a browser experience, not yet a standalone APK.

## Android APK for each code update

- On Windows with Android Studio/SDK: double-click `BUILD_ANDROID_WINDOWS.bat`, then run a debug build from Android Studio.
- Without Android Studio: push this project to GitHub with the repository root containing `frontend/` and `.github/`, select **Actions → SmartGrowth Android debug build → Run workflow**, then download the **smartgrowth-debug-apk** artifact from the successful run. This is an automated build recipe; it hasn't been executed in this environment.

The **installed APK still requires a running FastAPI server** reachable via HTTPS, or a carefully configured development connection. Building the frontend into an APK **does not embed Python/SQLite**. Android's installed WebView may block HTTP calls without explicit development configuration. For the hackathon, Chrome + ADB is the confirmed working device test route. For a remotely usable app, deploy and secure FastAPI and a durable managed database behind HTTPS.

## Preserve data when upgrading

The app keeps all user accounts, session hashes, business profiles, invoices, sales, expenses, documents and advisor progress in `backend/data/growth_demo.sqlite3`. Never overwrite this file during source upgrades. Use `BACKUP_SMARTGROWTH_DATA_WINDOWS.bat` to generate a consistent copy in `backups/` and store backups securely. Protect the source database and its backups.

## Security and readiness limits

This is an **authenticated prototype**, not a production-certified fintech system. Do not publicly expose this server without: HTTPS, deployment configuration, secure credential rotation, email verification and recovery, robust abuse protections, privacy notices/consent and retention/deletion controls, proper access audit, managed database and backup, security review, and POPIA compliance. Token storage uses browser localStorage for local demo convenience; native secure storage and a stronger web session strategy are recommended before production. Payments remain simulations; CIPC/SARS checks are self-declared; tender catalogue is fictional; fraud detection and Advisor are explainable rules, not live generative AI. No real funds move.
