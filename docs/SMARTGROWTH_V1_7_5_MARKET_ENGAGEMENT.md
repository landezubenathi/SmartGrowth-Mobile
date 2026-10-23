# SmartGrowth v1.7.5 — Market Links engagement

## What changed

Market Links now has two call-to-actions on each *other owner's* published offer:

- **Show interest** — buyer sends an introductory enquiry.
- **Send enquiry / request quote** — buyer asks for a quotation, describing items, quantities or requirements.

A signed-in buyer enters their name, an optional phone number and a message. The email address comes from the Firebase-authenticated account and is read-only. Before sending, the buyer explicitly consents to sending their contact and business details **privately to the listing owner**. The public marketplace never exposes the buyer's contact information.

The owner opens **Market Links → Enquiries received**, sees new enquiries and buyer details, and can mark an enquiry **Contacted** or **Closed**. The buyer sees the status in **Sent enquiries**. This is a *live, in-app inbox*; it does **not** send an email, SMS or push notification and it does not automatically generate a commercial quotation. The owner may contact the buyer using their supplied email/optional phone.

A sender can open only one enquiry per published offer. The document ID is deterministic per signed-in account and offer, avoiding accidental duplicate submissions. The Firestore rules reject a repeat write from the sender.

## Firebase collections

Existing collection: `marketplace/{offerId}` (only public business/offer fields).

New collection: `marketEnquiries/{enquiryId}`:

- `offerId`, `offerName`, `ownerUid`, `ownerBusinessId`
- `senderUid`, `senderBusinessId`, `senderBusinessName`, `senderIndustry`, `senderProvince`
- `senderName`, `senderEmail`, `senderPhone`, `message`, `intent`
- `status`, `createdAt`, `updatedAt`

All enquiries are authenticated. Rules check that the listed offer is published, the recipient UID and business ID match its owner, the sender email matches the account's Firebase email, and the claimed sender business belongs to the signed-in user. Only the owner or sender can read an enquiry. Only the owner can update its status. Both parties can delete their own shared enquiry document via an authorised request; a delete button is not yet provided in this UI.

**Protect personal information:** Use fictional contact details for demos; obtain informed consent for actual contacts. Add retention, moderation and abuse-rate limits before a real public release. In-app enquiries depend on Firebase and an internet connection to deliver; existing local bookkeeping works offline.

## Install the update

1. Back up your current project and confirm the correct `SmartGrowth-Mobile` folder.
2. Extract the **patch** *into the parent directory containing `SmartGrowth-Mobile`*, merge and replace matching files. The patch has the top-level `SmartGrowth-Mobile/` folder.
3. In the project `frontend` directory run:

```powershell
npm install --no-audit --no-fund --legacy-peer-deps
npm run build
firebase deploy --only firestore:rules,hosting --project smartgrowthmobile
```

**The Firestore rules deployment is mandatory.** Merely redeploying Hosting will leave enquiry creation blocked.

4. Test the hosted website with two separate accounts.
5. Commit and push to GitHub `main`, run your existing **SmartGrowth Android debug build** workflow, and install the newly generated APK after verifying old data is synced/backed up. Deploying Hosting does not update a previously installed APK.
6. Do not upload `.env.local`, service account files, `.firebase` folders, or private customer data to GitHub.

## Test with two accounts

| Case | Test action | Expected |
|---|---|---|
| M01 | Account A publishes a service listing | Listing appears to Account B |
| M02 | Account B taps **Show interest** | Private contact form opens |
| M03 | Try submit without consent or with short text | Submission blocked |
| M04 | Submit full enquiry with consent | Success; appears in B's **Sent enquiries** |
| M05 | Account A opens **Market Links → Enquiries received** | B's name, email, optional phone, business and message show |
| M06 | Account A marks it **Contacted** | Status changes for Account A and B |
| M07 | Account B attempts another enquiry on the same offer | No duplicate; UI says already sent |
| M08 | Account C browses the public marketplace | Cannot see B's private contact details |
| M09 | Account A signs out, B signs in on same device | A's private inbox is cleared |
| M10 | Offline then reconnect | Existing business records remain; messages require connection to send |

### Troubleshooting

- **Permission denied:** Confirm Firestore rules were deployed. Make sure both accounts' businesses have synchronised successfully. The sender's business document must exist at `users/{uid}/businesses/{businessId}` before the enquiry is created.
- **Published offer missing:** Both users must be signed in and on the cloud workspace. Confirm the offer exists in `marketplace` with `status: 'published'`.
- **Enquiries invisible to owner:** Verify the listing's `ownerUid` and the login account. The inbox filters by the currently selected owner's business ID.
- **An enquiry isn't an email:** Messages are delivered as private Firestore documents, viewed inside SmartGrowth. No external email delivery is configured.

## Verification in development

The local JavaScript regression suite passed (98 tests); modified JS/JSX files passed syntax parsing. The actual Firebase rules, live multi-account end-to-end workflow, production React build, and Android APK were **not** executed in this environment. Run the above manual acceptance tests before release.
