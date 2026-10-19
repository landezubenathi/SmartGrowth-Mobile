# SmartGrowth product direction | Four Horsemen Tech

## Decision

The product is now **SmartGrowth — Your Business Journey**, not SmartFund AI with additional tabs. This repository is a *new, independent* mobile-first demo built from the tested business-growth modules. The earlier SmartFund project remains a separate codebase for potential future reuse.

## Primary persona

A South African township or rural entrepreneur who needs a low-friction way to document trading activity, take next steps, manage simple finances, understand business readiness and find customers. Other platform roles have been intentionally excluded from this new demo.

## Guided journey

1. **Start:** Create a business profile, explore applicable official registrations, identify supporting records.
2. **Manage:** Record sales and costs; issue invoices and recognise payments accurately (simulated only).
3. **Get ready:** Follow a transparent Passport that combines automatic actions with clearly labelled self-declarations; check suspicious messages.
4. **Grow:** Create a business listing, track enquiries and practise procurement matching; see a personalised 30-day Advisor plan.

Each journey milestone is driven by an existing backend rule or manual reviewed task. Completing a simulated action does *not* prove real-world financial standing or legal registration.

## Later: optional funding integration

Introduce funding *only as a separate, optional module* after validating entrepreneur needs. Proposed interface contract:

- `GET /api/integrations/funding/opportunities?sector=&region=`: current, source-attributed programmes (not the old static demo catalogue).
- `GET /api/integrations/funding/readiness?business_id=`: transparent requirement differences, with evidence provenance.
- Authenticated connector tokens and per-business access; an explicit user grant for any financial sharing.
- Expiry handling, scam warnings, source attribution and no implied approval probability.

**Do not** copy the old SmartFund administration/authentication modules directly into this local demo backend. Instead, plan a secured, independently permissioned service.

## Before public deployment

Implement real authentication, per-business data authorisation, safe financial storage, privacy notices/consent, encrypted HTTPS hosting, field validation, payment-provider security, audit trails, backup and recovery, independent testing, and monitoring. No production financial records should be stored in the local shared demo.
