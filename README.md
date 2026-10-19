# SmartGrowth — Your Business Journey (Account-enabled Mobile Pilot)

**Four Horsemen Tech · Android / iOS-capable React + Capacitor / Web + FastAPI**

SmartGrowth is a standalone entrepreneur growth companion, separate from the legacy SmartFund funding platform. It provides per-account authentication, personal business records, a goal-driven Journey, Growth Passport, Bookkeeping, invoices, registration guidance, rule-based SmartShield, marketplace, fictional procurement practice and a 30-day Growth Advisor.

**Getting started:** Read [`SMARTGROWTH_ACCOUNTS_AND_ANDROID.md`](SMARTGROWTH_ACCOUNTS_AND_ANDROID.md). On Windows run `START_SMARTGROWTH_WINDOWS.bat`, then visit http://localhost:3501. Local demo login: `demo@smartgrowth.local` / `SmartDemo!2026`.

## Key design

- **Individual accounts:** register/sign in, salted PBKDF2 passwords, hashed 7-day session tokens; server blocks cross-account record access.
- **Data persistence:** a SQLite database at `backend/data/growth_demo.sqlite3`, shared by modules but scoped by account.
- **Mobile:** touch-friendly layout, bottom navigation, Capacitor Android/iOS configuration and repeatable Android debug-build GitHub Actions workflow. No APK is included in this ZIP.
- **Convenience:** stay signed in across refreshes, Account page, password change, one-tap navigation to Money, Passport, Journey and Home.
- **Continuity:** old demo records can be migrated by copying the SQLite file while both apps are stopped.

This is a **local pilot**, not a production-ready service. Never treat demo payments as real or use the fictional tenders as real opportunities. No generative AI API is connected.
