# Standalone mobile UAT — 15 checks

Run these tests **on the installed APK with your PC shut down and Wi-Fi switched off**. Offline demo uses the same React interface on Android, iOS targets and web.

| ID | Action | Expected outcome |
|----|--------|------------------|
| SM-01 | Open installed APK | Welcome screen displays with **Open SmartGrowth offline** |
| SM-02 | Disable internet, tap offline | SmartGrowth Home opens; no backend error |
| SM-03 | Select Litha Catering sample | Has clearly fictional income, expenses, invoice |
| SM-04 | Switch to BrightCode Studio sample | Distinct records and profile; no crossover |
| SM-05 | Add blank Retail or custom-type business | Starts with empty ledger and invoices |
| SM-06 | Add income R2,500 and expense R800 | Surplus increases by R1,700 from those entries |
| SM-07 | Create invoice R1,000 | Income unchanged before payment |
| SM-08 | Simulate that invoice payment once | Income increases R1,000 |
| SM-09 | Click Simulate paid a second time | No duplicate income; payment control no longer displayed |
| SM-10 | Growth Passport | Auto milestones reflect recorded activity; external evidence remains manual |
| SM-11 | My Journey | Completed steps respond to saved actions |
| SM-12 | SmartShield: 'Pay registration fee urgently and give OTP' | Multiple warning signals and cautionary message |
| SM-13 | Opportunities | Fictional sample briefs labelled; official links clearly separate |
| SM-14 | More → Export, then Import backup | Records can be restored with confirmation |
| SM-15 | Fully close/reopen app with no internet | The most recent device-stored business records persist |

In addition, test an online sign-in (when backend is reachable) to confirm it remains separate from standalone demo data. Verify installability, performance and legible text on a real Android phone.
