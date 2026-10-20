# SmartGrowth — National Treasury API & offline usage

## What we chose for this release

**National Treasury API integration first.** The open-data opportunity source does not need your Firebase project. Online account authentication is still the existing FastAPI account mode, **not Firebase**. These data modes are **not automatically synchronised**.

## Offline use, Wi-Fi and USB

* The standalone interface, local Journey, Passport, bookkeeping, invoices, fraud text rules, sample briefs and previously cached external results work offline after an Android APK is installed.
* The first launch and later launches of the installed APK do not require USB or the development computer. USB/ADB is only needed when you browse the React development server rather than installing an APK.
* The standalone session persists in the app's local storage. This is **not secure offline password authentication**. Device PIN/biometrics can provide basic physical-device protection, but these do not secure app storage themselves.
* Signing in to a FastAPI account requires a network connection to the hosted server. Accounts and on-device data do not sync; an offline startup cannot validate new credentials.
* Cached procurement and Live Insights may be consulted offline if previously fetched successfully. Data remains dated and is **never labeled live** when offline.

## Where to try the API

SmartGrowth Standalone → Home → Find opportunities → **National Treasury procurement data** → **Fetch official data**.

Official service: https://ocds-api.etenders.gov.za/api/OCDSReleases
Publication policy: https://data.etenders.gov.za/Home/LearnMore
Official portal for checking notices: https://www.etenders.gov.za/

The app requests only a publication window (`dateFrom`, `dateTo`, `PageNumber`) from the source. The phone ranks the returned text against the business's industry and province. Business name, transactions and credentials are not sent to Treasury. The results are normalized to Open Contracting Data Standard (OCDS) release fields and saved locally if fetched successfully.

### API availability caveat

The official endpoint and supported parameters were corroborated from the open-source Kingfisher Collect Treasury connector and the National Treasury policy portal. The external service itself could **not be contacted by the offline build environment**, so the live response format, uptime and access from your phone remain to be tested.

The app uses CapacitorHttp for native Android/iOS requests (avoiding WebView CORS restrictions) and browser `fetch` for the web. Browsers may block a direct call if the source does not allow cross-origin requests. An authorised proxy would be required for a reliable publicly hosted web implementation in that case.

## How to test on the Android APK

1. Build the updated app with the included GitHub Actions workflow, then install the APK on Android.
2. Open SmartGrowth offline and select **Litha Catering (Sample)**.
3. Connect to internet. Go to Procurement → **Fetch official data** (30 days).
4. Observe the source attribution and retrieval timestamp. The result may be empty if no recent OCDS records were returned.
5. Try the text search and industry-only filter. Tap **Original OCDS release** or **Verify tender on eTenders**.
6. Turn on Airplane Mode, reopen SmartGrowth. Previously cached official records, if any, should be visible as **Saved official records**, with the original retrieval date.
7. Create a new business (e.g. technology) and return to Procurement: results should rank differently but public records are shared in a common cache, not duplicated across businesses.
8. If the live API fails, take a screenshot of the exact displayed message and check https://data.etenders.gov.za/ in your browser. **Never substitute fictional opportunities as if they were live.**

## What was not added

* No new Firebase authentication, identity provider or cloud database.
* No automatic guarantee of a procurement deadline or eligibility.
* No scraping behind a login or API key.
* No server-side account sync; no banking integration.
* This is a hackathon source build; an APK still needs to be generated using the Android GitHub Actions workflow.

## Development tests

From repository root:

```bash
node --test tests/offline-engine.test.mjs tests/live-data.test.mjs tests/treasury-data.test.mjs
```

Native network access, React production build and physical APK installation need to be verified on your own device or the team's build pipeline.
