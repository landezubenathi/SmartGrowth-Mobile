# SmartGrowth v1.7.4 — Privacy and consent presentation

## Purpose

This update refines user-facing registration text without changing authentication, account access, business data, Firestore rules, payment simulation, CIPC integration status, or the way offline records synchronise.

### What a new user sees

**Before you register**

> SmartGrowth uses your personal and business details to create your account and help you prepare for CIPC, SARS and other business-compliance requirements. We apply privacy and security safeguards guided by South Africa’s Protection of Personal Information Act (POPIA). We will not send your details to government departments unless an authorised process is available and you are informed.

The user must select:

> I understand and consent to SmartGrowth using my information for account creation, business-registration guidance and compliance support as described above.

The registration screen and Account & Sync do not display cloud infrastructure branding. The registration reference is labelled **SmartGrowth registration reference · not government-issued**. The completion experience no longer includes the large technical disclaimer.

### What a user can find under More

The **Privacy, consent & service information** section briefly explains purposes of processing, account and device storage, that Google Firebase provides cloud authentication/storage, offline handling, and that internal practice registration/checks are **not** CIPC registration/verification. It includes a link to the official BizPortal.

## Technical implementation (for maintainers only)

- Authentication and synchronisation still use Firebase Authentication and Cloud Firestore. No infrastructure was changed.
- Registration and director ID format checks are unchanged; the full South African ID number is not saved to the business record.
- The saved consent version changes from `1.7.3` to `1.7.4` for **new** registrations; existing accounts retain their original consent record.
- There is no authorised CIPC/BizPortal or SARS submission integration. Do not present internally generated reference numbers as official registrations or show government-issued verification badges based on local matches.
- Automated checks validate text structure, but do not amount to a legal POPIA compliance certification or penetration/security audit.

## Privacy matters the company still must complete before production use

1. Establish and publish the responsible party's legal name and a working privacy/contact channel.
2. Publish an accessible privacy notice covering purposes, categories of information, hosting and operators, retention and deletion, rights of access/correction and complaints to the Information Regulator.
3. Set a specific retention/deletion policy and implement user-facing requests (including deleting cloud and local copies where lawful).
4. Review cross-border data handling, the use of third-party processors, security controls, breach procedures and access logging.
5. Introduce explicit just-in-time permission before **any future** transmission to a government service, and do not claim official verification unless the authority actually confirms it.
6. Review the consent wording and lawful basis with a South African POPIA professional before public rollout.

Relevant authorities: Information Regulator (https://inforegulator.org.za/) and the original POPIA legislation (https://www.justice.gov.za/legislation/acts/2013-004.pdf).

## Release instructions

**Applying the small patch:** merge the patch's `SmartGrowth-Mobile` folder with your working project (do not overwrite `.env.local` or user data). Keep a backup.

In `SmartGrowth-Mobile/frontend`:

```powershell
npm run build
firebase deploy --only hosting --project smartgrowthmobile
```

Android is separate: commit/push to GitHub and run the existing **SmartGrowth Android debug build** workflow, install the latest artifact. Web deployment does not replace an installed APK.

### QA checklist

- Registration notice shows purposes, POPIA and the conditional department-sharing statement; no cloud vendor name on the signup page.
- Consent is not preselected. Registration cannot proceed until accepted.
- Valid IDs/postal codes still pass, and mixed-character pastes are rejected.
- The final reference is visibly a SmartGrowth reference, not a government-issued number.
- More -> Privacy, consent & service information explains the current service honestly.
- Existing accounts, Passport, Money, Intelligence and online/offline sync still work.
