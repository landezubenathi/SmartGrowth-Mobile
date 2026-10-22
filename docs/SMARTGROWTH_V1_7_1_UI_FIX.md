# SmartGrowth v1.7.1 — UI refinement

## Changes
- Long National Treasury document hyperlinks now wrap inside their cards on desktop and mobile.
- Removed the duplicate Business details form from Compliance (the Business Profile and onboarding remain the canonical source).
- Removed the developer-facing "Official CIPC verification — future integration" section from the Compliance screen.
- Added a short, uniform SmartGrowth registration badge above the business name on the top bar and Business Profile.

## Verification terminology
The app does **not** have access to the CIPC API. A record created in the simulated registry is labelled **SmartGrowth Registered**, and a match to a fictional test record is labelled **SmartGrowth Registry Match**. These are never presented as **CIPC Verified**. An explanation remains on the About information page, and badges have tooltips. No real CIPC data or claims are introduced.

## Apply
1. Back up your working v1.7 project.
2. Merge the update patch into the folder containing `SmartGrowth-Mobile`, preserving your local .env files and business records.
3. From `SmartGrowth-Mobile/frontend`: `npm install --no-audit --no-fund --legacy-peer-deps`, then `npm run build` and `firebase deploy --only hosting --project smartgrowthmobile`.
4. For Android: commit/push the updated code to GitHub main, run your Android APK workflow and install the generated APK. Web deploys do not update installed APKs.
5. Open a Treasury notice with a long document title, check its link remains inside its card at both phone and desktop widths, then open Compliance and the Business Profile.

No Firestore rule changes, database migrations or new external credentials are required.
