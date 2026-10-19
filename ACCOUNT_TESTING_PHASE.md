# SmartGrowth — Phase 2 account and mobile UAT

Run the Windows launcher; open http://localhost:3501 on your PC or Android Chrome via USB with ADB reverse ports 3501 and 8000.

| Test | Action | Expected |
|---|---|---|
| A01 | Sign in as `demo@smartgrowth.local` | Dashboard opens; old demo transactions are visible **if** old SQLite file was migrated |
| A02 | Refresh page, close and reopen browser tab | Account remains signed in, until session expiry or sign-out |
| A03 | Record an income entry | Bookkeeping and Growth Passport update for this account |
| A04 | Sign out and sign in as `buyer@smartgrowth.local` | First account's private transactions and invoices are not visible |
| A05 | Create buyer's business profile and invoice | Buyer records persist and do not alter demo account |
| A06 | Create a new account with a unique email | New user has their own empty business workspace |
| A07 | Try registering with an existing email | Clear duplicate-account error, no second account created |
| A08 | Go to Account and change password | Current session revoked, new password works and old password doesn't |
| A09 | Sign in as demo, visit My Journey and select a goal; switch account | Journey goal selection is separate for each account |
| A10 | Switch between Home, Journey, Money, Passport and Account on Android | Touch navigation works; no blank page |
| A11 | Create invoice, simulate payment twice | Exactly one bookkeeping income record is added |
| A12 | Stop and restart both servers without deleting SQLite file | Accounts, records, invoices and advisor progress persist |
| A13 | Use ADB reverse, open Chrome http://localhost:3501, sign in | Android phone can reach both frontend and backend over USB |
| A14 | Open SmartShield, Procurement and Market Links | Rule-based scan and fictional opportunities still work |

If A01 fails after migration, stop both servers and confirm the **old data file** is at `backend/data/growth_demo.sqlite3` before restarting. This file is also where new accounts are now stored. Never replace it when upgrading or you will lose newly created accounts.

The debug APK (if built separately) still needs a secure reachable API service; the Android browser + ADB test is the simplest local device demonstration.
