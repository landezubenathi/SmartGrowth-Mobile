# SmartGrowth v1.7.2 — Compliance Page Cleanup

## Change

- Removed the duplicate **Company registration / BizPortal** service card from Compliance.
- Removed the duplicate **Review your CIPC company record** readiness step, so registration is not requested again after SmartGrowth onboarding.
- Renamed the services heading **Tax and supplier compliance services**.
- Preserved existing registration details, legacy self-reported review data, SARS tax guidance, and conditional CSD supplier guidance.
- No Firestore rule change or database migration required.

This is a UI and readiness-guidance cleanup only. SmartGrowth simulated registration does not amount to official CIPC registration.

## Apply to an existing project

Back up the project. Extract the update ZIP into the parent folder containing `SmartGrowth-Mobile`, replacing matching files.

From `SmartGrowth-Mobile/frontend`:

```powershell
npm run build
firebase deploy --only hosting --project smartgrowthmobile
```

To update Android, commit and push changes to your GitHub repository and rerun the Android APK workflow. Confirm cloud synchronization and back up device-only records before replacing an app installation.

## Verify

1. Sign in with an existing SmartGrowth account.
2. Open Compliance: there is **no Company registration** card and no company registration review task.
3. Check the tax compliance card works.
4. Enable government supplier intent: the CSD guidance should still appear.
5. Open Business Profile: registration number and related details remain unchanged.
