# SmartGrowth v1.2.1 — Team Meeting Refinement (21 October 2026)

This upgrade is built on `SmartGrowth-v1.2-Business-Compliance-Full.zip` (the team's existing V1.2 source). **Do not delete or reset your existing Firestore or device data.** Back up before installing or deploying. This is a source update, not a precompiled APK or a deployed website.

## What has changed

1. **Login ➜ Home.** Successful Firebase account creation/login navigates to Home and opens the signed-in private workspace. Authentication-state restoration also opens Home. Existing Firebase credential handling and private record sync are preserved.
2. **Market Links.** The page now shows listings created by other businesses in the same workspace. Offers can be *explicitly* published to the shared `marketListings` Firestore collection; signed-in users of other accounts can browse them. Nothing in `/users/{uid}/businesses` becomes public. Only name of business, business category, province and chosen offer/price/description are shared. The publishing user's private data remains private. Publishing requires online authentication and deployed marketplace Firestore rules.
3. **Procurement.** Fetch-on-first-visit when online and no cache exists; set the default window to 30 days; request explicit `PageSize=50` (as supported by Treasury's API specification); keep manual refresh and cache fallback; expose useful browser/network/CORS error details. Native Android uses Capacitor HTTP. For hosted browsers, configure the supplied Cloudflare Worker proxy and build with `REACT_APP_TREASURY_PROXY_URL`. The public Treasury API's availability cannot be guaranteed by local tests. The source is never replaced by fictional records.
4. **Demo-only registry check.** Simplified the Compliance screen into a fictional company registry lookup based on *both* company name and 2026/XXXXXX/XX number. It recalculates whenever details change. Results are explicitly labeled **DEMO**, **no demo match** or **name mismatch**, never official CIPC verification. Sole proprietor option states this check may not apply. Business source records are not sent externally.
5. **Ask SmartGrowth chatbot.** Replaces the old Intelligence and overlapping Growth Advisor *navigation* sections. Handles app FAQ/help and open-page actions, plus private selected-business financial questions using the already tested deterministic insights engine. Monthly goals and expense budgets remain editable here. **This is a local scripted chatbot—not OpenAI API or generative AI.** It runs offline. The old Intelligence module remains in source for backward compatibility but is not in navigation.
6. **Modern icons and notifications.** Standardised primary navigation and major quick actions using Lucide SVG icons. New bell/notification page shows selected-business overdue invoices, budget issues, missing recent records, verification reminder and listing reminder. Notifications update in-app and work offline; this release does **not** send OS push notifications.

## First deployment — important order

From the extracted `SmartGrowth-Mobile` source:

1. **Back up all device records** using More → Export data; check online account sync before uninstalling old Android apps. Preserve your current `frontend/.env.local` and Firebase project settings.
2. Install dependencies: `cd frontend && npm install --legacy-peer-deps`.
3. Run tests from the **project root**: `node --test tests/*.test.mjs` (55 current tests).
4. The package includes the updated rules in **both** `firestore.rules` and `frontend/firestore.rules` (identical). Since `frontend/firebase.json` includes the Firestore rules declaration, deploy from **frontend**: `firebase deploy --only firestore:rules --project smartgrowthmobile`. This changes the same rules in your existing project. Review before deploying to production.
5. For shared market visibility, create an offer under More → Market Links; **sign in to your Firebase account** and choose Publish. If publishing reports "permission denied", ensure the business has already synchronised and confirm the new rules have deployed.
6. For a hosted website and Treasury live data, deploy the optional Cloudflare Worker after configuring its `ALLOWED_ORIGIN` variable as the **exact** HTTPS origin of your SmartGrowth site (for example `https://YOUR_HOSTING_DOMAIN`). From `cloudflare`, run `npx wrangler deploy`. Put the actual Worker HTTPS URL (without query string) into `REACT_APP_TREASURY_PROXY_URL` in `frontend/.env.local` or the GitHub Actions repository variable, then **rebuild**. Do not paste a made-up Worker URL into the app. If not configured, web builds still try direct public API access but can be blocked by CORS. On Android, Capacitor uses native HTTP directly.
7. Build the website with `npm run build` and deploy hosting with `firebase deploy --only hosting --project smartgrowthmobile`, or use the existing build scripts.
8. For Android, rebuild using the existing GitHub Actions Android workflow; a web/hosting deploy does not update an installed APK.

## Functional/UAT test checklist

- **T01** Firebase sign-in returns to Home; business selector shows account-specific cloud businesses.
- **T02** User A cannot see User B private transactions, invoices, or full business profiles.
- **T03** Add an offer in business A, switch to business B in the same workspace and view A's offer under *Other businesses in your workspace*.
- **T04** User A explicitly publishes an offer; User B signs in on a second device and sees it under *Explore other businesses*. User B never sees private financial data. Unpublish removes it.
- **T05** Test procurement online via Android, and hosted web via deployed Worker. Successful retrieval is dated and labelled official; network failure is labelled unavailable or cached.
- **T06** Use sample company `Litha Catering (Sample)` and sample number `2026/000001/07` in Verify Business. Result must say fictional DEMO match.
- **T07** Change the number or name to something else; simulated match disappears automatically. Do not treat "no match" as a genuine CIPC result.
- **T08** Ask SmartGrowth "How is my business doing?" and "How do I create an invoice?"; answer must refer to selected business, with working in-app navigation.
- **T09** Set monthly expense budget, add an expense above that budget, and check the notification bell.
- **T10** Repeat previous 10/10 V1.1 UAT scenarios; check offline storage, account switching, invoice payments and records after updates.

## API and privacy notes

- CIPC checking is simulated using local fictional fixtures (`demo-verification.mjs`); **no official CIPC API has been integrated**.
- External Treasury records come from the public OCDS API only; successful remote responses and real-world availability must be validated in your own environment. Official API: https://ocds-api.etenders.gov.za/swagger/index.html. Publication limitations: https://data.etenders.gov.za/Home/LearnMore.
- The new `marketListings` Firestore collection is readable by authenticated users only. Users decide which private offers to publish. Owner-only creates, updates, and deletes are enforced by the new Firestore rules, which validate that the private business exists under the same user. Treat user-written offer details as self-reported, not officially verified.
- Notify the team that notifications are in-app and not background Firebase Cloud Messaging.
- No OpenAI/ChatGPT API key should be placed in the mobile React source. Future generative AI requires a protected server-side integration and user privacy review; it has **not** been enabled here.

## Test evidence / remaining verification

- **55/55 Node tests passed**, including 5 new V1.2.1 team-refinement tests and existing cloud sync/intelligence/Treasury tests.
- React JSX syntax parsed with the TypeScript parser.
- **Not verified in this environment:** npm dependency installation, production React bundle, Firebase security rules deployment/emulator checks, authenticated multi-device publish flow, live Treasury requests through your actual Worker and Android APK runtime. Those need the deployment/testing steps above.
