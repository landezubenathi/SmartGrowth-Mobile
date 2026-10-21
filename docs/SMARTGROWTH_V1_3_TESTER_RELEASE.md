# SmartGrowth v1.3 — urgent tester release

This patch is built on the team's v1.2 Business Compliance project. Keep existing Firebase, business and account records. **No local FastAPI server is needed** for the standalone web/APK mode.

## What changed

1. **Floating SmartGrowth assistant:** available on all SmartGrowth screens, including Money, Home, Compliance, Marketplace and Opportunities. Conversation panel has independent vertical scroll, an anchored message form, safe-area and keyboard sizing, and separate on-device history for each business/account. It gives rules-based answers from **the selected business only**, not an external generative-AI model.
2. **Fictional company registry matching:** name, province and enterprise number must all match one of five **invented** examples. The result says **Demo registry match — NOT officially CIPC verified**. This cannot be used as compliance evidence. Real CIPC verification would need an approved server-side APIVerse integration.
3. **Shared public marketplace:** private drafts can be explicitly Published or Unpublished by signed-in cloud users. Offers appear in the `marketplace` Firestore collection and to other signed-in accounts. Device-only drafts remain private. Public fields include only business name, product/service, province, industry, description and price. Never include contact details in the description.
4. **Treasury diagnostic and document handling:** readable timeout/CORS/proxy messages, 30-day default, cached official records, and links to genuine HTTPS documents **only when supplied within the OCDS data**. The app cannot make an upstream API respond if Treasury is down; the eTender portal remains the fallback. To fetch via a hosted web page, deploy the Cloudflare Worker and set a public environment variable for its URL.

## Five invented CIPC-style verification test records

These records are completely fictional and are only for demonstrating record matching. They are NOT CIPC records. The app **never** claims they are official approvals.

| Fictional company name | Fictional number | Province | Industry |
|---|---|---|---|
| Litha Catering Studio | 2026/840201/07 | Eastern Cape | Catering |
| BrightCode Digital Services | 2026/840202/07 | Gauteng | Technology |
| Makhulu Fresh Produce | 2026/840203/07 | Limpopo | Agriculture |
| Ubuntu Home Repairs | 2026/840204/07 | KwaZulu-Natal | Construction |
| Sisonke Beauty Collective | 2026/840205/07 | Western Cape | Beauty & Wellness |

To test a match: **My Businesses → Add another business**, enter one company name, its matching province and fictional registration number. Open **More → Business compliance**. The banner should say *Demo registry match — simulated only*. Change **one digit** or the province: it should say *No match in the fictional registry*, which is not a real CIPC finding. The main screen no longer displays a list of example registrations to choose from.

## MUST-DO steps before testing shared Market Links

This upgrade adds a new `marketplace` collection. Existing v1.2 Firestore rules deny all access to that collection until updated.

1. Back up your current SmartGrowth repository and business records. Extract the patch at the repository root, replacing matching files.
2. In `frontend`, run `npm install --no-audit --no-fund --legacy-peer-deps` and `npm run build`.
3. Run `firebase deploy --only firestore:rules --project smartgrowthmobile` **from `frontend`**, or copy the entire `frontend/firestore.rules` into Firebase Console → Firestore Database → Rules → Publish. Review the new shared-public-data permission before publishing; it exposes published listing details to anyone who queries the collection.
4. Publish the website: `firebase deploy --only hosting --project smartgrowthmobile` from `frontend`.
5. Sign into **Cloud account & sync** using Account A, open the cloud workspace, save a listing and click **Publish**. Ensure you see a success status, then check Firestore → `marketplace` for a new doc.
6. Sign into Account B in another browser/phone, open the cloud workspace → **Market Links**, and confirm Account A's offer is visible. Publish another offer from B. Return to A and confirm B's offer is visible. Try **Unpublish** from the owner account.
7. Sign out and use device-only mode: a local listing remains a private draft, not publicly listed.

The app's Firestore query selects only documents whose `status == 'published'`. These rules preserve owner-only private `users/{uid}/businesses/{id}` records.

## National Treasury web refresh (may need setup)

The Treasury service is a real third-party endpoint. **Web browsers can be blocked by CORS or upstream outages.** The project includes `cloudflare/treasury-worker.js` as a serverless, restricted public-data relay. This isn't activated merely by deploying Firebase Hosting.

1. Open a Cloudflare account, install/launch Wrangler: `npx wrangler login`.
2. Open `cloudflare/wrangler.toml` and ensure `ALLOWED_ORIGIN` is your actual production origin. Default is `https://smartgrowthmobile.web.app`.
3. From `cloudflare`, run `npx wrangler deploy`. Copy the **HTTPS worker URL** returned.
4. In `frontend/.env.local`, set `REACT_APP_TREASURY_PROXY_URL=https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev` (replace with the actual URL). Build and deploy Hosting again. For GitHub Actions, add `REACT_APP_TREASURY_PROXY_URL` under repository **Variables** and build an updated APK as needed.
5. Reopen SmartGrowth → Procurement → Fetch official data. The portal may return zero records or be temporarily unavailable; do **not** claim this feature works live until a real retrieval succeeds on your target device.

The installed Android APK attempts native HTTP directly; the Worker is intended primarily for browsers. The only information sent to the Worker is the requested publication dates and page number, **not private user data**.

### Fast acceptance checklist (must test in production)

- [ ] Every page has a floating assistant; open it on a small phone, send two messages, and verify the most recent response and composer stay visible.
- [ ] Switch to a different logged-in Firebase account; previous account's assistant history is not displayed.
- [ ] A fictional registry match shows explicitly simulated/non-official status; a mismatch is never declared unregistered by CIPC.
- [ ] Create a real-format business profile without being forced to choose an example.
- [ ] Cloud Account A can publish, Account B can see, and owner can unpublish an offer.
- [ ] Listing descriptions do not display private email addresses or financial records unless a user typed them into a public description.
- [ ] Device-only mode is still available without internet.
- [ ] Treasury shows official documents only when actually supplied, otherwise an official portal link; refresh failure explains likely reason.
- [ ] Existing Passport, bookkeeping, insights, invoices, Firebase records and Android mode still work.

### Updating Android

Commit and push this source, run the `SmartGrowth Android debug build` workflow, and install the new APK. The Firebase Hosting deployment **does not update an existing APK**. If signing keys change, back up/sync before uninstalling an older debug APK.

## Verification evidence

- Existing and new pure JavaScript tests: `node --test tests/*.mjs`.
- Parse checks: TypeScript compiler parser over JS/JSX (not a full React production build).
- Full React build and live Firebase marketplace / Treasury networking were **not** run in the offline build environment. Validate them against your own Firebase project, hosted site, and phone before submitting.
