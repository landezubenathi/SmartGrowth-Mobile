# SmartGrowth v1.3 — tester preparation

Open `docs/SMARTGROWTH_V1_3_TESTER_RELEASE.md` for important steps. **Deploy Firestore rules first**, otherwise shared marketplace publishing and reading will fail even when Hosting updates successfully.

## Web
`cd frontend && npm install --no-audit --no-fund --legacy-peer-deps && npm run build && firebase deploy --only firestore:rules,hosting --project smartgrowthmobile`

## Android
Push source to GitHub and run the existing Android debug build workflow. Download `smartgrowth-debug-apk` artifact.

## CIPC
Five fake demo entries are listed in the guide for tests, never for real compliance confirmation.

## Treasury
In the hosted browser, use the Cloudflare Worker proxy and configure its URL. Live connectivity remains to be tested.
