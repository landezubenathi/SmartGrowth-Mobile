# SmartGrowth v1.7.5 — Security hardening and open risks

**Base:** v1.7.4 POPIA consent copy. **Scope:** non-disruptive configuration and development improvements. **No changes** to registered demo accounts, screens, Firebase cloud document formats, Firestore rules, or simulated business registration.

## Implemented

1. Firebase Hosting supplies `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, and a minimal restrictive `Permissions-Policy`. HTML and service-worker responses have revalidation headers. Existing offline caching remains enabled.
2. Removed unused direct `axios` from `frontend/package.json` (no import in the v1.7.4 source). **Regenerate the lockfile in your real repository**, commit it, run `npm audit`, and rerun Semgrep; old supply-chain warnings remain until dependency graphs are updated.
3. Optional local Python demo API no longer contains default passwords. Seeding now needs `SMARTGROWTH_SEED_DEMO=1` and two separately supplied developer environment passwords. **Previously seeded passwords already saved in an existing SQLite database are not changed by this patch**; rotate or recreate these records before real use.
4. SQL export script now uses fixed SQL statements with bound `user_id` parameters (addresses the Semgrep SQL composition warning).
5. Android GitHub Actions checkout does not retain repository credentials in git configuration. The CI workflow now uploads a non-blocking npm audit report; Dependabot can offer npm and GitHub Actions updates.

## Not yet cleared or proven safe

- **Firestore tenant isolation requires real testing**: use Firebase Emulator Suite rules unit tests or two distinct throwaway demo users and confirm user B cannot read, write, or list user A's business documents, registry records or private data. The existing owner-based rules have **not** been modified or redeployed here.
- **Offline data at rest is not encrypted**: SmartGrowth stores device workspace and user-scoped cache in `localStorage`; Firestore offline persistence caches records in IndexedDB. Sign-out **does not erase** those stores. Use device access controls and never use actual customer or banking details on shared demo devices. Redesigning this safely requires a dedicated data-migration/UX release, not a silent storage swap.
- **Frontend Firebase config is not a secret**; never place service-account JSON, privileged API keys, or account passwords in `REACT_APP_*`, `VITE_*`, public assets, or GitHub repository files.
- **Remaining dependency CVEs**: Semgrep supply-chain CSV includes 90 findings, many transitive and development-only. This ZIP has no `package-lock.json` so the exact affected resolutions cannot be updated or regression-tested here. Avoid `npm audit fix --force` because React Scripts 5 and Firebase compatibility could break.
- **CSP, App Check, account MFA, token/session behavior, and at-rest encryption** need end-to-end staging tests before enforcement. Hosting headers added here do not claim to stop XSS by themselves.
- **Mutable GitHub Actions tags** remain until **verified, trusted full commit SHA pins** are chosen. Dependabot monitoring and credential restrictions do not fix that scanner warning. Treat remaining Semgrep alerts as open.
- Optional legacy FastAPI uses local SQLite and browser-stored bearer tokens; not a production-grade server. The hosted Firebase version remains the supported demo architecture.
- Hosted SmartGrowth is **not automatically updated** by ZIP download; you must review and deploy. For Hosting settings, deploying web files alone is insufficient to change Firestore rules; they deploy separately and remain unchanged here.

## Safe adoption steps on Windows (PowerShell)

1. Back up your latest source and local/offline workspace data. Do not delete `frontend/.env.local` or your existing `frontend/package-lock.json`.
2. Apply the included patch paths to the **same v1.7.4 codebase**. The full ZIP is provided for comparison/testing, not an instruction to overwrite uncommitted work.
3. `cd frontend`, run `npm install --legacy-peer-deps` and then `npm audit --omit=dev` to inspect production dependencies. Commit the regenerated `package-lock.json` in Git (do not copy an old version from a different project).
4. From the root run `node --test --test-concurrency=1 tests/*.test.mjs` and `python -m pytest -q tests/test_auth_integration.py` (only if Python dependencies are installed).
5. Check account sign-in, practice registration, invoices, Treasury data, cloud sync/offline recovery and marketplace with new test accounts. Validate Firebase rules separately with the Emulator Suite.
6. Deploy Hosting only after validation: `cd frontend` then `npm run build` and `firebase deploy --only hosting --project smartgrowthmobile`. **Do not deploy to production until the security checks and functional tests are satisfactory.**

## Local Python demo seeding example (PowerShell, developer-only)

```powershell
$env:SMARTGROWTH_SEED_DEMO = '1'
$env:SMARTGROWTH_DEMO_PASSWORD = '<supply-your-own-unique-password>'
$env:SMARTGROWTH_BUYER_PASSWORD = '<supply-another-unique-password>'
```

These variables are for the optional local Python API, not Firebase Authentication. For SmartGrowth Firebase demo accounts use the registration screen and new email addresses; no shared passwords should be committed to Git.
