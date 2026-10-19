# Data provenance and operational limits

## Device-only data

All business profiles, income, expenses, invoices, payment simulations, marketplace listings, document declarations and Journey actions made in standalone mode live in the current device/browser local storage. They are not fetched from, nor synchronized to, FastAPI. These can be real user-entered amounts, but **SmartGrowth has not verified them**.

The app seeds two fictional business examples (catering and technology). The sector chooser includes Catering, Retail, Agriculture, Construction, Technology, Services, Manufacturing, Beauty & Wellness, Transport, Education, Other and a custom industry field. Fictional purchases, sales, buyers, opportunities and example amounts are explicitly marked SAMPLE. Sample data does not represent real market benchmarks or current tender values.

The Passport readiness score is a demonstration heuristic: 60 points for recorded actions, 40 for self-declared external documents. It is not a regulated credit or funding score. A saved profile does not prove CIPC registration. An unpaid invoice does not prove a sale has been paid. The payment simulation adds bookkeeping income **once** and does not send money.

The Advisor and SmartShield use deterministic heuristics and textual rules, not generative AI and not verified fraud prediction.

## Official external resource catalogue

The app provides **links** to real authoritative websites (they load only when online):

- CIPC BizPortal — https://www.bizportal.gov.za/
- SARS starting a business and tax — https://www.sars.gov.za/businesses-and-employers/small-businesses-taxpayers/starting-a-business-and-tax/
- Central Supplier Database — https://secure.csd.gov.za/
- National Treasury eTender Publication Portal — https://www.etenders.gov.za/

Links confirmed against official pages in October 2026. The app does not scrape or replicate live CIPC records, SARS taxpayer data, CSD supplier verification or eTender entries. There is **no live-tender ingestion** and no claim that the practice brief catalogue is live procurement.

According to SARS, a sole proprietor may have different legal registration requirements from an incorporated entity; avoid implying that every business must be registered as a company with CIPC.

## Privacy and safety

- Do not enter personal ID numbers, bank account passwords, card numbers, OTPs or real customer details into the offline demonstration.
- Local storage is not encrypted. Anyone with access to an unlocked device may inspect it. Backups are plaintext JSON.
- Clearing browser storage or uninstalling the APK may remove data. Export a backup regularly.
- Online credentials belong only to the optional FastAPI service and do not authenticate or protect offline mode.
- A hosted production version would need actual data protection, backup/recovery, per-account controls and compliance review before handling sensitive personal and financial data.

## Optional migration from previous SmartGrowth SQLite demo

To preserve an old *local demo account* in standalone mode, stop its backend and run the included helper:

```powershell
python scripts/export_local_sqlite_to_demo.py backend/data/growth_demo.sqlite3 demo --output smartgrowth-imported-demo.json
```

Change `demo` to the desired existing `user_id`. This uses only that account's business tables, **does not copy passwords or authentication tokens**, and labels imported records as *SAMPLE* because their real-world verification status is unknown. On the new app, choose **More → Restore backup**, select the JSON file and confirm. **Restoring overwrites all current standalone businesses**; export a backup first. This is a one-time local migration, not cloud synchronization.
