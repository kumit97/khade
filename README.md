# KHADE

A two-sided beauty & wellness marketplace connecting customers with professionals
(barbers, salons, makeup artists, nail techs, massage therapists, spas,
estheticians, tattoo artists, skincare clinics).

This monorepo contains the three products plus shared code and the database.

```
khade/
├─ apps/
│  ├─ customer-app/      Flutter — discovery + booking + payments (mobile-first)
│  ├─ business-app/      Next.js — provider dashboard (bookings, staff, services)
│  └─ admin-dashboard/   Next.js — platform operations console
├─ packages/
│  └─ shared/            TypeScript — domain types, enums, pricing/booking logic
└─ supabase/
   ├─ migrations/        Postgres schema, RLS, functions, triggers
   ├─ seed.sql           Local dev seed data
   └─ config.toml        Local Supabase stack config
```

## Tech stack

| Layer | Choice |
|---|---|
| Mobile | Flutter (`apps/customer-app`) |
| Web | Next.js 14 App Router (`apps/business-app`, `apps/admin-dashboard`) |
| Backend / DB / Auth / Storage | Supabase (PostgreSQL + PostGIS) |
| Maps | Google Maps |
| Push | Firebase Cloud Messaging |
| Payments | Stripe (tokenised) + pluggable local gateway |
| Analytics | Firebase Analytics |
| AI (V2 only) | OpenAI / pluggable LLM provider |

## Getting started

### 1. Database (Supabase)

Local stack:

```bash
supabase start          # boots Postgres + Studio + Auth locally
supabase db reset       # applies migrations + seed.sql
```

Hosted: link a project (`supabase link`) and `supabase db push`. Phone-OTP,
Google and Apple auth providers are configured in the Supabase dashboard (they
require provider secrets) — see **Auth setup** below.

The migrations create every table from the spec with **Row-Level Security on
each one**, Postgres enums for all status fields, geospatial nearby-search,
real-availability slot calculation, double-booking prevention, rating rollups,
loyalty ledger, and a stubbed fraud-monitoring hook.

### 2. Web apps

```bash
npm install                    # installs all workspaces
cp .env.example .env           # then fill in Supabase keys
npm run dev                    # runs both Next.js apps via Turborepo
```

- Admin dashboard → http://localhost:3001
- Business app    → http://localhost:3002

Each app also has its own `.env.example`; copy to `.env.local`.

### 3. Customer app (Flutter)

```bash
cd apps/customer-app
cp .env.example .env
flutter pub get
flutter run
```

## Seeded test accounts (local)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@khade.test` | `password` |
| Business owner | `owner@khade.test` | `password` |
| Customer | `customer@khade.test` | `password` |

## Quality gates

```bash
npm run typecheck    # all TS workspaces
npm run test         # shared domain logic (vitest)
npm run build        # Next.js production builds
```

CI runs the same on every PR (`.github/workflows/ci.yml`), plus `flutter analyze`.

## Security model

- Passwords/identities handled exclusively by Supabase Auth — never stored by us.
- **RLS on every user-data table**, enforced server-side. Helper predicates
  (`is_admin`, `owns_business`, `works_for_business`) back the policies.
- Role-based access enforced in the database and re-checked server-side in each
  app (`requireAdmin`, `requireBusiness`), never trusted from the client.
- The service-role key is used **only** in the admin dashboard's server actions,
  after an admin check — never shipped to the browser.
- Payments are tokenised by Stripe; card data never reaches KHADE servers.
- Admin actions write to `admin_audit_log`.
- Fraud-monitoring hook (`booking_fraud_check` trigger) flags rapid repeat
  bookings into `fraud_flags`; fuller scoring is a V2 extension point.

## Auth setup (hosted)

Email/password and customer/business signup work out of the box. To enable the
rest, configure providers in **Supabase → Authentication → Providers**:

- **Phone OTP** — set an SMS provider (Twilio/MessageBird).
- **Google** — OAuth client ID/secret.
- **Apple** — Services ID + key.

The Flutter app already calls `signInWithOAuth(Google)` and the schema's
`handle_new_auth_user` trigger provisions a `public.users` row for any new
identity regardless of provider.

## What needs real credentials

These are stubbed/awaiting keys (see `.env.example` files):

- Supabase project URL + anon + service-role keys
- Google Maps API key (map view, nearby)
- Stripe secret/publishable/webhook keys (payment capture + webhook → `payments`)
- Firebase project (FCM push delivery worker + Analytics)
- OpenAI key (V2 AI features only — not used in MVP)

## Assumptions to confirm (flagged, not silently chosen)

Per the spec's working agreement, these business rules are **placeholders**:

- **Commission**: 15% platform commission on paid bookings.
- **Cancellation policy**: full refund outside the 24h window; late cancels
  allowed but non-refundable. See `packages/shared/src/booking.ts`.
- **Loyalty**: 1 point per 1 currency unit; per-business balances.
- **One business per owner** in the business app's active-context resolver
  (the schema itself supports many).

## Build status vs. spec

Implemented as working vertical slices: full data model + RLS (Phase 1),
email/password + Google + role handling (Phase 2), customer discovery/profile/
booking with real availability (Phase 3 core), business dashboard/appointments/
services/staff/customers/analytics (Phase 4), and the full admin console
(Phase 5). Cross-cutting (Phase 6) — loading/empty/error states, server-side
validation, audit logging, fraud hook — is in place; FCM delivery worker, Stripe
webhook capture, and chart rendering are the named follow-up slices.

Out of scope for MVP (extension points noted in code, e.g.
`packages/shared/src/recommendations.ts`): AI concierge, smart recommendations,
memberships, gift cards, product marketplace, home service, voice booking.
