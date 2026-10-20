# SmartGrowth — Live Business Insights (online + offline)

## Product decision
Keep the polished standalone SmartGrowth interface. Business data and transactions are saved on-device and work without connectivity. Add optional public information fetched over HTTPS, with **explicit data provenance, observation dates, and cache status**.

## What is actually connected

| Source | Public API | Shown in app | Auth / freshness |
| --- | --- | --- | --- |
| Open-Meteo | https://api.open-meteo.com/v1/forecast | Current temperature and daily predicted rain for a reference city in the chosen province | No API key for non-commercial use; weather forecast data; weather data attribution required |
| Frankfurter | https://api.frankfurter.dev/v2/rate/usd/zar | Reference USD to South African rand rate | No API key; daily market reference, **not** a bank settlement rate |
| World Bank | https://api.worldbank.org/v2/country/ZAF/indicator/FP.CPI.TOTL.ZG?format=json&per_page=20 | Latest *published annual* consumer-price inflation rate for South Africa | No API key; usually lagged annual observation, **not** live CPI |

Each source has its own result/status: `API updated`, `Saved data`, or `Unavailable`. Successful data is stored in local browser/Capacitor WebView storage per province so that an offline user can still view the previous result. The app never substitutes fictional rates or measurements for missing API results.

**Privacy:** Requests include only the public weather reference coordinates, the public USD/ZAR currency pair, or the South Africa country code. No account details, invoice amounts, business names or user location are transmitted to these providers.

**Useful limits:** The weather reference point is a representative city for the selected province, not the precise business address. The app does not update the Growth Passport from external information. The offline account/database is *not* automatically synced with an online login.

## Real official business resources (currently links, not API integrations)
- National Treasury eTenders: https://www.etenders.gov.za/Home/Opportunities
- Public procurement OCDS data API overview: https://data.etenders.gov.za/
- CIPC (registration): https://www.bizportal.gov.za/
- CIPC API hub (OAuth/subscription required): https://developer.cipc.co.za/
- Central Supplier Database: https://secure.csd.gov.za/

We **do not** label sample practice tenders as real, nor claim to verify CIPC registrations.

## Test on Android or Chrome
1. Back up your previous SmartGrowth project and keep the database/data backups safe.
2. Replace it with this project and run the existing React setup (or rebuild the Capacitor Android app from this new source).
3. Open **SmartGrowth Offline → Home → Live Insights** (also under More).
4. Connect to the internet and tap **Refresh data**. The screen should display source-specific dates and values, or an explicit unavailability notice if a provider could not be reached.
5. Switch the business province (e.g., Eastern Cape → Gauteng), return to Insights and check that the weather reference city changes. USD/ZAR and South Africa inflation remain national.
6. Go offline / turn on Airplane Mode, open Insights again. Previously fetched observations should appear as **Saved data**, not as newly fetched information. If no prior results were saved, the app must say **Unavailable**.
7. Create a sale and confirm the Growth Passport changes due to your recorded business data, **not** because of an exchange rate or the weather.
8. Run `node --test tests/live-data.test.mjs tests/offline-engine.test.mjs` from the project root to validate the parsers, caching and existing offline functions.

## Native app / static website
Same `frontend` can be built for the web and for Android with Capacitor using the existing project scripts/workflow. The APK bundles the app interface and local data engine. A network connection is needed *only* to refresh public insights or visit official websites.

## Production notes
- Open-Meteo's hosted public API is for non-commercial use. Check its licensing/limits before selling or publicly deploying a commercial SmartGrowth service; attribution is displayed on the Insights page.
- Treat exchange rates as indicative, not quotes or professional investment advice.
- A production procurement feed needs server-side normalisation, date/expiry validation, CORS review and publishing-source attribution. CIPC APIs require authorised OAuth access. None of these are silently presumed implemented.
- WebView local storage is not suitable for sensitive multi-user production accounting: deploy proper encrypted, authenticated synchronisation and backups before real customer adoption.
- API calls must succeed in the actual Android APK and deployed web URL; mock-parser tests do not establish live network connectivity.
