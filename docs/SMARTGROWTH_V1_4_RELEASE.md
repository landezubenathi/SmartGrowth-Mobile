# SmartGrowth v1.4 – Tester release (2026-10-21)

## Changes
- Modern inline SVG icons replace emoji-based core navigation and action icons; no new package required.
- Keep one personalised **My Intelligence** destination; older `advisor` in-app links redirect to Insights.
- **Stay protected** now has independent milestones: scan a message, learn fraud warnings, review official contact checks and review the scan. Scans save only counts, risk level and dates to the selected business; pasted messages are never stored.
- Floating assistant now offers six tap-to-ask FAQs and supports typed messages. Responses are local, rule-based, and account/business-specific.
- More page has a concise app version and an About information section. Technical configuration instructions live here.
- Signed-in workspaces automatically cache changes to the device and Firestore queues the writes until connectivity returns. A separate device/cloud workspace switch has been removed from More to simplify navigation. Existing signed-out local data remain distinct and **are not automatically uploaded** to someone else's Firebase account. Initial sign-in requires internet.
- Procurement practice brief titles no longer start with “Example”. They remain separated from real National Treasury records.
- Treasury connectivity displays a friendly warning and shows the underlying detail only on request. Real API connectivity has not been independently verified for this release.

## Apply the ZIP safely
1. Back up your whole working SmartGrowth project and export any business-only records you cannot afford to lose.
2. Extract the **patch contents inside your existing SmartGrowth-Mobile folder** (it contains frontend/, tests/, docs/, cloudflare/, .github/). Merge and replace matching files. Or use the full ZIP in a new folder.
3. Keep your existing `frontend/.env.local` file. Never commit service-account private keys, credentials or Firebase admin keys.
4. From the `frontend` directory, run `npm install --no-audit --no-fund --legacy-peer-deps`, then `npm run build`.
5. To update your hosted web app, run `firebase deploy --only hosting --project smartgrowthmobile` from `frontend/`.
6. Commit the upgraded files and push to the GitHub **main** branch. GitHub Actions → SmartGrowth Android debug build → Run workflow. Download `smartgrowth-debug-apk` artifact from the successful run. A website deployment does not change already installed APKs.

## GitHub red build (55 tests, 54 passed)
- The posted log ends with a summary of 54 passed / 1 failed but omits the actual `not ok` block. The exact cause cannot be established from that excerpt. The source ZIP passes its entire suite locally.
- The updated workflow runs the tests sequentially and uploads `smartgrowth-test-results.log` as an artifact even when the step fails.
- If it fails again: open Actions → failed run → `Validate standalone calculations`; search for `not ok` and view its assertion/diff. Download the `smartgrowth-test-results` artifact and send that full failure. The `punycode`, npm deprecation, and setup-java v4 warnings were not the demonstrated cause.
- The workflow now uses `actions/setup-java@v5` and test-concurrency=1.

## National Treasury: Android versus Firebase website
- Both can access the published public API, but **browsers may block direct fetch via CORS**. The Android Capacitor APK uses native HTTP, bypassing browser CORS. Success on an older APK does not guarantee the browser build can fetch it.
- The web deployment requires a CORS-enabled proxy. An optional Cloudflare Worker is already in `cloudflare/` and needs to be deployed before the website can use it. National Treasury may also be unavailable or change its response shape.
- Install Wrangler or use `npx wrangler` from `cloudflare/`. Log in with `npx wrangler login`, then `npx wrangler deploy`. `cloudflare/wrangler.toml` permits the two Firebase Hosting origins, without exposing business data to the Worker.
- Copy the Worker HTTPS address (for example `https://smartgrowth-treasury.<your-worker-subdomain>.workers.dev`) into `frontend/.env.local` as `REACT_APP_TREASURY_PROXY_URL=https://...` **without a trailing slash**. Rebuild (`npm run build`) and redeploy Hosting. No Firebase server or local FastAPI is needed. The exact Worker URL is assigned by Cloudflare; do not guess it.
- Set the same `REACT_APP_TREASURY_PROXY_URL` value under GitHub Repository → Settings → Secrets and variables → Actions → **Variables** to keep web and APK build settings in step, even though Android calls Treasury natively.
- The live-feed screen never substitutes practice briefs as official results. Check the source date, specific document link, deadline and availability on https://www.etenders.gov.za/.
- If hosted refresh still fails: open your browser DevTools → Network; check the Worker request status. A 403 usually means the Origin is not allow-listed. A 502 usually means the upstream source is failing or returning unexpectedly. If direct calls are blocked, test the Worker HTTPS URL after deploying.

## User acceptance tests – do these before sending to testers
1. On Chrome Android/web, Home/Bottom navigation/More icons display as line icons rather than emojis.
2. Sign into Firebase while online, disconnect, record an expense, reconnect, verify it appears in Firestore and on another device.
3. Switch businesses: personal intelligence, protection progress and chat histories stay separate.
4. On Journey choose **Stay protected**. It must show distinct fraud milestones (not the same growth tasks).
5. On SmartShield scan suspicious text and confirm Journey progress changes. Check a low-risk message and verify it is not called conclusively safe.
6. Open floating assistant on several pages and try FAQ chips, a typed question, and scrolling to the newest message.
7. Open **More**: only one Insights shortcut, friendly app version, no device/cloud mode switching action.
8. Check 2 account logins, bookkeeping, Passport, invoices, shared marketplace and Firestore rules.
9. Review procurement practice brief titles, separated from the official source.
10. Online, fetch Treasury source. Then go offline and check saved records. A failed external request should not manufacture live results.

## Data and privacy boundaries
- Fictional registry matching is not CIPC verification. Keep the accurate “Demo registry match — not CIPC verified” indicator in the business context; the More → About information screen explains the practice data.
- Real purchases and bank transfers are not processed. “Mark paid” records the business owner's declaration; do not treat this as a verified payment receipt.
- Local cached records may not be encrypted. Device screen lock, secure account rules and backup precautions still apply.
- An Android APK still needs online access for *new* Treasury records and Firebase sync; it does not need the PC, USB or local FastAPI.
