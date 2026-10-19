# SmartGrowth — Your Business Journey

**Four Horsemen Tech | Independent mobile-first hackathon demo**

SmartGrowth is the new standalone entrepreneur-focused version of our growth tools. **The previous SmartFund funding platform has not been imported into this new app.** Keep that project separately if funding-provider integrations are desired later.

## What works

- **Home:** Current Growth Passport, recorded cash surplus, Journey milestone progress, next action and tool shortcuts.
- **My Journey:** Choose Start, Manage Money, Get Business-Ready or Grow My Business. Milestone completion reads your actual demo activity.
- **Growth Passport:** Automatic signals from profile, invoices, income and expense activity; separate *self-declared* documents. **Not a credit score.**
- **Bookkeeping:** Add income/expenses and review stored history and surplus.
- **Invoices:** Create demo invoices. **Simulated** payment creates one bookkeeping income entry, never a real payment.
- **Registration:** Guided business profile + self-declared checklist. Links to external official sites are guidance, not integration.
- **SmartShield:** Local rule-based message warning-sign checker. A clean result does not prove legitimacy.
- **Market Links:** Add demo product/service listings and simulate buyer enquiries.
- **Procurement:** Fictional matches for demonstration; not live tenders.
- **Growth Advisor:** Explainable record-based insights, four-week growth sprint, reviewed tasks, what-if calculations and text export.

## Run on Windows

1. Install **Python 3.10+**, **Node.js 22+** and npm.
2. Extract this ZIP to a new location (don't overwrite your working SmartFund project).
3. Double-click **`START_SMARTGROWTH_WINDOWS.bat`**, or start manually:

   Terminal A:
   ```powershell
   cd backend
   python -m pip install -r requirements.txt
   python -m uvicorn main:app --host 127.0.0.1 --port 8000
   ```
   Terminal B (from project root):
   ```powershell
   cd frontend
   npm install
   npm start
   ```
4. Open `http://localhost:3501`. Select **Explore SmartGrowth**.
5. The demo uses `user_id=demo` and **does not have a real sign-in system**. No password is needed. **Do not enter sensitive data or put this backend on the public Internet.**
6. Backend check: `http://localhost:8000/health`; advisor check: `http://localhost:8000/api/growth/advisor/demo`.

### Keep your Phase 4 demo data

Stop both backend servers. **Copy** `backend/data/growth_demo.sqlite3` from your older Phase 4 folder into `backend/data/growth_demo.sqlite3` in this new folder. Keep a separate backup first. This is the same SQLite schema and the new app uses the same demo user ID (`demo`). The old project is not changed.

### Android with USB, no Android Studio needed (phone browser)

1. Start backend and frontend on your PC.
2. Enable USB debugging on Android and connect a data cable.
3. Download Android **SDK Platform-Tools**; add ADB to your PATH or run in `C:\platform-tools`:

   ```powershell
   .\adb devices
   .\adb reverse tcp:3501 tcp:3501
   .\adb reverse tcp:8000 tcp:8000
   ```
4. Visit **`http://localhost:3501` on your phone** (while USB is connected).
5. Under **My Journey → Backend settings**, use `http://localhost:8000` if API calls fail.

The previous SmartFund PWA/service worker is intentionally not reused, to avoid old brand assets and cached routes.

### Android APK / iOS

Run `BUILD_ANDROID_WINDOWS.bat`. Requires Android SDK/Android Studio to generate and compile an actual APK. iOS requires macOS and Xcode (or a supported remote build process). Capacitor files configure a native project, but **this ZIP does not contain a built or tested APK/IPA**. The installed native app **does not include the Python backend**. Use HTTPS to a properly secured hosted backend for any production-like device demonstration, and add production-grade authentication and per-account authorisation before hosting.

## Existing data and security

This is **not production-ready**: a shared demo user, client-provided user IDs and a local SQLite file. No isolation between real users, no verified company registrations or banking integrations, no real payment processing, and no generative AI API. The rules-based advisor and SmartShield can help explain a demo, not provide professional financial advice or safety guarantees.

## Removed from the new app

The old SmartFund funding-provider portals, government intelligence dashboards, system-admin dashboards, role-selection/login flows, funding application handling, historical funding catalogue, unused legacy React components and old funding platform API. Funding may be added later as an optional independently secured integration.

## Quick UAT

1. Start web, enter demo, open Home and Journey.
2. Create business profile in Growth Tools > Registration. Refresh Journey; profile milestone completes.
3. Create an unpaid invoice; first invoice milestone completes, but income does not increase.
4. Simulate invoice payment; bookkeeping income increases once, Growth Passport activity reflects it. Repeat simulated payment and confirm no double-count.
5. Record an expense. Return to Home and Advisor; surplus changes and advice reflects records.
6. Tick a **genuinely held** external document; Passport self-declared section changes, not proof of official verification.
7. Use SmartShield, create a market listing, check procurement sample opportunities and complete an Advisor review task.
8. Navigate using bottom tabs on Android. Confirm no dead funding-platform links.
