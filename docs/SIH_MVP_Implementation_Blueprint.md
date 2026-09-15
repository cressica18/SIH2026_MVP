# Bumble Bee 404 — "Kisan Setu" MVP Implementation Blueprint
### Direct Farmer-to-Buyer Digital Marketplace (SIH 2026, PS: IHSIH009)
**Single source of truth for build execution — follow phase by phase.**

---

## 0. How to Use This Document

This is written to be handed **one phase at a time** to an AI coding agent (Claude Code). Each phase is self-contained: it states what already exists, exactly what to build, which files it touches, and how to know it's done. Do not skip ahead — later phases assume earlier interfaces exist exactly as specified. If a phase's acceptance criteria aren't met, do not start the next phase.

**Global agent rules (apply to every phase unless a phase overrides them):**
- Build additively. Never rewrite a working module to "clean it up" — extend it.
- Never change a database column name, API route, or response shape defined in an earlier phase without updating this doc first and searching the codebase for every caller.
- Every backend endpoint added in a phase must have at least one automated test (pytest) and be callable via a documented `curl`/Postman example.
- Every phase that touches the UI must leave the app in a runnable, demo-safe state — no half-built screens reachable from navigation.
- Commit at the end of each phase with message `phase-N: <objective>`. One phase = one PR against `main` (or `develop`) in the shared repo.
- Seed/demo data is cumulative — each phase that adds a table also adds a seed script or extends the shared `seed.py`, so the whole app is always demoable, not just the newest feature.

---

## 1. Architecture Blueprint

### 1.1 Recommended Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js (React) + TypeScript**, Tailwind CSS, shadcn/ui | One codebase, PWA-installable, server-rendered for low-bandwidth first paint, huge AI-coding-agent familiarity |
| Backend | **Python + FastAPI** | AI/ML (Prophet, XGBoost, TensorFlow/Keras, OR-Tools) and API layer live in one language/runtime — no service-to-service glue for a 2-person team |
| Database | **PostgreSQL** (hosted free tier: Supabase or Neon) + **PostGIS extension** for geo queries | Relational integrity for orders/escrow-style state machines; PostGIS gives real proximity queries for matching/logistics |
| Cache/Queue | **Redis** (optional, phase 19+) | Session/OTP storage, background job queue for AI inference (RQ or FastAPI `BackgroundTasks` is enough for MVP scale) |
| Auth | Phone number + OTP, JWT (access + refresh) | Matches real farmer usage pattern (no email literacy assumption) |
| File/Image storage | Local disk in dev → **Cloudflare R2 or Supabase Storage** in deployed demo | Produce photos, voice clips |
| AI/ML runtime | Python: `scikit-learn`, `xgboost`, `prophet`, `tensorflow`/`keras`, `ortools` | All free, all run in the same FastAPI process/worker |
| Voice | Browser **Web Speech API** (STT+TTS) as primary, with a documented adapter interface for **Bhashini API** as the production swap-in | Web Speech API needs no credentials and demos reliably; Bhashini is cited in the PPT and wired as a pluggable provider |
| Deployment | Frontend: **Vercel**. Backend: **Railway/Render**. DB: **Supabase/Neon**. | Free tiers, zero DevOps overhead, one-command redeploy |
| Repo | Single **monorepo**, two top-level folders (`/web`, `/api`) | One private GitHub repo as specified |

### 1.2 Frontend Architecture

```
/web
  /app                     # Next.js App Router
    /(auth)/login, /otp
    /farmer/...             # farmer-only routes, role-guarded
    /buyer/...
    /logistics/...
    /admin/...
  /components
    /ui                    # shadcn primitives
    /voice                 # mic button, waveform, language switcher
    /listing-card, /order-tracker, /reputation-badge, ...
  /lib
    api-client.ts          # typed fetch wrapper for every /api route
    auth-context.tsx
    i18n/                  # regional language strings (next-intl or custom)
  /hooks
    useVoiceCapture.ts, useListings.ts, useOrders.ts, ...
```
- Role-based route guards via a `useAuth()` hook reading JWT claims.
- All text externalized to `/lib/i18n` from day one (even before phase 6 builds real voice), so regional-language support is not bolted on later.
- Mobile-first, large tap targets, offline-tolerant forms (queue writes, retry) — low digital-literacy design per the PPT.

### 1.3 Backend Architecture

```
/api
  /app
    main.py                 # FastAPI app, router registration
    /core                   # config, security (JWT), db session, deps
    /models                 # SQLAlchemy models (one file per domain)
    /schemas                # Pydantic request/response models
    /routers                # one router per API module (see 1.6)
    /services                 # business logic, kept OUT of routers
      pricing_service.py, quality_service.py, matching_service.py,
      logistics_service.py, reputation_service.py, risk_service.py,
      scheme_service.py, insight_service.py, voice_service.py
    /ml                       # model loading, inference wrappers, training scripts
      /artifacts               # saved model files (.pkl/.h5), NOT committed if large — documented download/train script instead
    /workers                 # background jobs (image inference, route computation)
  /tests
  seed.py
  alembic/                   # DB migrations
```
- **Routers are thin** — they validate input (Pydantic) and call a service function. All business/AI logic lives in `/services` and `/ml` so it is independently testable and reusable by the seed script and by tests.
- Every AI service exposes a plain Python function with a typed signature (e.g. `def recommend_price(crop: str, region: str, quantity: float) -> PriceRecommendation`) — this is the "interface/contract" later phases and the router both depend on.

### 1.4 Database — Main Entities (Postgres)

| Entity | Key Fields |
|---|---|
| `users` | id, phone, role[farmer/buyer/processor/logistics/admin], name, language, created_at |
| `farmer_profiles` | user_id, village, district, state, lat, lng, land_size_acres, primary_crops[], reputation_score |
| `buyer_profiles` | user_id, buyer_type[consumer/processor], business_name, verified |
| `logistics_profiles` | user_id, vehicle_type, capacity_kg, service_radius_km, lat, lng |
| `anonymous_identities` | id, farmer_user_id, anon_seller_id (public-facing), created_at |
| `listings` | id, anon_seller_id (FK), crop, variety, quantity_kg, price_expected, price_ai_min/max, quality_grade, quality_confidence, image_urls[], lat, lng, status, created_via[text/voice], created_at |
| `orders` | id, listing_id, buyer_id, quantity_kg, agreed_price, status[pending→matched→confirmed→in_transit→delivered→settled / disputed], identity_revealed_at |
| `settlements` | id, order_id, method[aeps/bank/cash_sim], amount, status, aeps_ref |
| `reputation_events` | id, user_id, order_id, type[rating/fulfillment/dispute], value, created_at |
| `match_scores` | id, listing_id, buyer_id, score, factors_json |
| `logistics_pools` | id, region_cluster_id, date, order_ids[], route_json, vehicle_assigned, status |
| `gov_schemes` | id, title, description, eligibility_json, state, category, source_url |
| `scheme_matches` | id, farmer_id, scheme_id, match_score |
| `risk_assessments` | id, farmer_id, score, eligible_advance, factors_json |
| `advance_requests` | id, farmer_id, amount, status, aeps_ref |
| `reports` | id, reporter_user_id (nullable/anon-flagged), reported_user_id, category, description, status, created_at |
| `market_insights` | id, region, crop, week_start, avg_price, trend, summary_text |
| `voice_sessions` | id, user_id, transcript, extracted_entities_json, language, created_at |

### 1.5 Authentication

- Phone + OTP (dev: OTP printed to console/logged; prod-ready: MSG91/Twilio adapter behind one interface `send_otp(phone)`).
- JWT access token (short-lived) + refresh token (httpOnly cookie).
- Role embedded in JWT claims; every protected router uses a `require_role(["farmer"])` dependency.

### 1.6 API Modules (Endpoints)

| Module | Key Routes |
|---|---|
| `/auth` | `POST /otp/send`, `POST /otp/verify`, `GET /me`, `POST /refresh` |
| `/users` | `GET/PUT /profile` (role-aware) |
| `/listings` | `POST /listings`, `GET /listings` (search/filter), `GET /listings/{id}`, `PATCH /listings/{id}/status` |
| `/voice` | `POST /voice/transcribe`, `POST /voice/extract-listing` |
| `/pricing` | `GET /pricing/recommend?crop&region&quantity` |
| `/quality` | `POST /quality/assess` (image upload) |
| `/orders` | `POST /orders`, `GET /orders`, `PATCH /orders/{id}/status`, `POST /orders/{id}/reveal-identity` |
| `/matching` | `GET /matching/listing/{id}`, `GET /matching/buyer/{id}` |
| `/logistics` | `GET /logistics/pools`, `POST /logistics/pools/{id}/join`, `GET /logistics/pools/{id}/route` |
| `/reputation` | `GET /reputation/{user_id}`, `POST /reputation/events` |
| `/schemes` | `GET /schemes`, `GET /schemes/match/{farmer_id}` |
| `/finance` | `GET /finance/risk-score/{farmer_id}`, `POST /finance/advance-request`, `POST /finance/aeps/simulate-cashout` |
| `/insights` | `GET /insights/dashboard?region&crop` |
| `/reports` | `POST /reports`, `GET /admin/reports` |
| `/admin` | moderation, scheme CMS, metrics |

### 1.7 External Services / APIs Used in the Prototype

| Need | Prototype choice | Production swap-in (documented, not built) |
|---|---|---|
| STT/TTS | Web Speech API (browser) | Bhashini API |
| Historical mandi prices | Agmarknet (data.gov.in) CSV/API, real public data | Same, live feed |
| Quality classifier training data | Public Kaggle produce-quality datasets | Partner-sourced labeled imagery |
| Payments/cash-out | Simulated AEPS flow (mock BC-agent screen + fake NPCI response) | Licensed AEPS/NPCI + bank partner |
| Gov schemes | Curated static dataset scraped/compiled once from myscheme.gov.in + state portals | Live API when available |
| Market insight narration | Anthropic Claude API (short prompt over aggregated stats) | Same, or fine-tuned summarizer |
| Maps/routing | Google OR-Tools (offline solver) + OpenStreetMap tiles (Leaflet) | Same + Google Maps API key for production polish |

---

## 2. AI/ML Feature Decisions

| Feature | MVP Implementation | Data | Honest framing for judges |
|---|---|---|---|
| **AI price recommendation** | Per-crop, per-region forecasting model (Prophet, falling back to weighted moving average where history is thin) trained on real Agmarknet historical mandi prices; outputs a price **band** (min–fair–max) with a confidence indicator | Real public historical data | Fully real, working model — a genuine strength to demo |
| **Produce quality assessment** | MobileNetV2 transfer-learning image classifier, fine-tuned on public produce-quality datasets, scoped to 4–5 demo crops (tomato, onion, potato, banana, apple) → grade A/B/C + confidence | Public Kaggle datasets | Real trained model, clearly scoped to a demo crop set — extensible design, not scope-inflated |
| **Risk / advance-eligibility scoring** | XGBoost classifier on engineered features (price-volatility index, quality grade, order-fulfillment history, reputation score) trained on a synthetic-but-realistic bootstrapped dataset | Synthetic, realistically distributed | Presented explicitly as a "cold-start model trained on synthetic priors, designed to retrain on real repayment data once live" — this candor reads as maturity, not weakness |
| **Buyer–listing matching** | Transparent weighted-scoring algorithm (price fit, quality match, distance via PostGIS, seller reputation) — explainable "AI-assisted ranking," not a black box | Live platform data | Real, functional, and defensible in a Q&A — judges can ask "why this match" and get a real answer |
| **Logistics pooling / optimization** | Geo-clustering (DBSCAN, haversine) of same-day confirmed orders in a region, then Google OR-Tools solves the pooled route (capacitated VRP) | Live order data | Real optimization, runs on live/seeded data |
| **AI market insights** | Aggregation + trend detection (rolling averages, direction-of-change) over price/demand data, plus a short natural-language summary generated by one LLM call over the aggregated numbers (never raw personal data) | Real aggregated data | Real analytics + real (lightweight) generative layer |
| **Voice / NLP** | Web Speech API for STT/TTS; rule-based slot-filling (regex + per-language keyword dictionaries for crop names, numbers, units) extracts crop/quantity/price from the transcript into a structured listing draft, farmer confirms/edits before submit | User's live speech | Real end-to-end voice-to-listing flow; NLU intentionally rule-based (fast, debuggable, no training data needed) rather than a trained NLU model — correct scope for 2 students in the available time |

---

## 3. Product & Screens by Role

**Farmer** — Home (voice mic front-and-center) → Create Listing (voice or text) → My Listings (status, AI price band, quality grade) → Orders & Settlement tracker → Reputation view → Government Schemes feed (matched to profile) → Advance / AEPS Cash-Out → Logistics Pool status → Anonymous Help/Report.

**Buyer / Consumer / Processor** — Marketplace browse/search/filter (crop, region, grade, price) → Listing detail (anonymized seller, quality grade, price, reputation badge) → Place Order → Order Tracking → Market Insights dashboard → My Reviews.

**Logistics Provider** — Pool Requests dashboard (map of clustered pending orders) → Accept/assign vehicle → Route view (map, OR-Tools sequence) → Delivery status updates.

**Admin** — User & listing moderation → Report review queue (handles anonymous reports) → Government scheme CMS → Platform metrics (orders, GMV-equivalent, match rate, AI model confidence) → Dispute resolution.

Priority for evaluation impact (build polish in this order): Farmer voice-listing flow → Marketplace + anonymized listing + AI price/quality → Order → reveal → settlement journey → Buyer insights dashboard → Logistics pool map → Admin/report screens.

---

## 4. Two-Person Implementation Split

| Person A (Phases 0–10) | Person B (Phases 11–18) | Both (Phases 19–21) |
|---|---|---|
| Foundation, DB schema, auth, farmer & buyer onboarding, listing CRUD, voice/NLP layer, marketplace discovery, anonymous identity layer, AI price recommendation, quality assessment | Orders & escrow-style lifecycle, reputation & trust scoring, matching engine, logistics pooling, government scheme module, financial inclusion/AEPS, AI market insights, women-centric privacy & reporting | Integration, notifications, UI/UX polish & accessibility, testing, deployment, demo rehearsal |

Handoff point (end of Phase 10) is chosen because by then: the DB schema is final, auth/roles work for every role, listings can be created (by voice or text) and browsed anonymously, and the two hardest/most novel AI features (pricing, quality) are already live — Person B builds strictly on top of a stable, demoable core rather than an unfinished one.

---

## 5. Phase-by-Phase Roadmap

> **Legend used in every phase:** *Exists* = what's already true before this phase starts. *Build* = what this phase adds. *Don't touch* = things later phases depend on unchanged. *Done when* = acceptance criteria.

### Phase 0 — Monorepo Foundation & Environment
**Objective:** Stand up the repo skeleton both people can build on immediately.
**Build:**
- Monorepo with `/web` (Next.js + TS + Tailwind + shadcn) and `/api` (FastAPI + SQLAlchemy + Alembic) scaffolds.
- `.env.example` for both; Docker Compose for local Postgres.
- Shared `README.md` with run instructions; GitHub Actions CI running lint + a placeholder test on push.
- Base design tokens (colors/typography) per the frontend-design conventions; a shared `Layout` shell with role-aware nav placeholder.
**Files:** `/web`, `/api`, `docker-compose.yml`, `.github/workflows/ci.yml`.
**Dependencies:** none.
**Done when:** `docker compose up` starts Postgres; `npm run dev` serves a blank Next.js home; `uvicorn app.main:app` serves `GET /health` → `200`.

### Phase 1 — Database Schema & Core Models
**Exists:** Empty Postgres, empty `/app/models`.
**Build:** SQLAlchemy models for every entity in §1.4 (start with `users`, `farmer_profiles`, `buyer_profiles`, `logistics_profiles`, `anonymous_identities`, `listings`, `orders` — the rest can be added incrementally in the phase that first needs them, but the full ERD must be documented now in `/api/docs/erd.md` so later phases don't invent conflicting fields). Alembic migration `0001_init`. `seed.py` with 5 farmers, 5 buyers, 2 logistics providers, sample listings.
**Don't touch:** field names once migrated — later phases append columns via new migrations, never rename.
**Files:** `/api/app/models/*.py`, `/api/alembic/versions/0001_init.py`, `/api/seed.py`, `/api/docs/erd.md`.
**Dependencies:** Phase 0.
**Done when:** `alembic upgrade head` succeeds; `python seed.py` populates without error; ERD doc matches actual columns.

### Phase 2 — Authentication & Role-Based Access
**Build:** `POST /auth/otp/send`, `POST /auth/otp/verify` (dev: OTP logged to console, 6-digit, 5 min expiry), JWT issuance (access+refresh), `GET /auth/me`, `require_role()` FastAPI dependency. Frontend: phone-entry → OTP screen → role-based redirect; `AuthContext` storing JWT, `useAuth()` hook; route guards for `/farmer`, `/buyer`, `/logistics`, `/admin`.
**Files:** `/api/app/core/security.py`, `/api/app/routers/auth.py`, `/web/app/(auth)/*`, `/web/lib/auth-context.tsx`.
**Dependencies:** Phase 1.
**Done when:** A seeded farmer phone number can log in end-to-end via UI and lands on `/farmer`; an unauthenticated request to a protected route returns `401`; wrong-role access returns `403`.

### Phase 3 — Farmer Onboarding & Profile
**Build:** Multi-step onboarding (name, village/district/state with a simple dropdown or map-pin, language selection, primary crops, land size) → creates `farmer_profiles` row + an `anonymous_identities` row (anon ID generated here, e.g. `FARM-XXXXX`) at the same time, so anonymity exists from day one, not bolted on later. `GET/PUT /users/profile` for farmer role.
**Files:** `/web/app/farmer/onboarding/*`, `/api/app/routers/users.py`, `/api/app/services/identity_service.py`.
**Dependencies:** Phase 2.
**Done when:** New farmer completes onboarding, has both a `farmer_profiles` row and a linked `anonymous_identities` row; profile is editable afterward.

### Phase 4 — Buyer / Processor / Logistics Onboarding
**Build:** Equivalent onboarding flows for buyer/processor (business name, buyer_type, location) and logistics provider (vehicle type, capacity, service radius). Admin role seeded manually (no self-signup).
**Files:** `/web/app/buyer/onboarding/*`, `/web/app/logistics/onboarding/*`, extends `users.py` router.
**Dependencies:** Phase 2, Phase 1 schema.
**Done when:** All three roles can complete onboarding and reach their respective dashboards (dashboards can be placeholder shells at this point).

### Phase 5 — Listing Creation (Text-First Core CRUD)
**Build:** `POST /listings` (crop, variety, quantity, price_expected, up to 3 images, auto-attaches farmer's `anon_seller_id`, status=`draft`→`active`), `GET /listings/{id}`, `PATCH /listings/{id}/status` (farmer can withdraw/relist), farmer-side "My Listings" screen with status badges. This is the CRUD backbone that the voice flow (Phase 6) will populate a draft into, and that pricing/quality (Phase 9–10) will attach results to.
**Files:** `/api/app/routers/listings.py`, `/api/app/schemas/listing.py`, `/web/app/farmer/listings/*`, `/web/components/listing-card.tsx`.
**Dependencies:** Phase 3.
**Done when:** A farmer can create a listing via a text form, see it in "My Listings," and edit/withdraw it. Images upload and render.

### Phase 6 — Voice & Regional-Language Layer
**Exists:** Text-based listing creation (Phase 5) with a known request shape.
**Build:** `useVoiceCapture` hook wrapping Web Speech API (STT in the farmer's selected language, TTS to read prompts/confirmations back). `POST /voice/extract-listing` takes a transcript, runs rule-based slot-filling (regex + per-language keyword dictionaries in `/api/app/services/voice_service.py` for crop names, numbers, units, "rupees per kg" phrasing) and returns a structured draft matching the Phase 5 listing schema exactly. Frontend: mic button on the listing-creation screen → live transcript → auto-filled form → farmer confirms/edits → submits via the existing `POST /listings`. Language toggle wired into `/lib/i18n` from Phase 0.
**Don't touch:** the `POST /listings` payload contract from Phase 5 — voice must produce the same shape, not a parallel endpoint.
**Files:** `/web/hooks/useVoiceCapture.ts`, `/web/components/voice/*`, `/api/app/services/voice_service.py`, `/api/app/routers/voice.py`.
**Dependencies:** Phase 5.
**Done when:** Speaking "do quintal tamatar, saath sau rupaye" (or the equivalent in ≥2 supported languages) produces a pre-filled listing draft with correct crop/quantity/price fields, editable before submit, in a live demo.

### Phase 7 — Marketplace Discovery (Buyer Side)
**Build:** `GET /listings` with filters (crop, region/radius via PostGIS, price range, quality grade), buyer-facing marketplace grid + listing detail page. At this stage listings show placeholder "assessing…" for price/quality until Phases 9–10 land — build the UI to already expect those fields so no rework is needed.
**Files:** `/web/app/buyer/marketplace/*`, extends `/api/app/routers/listings.py` with query params.
**Dependencies:** Phase 5.
**Done when:** A buyer can search/filter active listings and open a detail page; empty states and pagination work.

### Phase 8 — Anonymous Seller Identity & Reveal-on-Commit
**Exists:** `anonymous_identities` created at onboarding (Phase 3); listings already store `anon_seller_id`, never a real name (Phase 5).
**Build:** Enforce at the API layer that every buyer-facing listing/order response is scrubbed of real-name/phone fields via a Pydantic response schema (`ListingPublicOut`) that simply has no identity fields to leak — not a manual filter. `POST /orders/{id}/reveal-identity`: only callable once an order reaches `confirmed` status (defined fully in Phase 11), returns real contact info to the buyer and logs `identity_revealed_at`.
**Files:** `/api/app/schemas/listing.py` (public vs internal schema split), `/api/app/routers/orders.py` (reveal endpoint stub now, wired to order state machine in Phase 11).
**Dependencies:** Phase 3, Phase 5, Phase 7.
**Done when:** Inspecting any buyer-facing API response confirms zero real-identity fields are present pre-reveal; a test asserts the reveal endpoint 403s before `confirmed` status.

### Phase 9 — AI Price Recommendation Engine
**Build:** `/api/app/ml/pricing/` — a training script that pulls real Agmarknet historical price CSVs (checked into `/api/app/ml/data/` or fetched via documented script) per crop/region, fits Prophet (or weighted moving average fallback for thin series), saves artifacts. `pricing_service.recommend_price(crop, region, quantity) -> {min, fair, max, confidence}`. `GET /pricing/recommend`. Wire into listing creation (Phase 5/6 forms): as the farmer enters crop+region+quantity, show the AI band live; store `price_ai_min/max` on the listing at submit time.
**Files:** `/api/app/ml/pricing/train.py`, `/api/app/services/pricing_service.py`, `/api/app/routers/pricing.py`, `/web/components/price-band.tsx`.
**Dependencies:** Phase 5 (listing form to attach to), real dataset.
**Done when:** For every demo crop, `GET /pricing/recommend` returns a sane band grounded in real historical data; the farmer sees this band live while creating a listing.

### Phase 10 — Produce Quality Assessment (CNN)
**Build:** `/api/app/ml/quality/` — transfer-learning MobileNetV2 fine-tuned on public produce-quality datasets for the demo crop set, saved artifact. `quality_service.assess_image(image) -> {grade, confidence}`. `POST /quality/assess` (multipart image upload). Wire into listing creation: after image upload, auto-run assessment, show grade to farmer before submit, store `quality_grade/confidence` on the listing; show the same badge on the buyer-facing listing card/detail (Phase 7).
**Files:** `/api/app/ml/quality/train.py`, `/api/app/services/quality_service.py`, `/api/app/routers/quality.py`, `/web/components/quality-badge.tsx`.
**Dependencies:** Phase 5, Phase 7.
**→ End of Person A's block. Hand off: full auth, both-side onboarding, listing CRUD (text+voice), marketplace browse, anonymity enforced, price+quality AI both live and wired into the create/browse flows.**
**Done when:** Uploading a demo-crop photo returns a real grade+confidence within a few seconds; grade is visible on both farmer and buyer views.

### Phase 11 — Orders & Transaction Lifecycle
**Exists:** Listings (with price/quality/anon ID) browsable and orderable in principle.
**Build:** Full order state machine — `pending → matched → confirmed → in_transit → delivered → settled`, plus `disputed` branch. `POST /orders` (buyer commits to a listing/quantity), `PATCH /orders/{id}/status` (role-gated transitions — e.g. only logistics can set `in_transit`), order list/detail for both farmer and buyer. Wires the Phase 8 reveal endpoint: reveal fires automatically (or via explicit farmer confirm-tap) exactly on transition into `confirmed`.
**Files:** `/api/app/services/order_service.py` (state machine logic, transition validation), `/api/app/routers/orders.py`, `/web/app/farmer/orders/*`, `/web/app/buyer/orders/*`, `/web/components/order-tracker.tsx`.
**Dependencies:** Phase 7, Phase 8.
**Done when:** A full order can be walked through every status via API/UI in the correct sequence only; illegal transitions (e.g. `pending → settled`) are rejected; identity reveal fires exactly at `confirmed`.

### Phase 12 — Reputation & Trust Scoring
**Build:** `reputation_events` writes triggered by order lifecycle (fulfillment on `delivered`, rating prompt post-`settled`, dispute on `disputed`). `reputation_service.compute_score(user_id)` — weighted formula (avg rating, fulfillment rate, dispute rate, recency-weighted). `GET /reputation/{user_id}`, `POST /reputation/events` (buyer rates farmer post-settlement and vice versa). Reputation badge shown on listing cards (Phase 7) and farmer profile.
**Files:** `/api/app/services/reputation_service.py`, `/api/app/routers/reputation.py`, `/web/components/reputation-badge.tsx`, `/web/app/*/rate/*`.
**Dependencies:** Phase 11.
**Done when:** Completing a seeded order end-to-end changes the farmer's visible reputation score; score formula is documented and testable in isolation.

### Phase 13 — Buyer–Listing Matching Engine
**Build:** `matching_service.score_match(listing, buyer) -> {score, factors}` — transparent weighted formula (price fit vs AI band, quality grade, PostGIS distance, seller reputation). `GET /matching/buyer/{id}` (ranked listings for a buyer's stated preferences/region), `GET /matching/listing/{id}` (ranked candidate buyers, used by Phase 14 pooling and useful to farmers as "likely buyers"). Wire a "Recommended for you" section into the buyer marketplace (Phase 7).
**Files:** `/api/app/services/matching_service.py`, `/api/app/routers/matching.py`, `/web/components/recommended-listings.tsx`.
**Dependencies:** Phase 7, Phase 9, Phase 10, Phase 12.
**Done when:** Ranked results visibly reflect the stated factors (verified by a unit test with crafted inputs); "Recommended for you" renders on the buyer marketplace.

### Phase 14 — Logistics Pooling & Route Optimization
**Build:** Nightly/on-demand job (`workers/pool_orders.py`) that DBSCAN-clusters same-day `confirmed`+ orders by pickup geo-proximity into `logistics_pools`, then runs Google OR-Tools capacitated VRP to sequence stops into `route_json`. `GET /logistics/pools` (open pools near a provider), `POST /logistics/pools/{id}/join`, `GET /logistics/pools/{id}/route`. Logistics-provider dashboard: pool list + Leaflet map showing clustered pickups and the solved route.
**Files:** `/api/app/workers/pool_orders.py`, `/api/app/services/logistics_service.py`, `/api/app/routers/logistics.py`, `/web/app/logistics/*`, `/web/components/route-map.tsx`.
**Dependencies:** Phase 11.
**Done when:** Running the pooling job on seeded confirmed orders produces at least one multi-order pool with a valid OR-Tools-sequenced route, visible on the provider's map.

### Phase 15 — Government Scheme Awareness
**Build:** `gov_schemes` seeded with a curated real dataset (compiled once from myscheme.gov.in / state portals — 15–20 real schemes covering common categories: subsidy, insurance, credit, equipment). `scheme_service.match_schemes(farmer_profile) -> ranked list` (rule-based eligibility matching on state/crop/land-size). `GET /schemes`, `GET /schemes/match/{farmer_id}`. Farmer-facing "Schemes for you" feed screen, simple filter by category.
**Files:** `/api/seed_schemes.py`, `/api/app/services/scheme_service.py`, `/api/app/routers/schemes.py`, `/web/app/farmer/schemes/*`.
**Dependencies:** Phase 3.
**Done when:** Each seeded farmer sees a non-empty, plausibly-relevant scheme list; matching logic is documented and testable.

### Phase 16 — Financial Inclusion: Risk Scoring + AEPS Simulated Flow
**Build:** `/api/app/ml/risk/` — XGBoost model trained on the synthetic-but-realistic bootstrapped dataset described in §2 (features: price-volatility index from Phase 9 data, quality grade history, fulfillment rate from Phase 12, reputation score). `risk_service.assess(farmer_id) -> {score, eligible_advance}`. `GET /finance/risk-score/{farmer_id}`, `POST /finance/advance-request`. Simulated AEPS cash-out: `POST /finance/aeps/simulate-cashout` mocks a BC-agent screen (Aadhaar-last-4 + mock biometric confirm click) and returns a fake NPCI-style reference + `settled` status, clearly labeled in the UI as a simulated flow with a real, swappable service interface.
**Files:** `/api/app/ml/risk/train.py`, `/api/app/services/risk_service.py`, `/api/app/routers/finance.py`, `/web/app/farmer/finance/*` (advance request + AEPS cash-out screens).
**Dependencies:** Phase 3, Phase 9, Phase 12.
**Done when:** A seeded farmer sees a risk-based eligible-advance amount, can submit a request, and can walk through the simulated AEPS cash-out to a `settled` state end-to-end in the UI.

### Phase 17 — AI-Driven Market Insights
**Build:** `insight_service.build_dashboard(region, crop) -> {avg_price_series, trend, top_demand_crops, summary_text}` aggregating real listing/order/price data; rolling-average trend detection; one Claude API call summarizing the aggregated numbers into a short natural-language insight (never fed raw personal/user data — aggregates only). `GET /insights/dashboard`. Buyer- and farmer-facing insights screen with charts (Recharts) + the generated summary text.
**Files:** `/api/app/services/insight_service.py`, `/api/app/routers/insights.py`, `/web/app/*/insights/*`, `/web/components/insight-chart.tsx`.
**Dependencies:** Phase 9, Phase 11.
**Done when:** Dashboard renders real trend charts from seeded/live data plus a coherent one-paragraph AI summary that changes when the underlying data changes.

### Phase 18 — Women-Centric Privacy & Anonymous Reporting
**Build:** `POST /reports` — farmer can file a report (underpricing, harassment, exploitation) either identified or fully anonymous (`reporter_user_id` nullable, IP/device not logged for anon reports); category selection, free-text, optional related-order link. `GET /admin/reports` moderation queue with status workflow (`open → reviewing → resolved`). Farmer-facing "Report a concern" screen reachable from the main nav (not buried), written in plain, reassuring language, with a clear explanation of what stays anonymous.
**Files:** `/api/app/routers/reports.py`, `/api/app/services/report_service.py`, `/web/app/farmer/report/*`, `/web/app/admin/reports/*`.
**Dependencies:** Phase 3, Phase 11 (optional order link).
**→ End of Person B's block. Hand off: every PPT feature is now functionally wired at least once, end to end.**
**Done when:** An anonymous report can be filed with zero identifying fields persisted, appears in the admin queue, and can be moved through the resolution workflow.

### Phase 19 — Cross-Role Integration & Notifications
**Build:** In-app notification center (order status changes, new match, scheme match, report status update) — polling or simple WebSocket, farmer's choice; email/SMS is out of scope, in-app is enough for demo. Walk every cross-role journey end-to-end and fix any seam (e.g., a status change on one role's screen not reflected on the other's) found in integration testing. No new features — only wiring/bug-fixing across everything built so far.
**Files:** touches routers/components across modules; adds `/api/app/routers/notifications.py`, `/web/components/notification-bell.tsx`.
**Dependencies:** all prior phases.
**Done when:** The full farmer→buyer→logistics→settlement journey (see §7) runs without a single broken transition or stale screen.

### Phase 20 — UI/UX Polish, Accessibility & Low-Bandwidth Optimization
**Build:** Visual consistency pass against the frontend-design conventions (typography, spacing, no default AI-slide look-alikes); large-tap-target audit for low-literacy users; image lazy-loading/compression for low-bandwidth; loading/empty/error states everywhere; PWA manifest + offline shell caching for spotty connectivity; language-switcher polish across every screen (not just listing creation).
**Files:** broad, mostly `/web/components` and `/web/app/**`.
**Dependencies:** all prior phases.
**Done when:** Every screen in the demo journey has no layout defects, loads acceptably on a throttled 3G network profile in devtools, and reads correctly in at least two supported languages.

### Phase 21 — Testing, Seed Data, Deployment & Demo Readiness
**Build:** Full seed dataset covering every feature (multiple farmers/buyers/logistics providers across ≥2 regions and ≥3 crops, pre-populated orders at various lifecycle stages, sample reports, sample advance requests) so the demo never starts from an empty state. Backend pytest suite run in CI for every router/service. Deploy: frontend to Vercel, backend to Railway/Render, DB to Supabase/Neon; environment variables documented. Write and rehearse the exact demo script (§7) at least twice, timing it.
**Files:** `/api/seed_full.py`, CI config updates, deployment configs, `/docs/demo-script.md`.
**Dependencies:** all prior phases.
**Done when:** A fresh deployment, seeded from scratch, supports the full demo script (§7) live, without local-only dependencies.

---

## 6. MVP Prioritization

**P0 — Critical (must be fully functional for submission/demo):**
Auth & roles · Farmer/buyer onboarding · Listing creation (text + voice) · Anonymous identity & reveal-on-commit · Marketplace browse/search · AI price recommendation · Produce quality assessment · Order lifecycle end-to-end · Basic reputation score.

**P1 — Important (strong evaluation, build with full depth if time allows):**
Buyer–listing matching engine · Logistics pooling & route optimization · Government scheme awareness · AI market insights dashboard · Women-centric anonymous reporting · Risk scoring + simulated AEPS flow.

**P2 — Enhancement (can receive less polish if time runs short, but must still exist and be visibly wired in):**
Admin CMS depth (scheme content management UI, full moderation workflow) · Notification center · Multi-language coverage beyond 2 languages · PWA offline shell · Advanced route-map styling.

This ordering only affects *depth of polish under time pressure* — every P1/P2 feature still gets a working phase in the roadmap above; nothing from the PPT is cut.

---

## 7. Final Demo Flow (End-to-End Story for Judges)

1. **Farmer, in regional language, by voice:** Opens the app, taps the mic, speaks a listing ("2 quintal tomato, expecting ₹18/kg") in a regional language → app transcribes, extracts structured fields, shows the **AI price band** (grounded in real mandi data) and, after a photo, the **AI quality grade** — farmer confirms and publishes anonymously.
2. **Buyer view:** A processor browses the marketplace, sees the anonymized listing with price, AI quality grade, and a reputation badge, and opens "Recommended for you" to see it AI-ranked near the top for their stated demand.
3. **Order & reveal:** Buyer places an order; status moves `pending → matched → confirmed`; identity reveals automatically at `confirmed`, and both sides now see real contact details for delivery coordination.
4. **Logistics pooling:** A second nearby farmer's confirmed order is shown clustering into the same pool; the logistics provider dashboard shows the OR-Tools-solved pooled route on a map and marks the order `in_transit`.
5. **Settlement & financial inclusion:** Order reaches `delivered` → `settled`; farmer's reputation score updates live; farmer opens the Finance tab, sees an AI risk-based eligible advance amount, requests it, and walks through the simulated AEPS cash-out (Aadhaar + mock biometric) to receive funds without a bank app.
6. **Awareness & insights:** Farmer checks the "Schemes for you" feed (matched to their crop/state) and the buyer checks the Market Insights dashboard, seeing a real trend chart plus the AI-generated natural-language summary.
7. **Safety close:** Briefly show the "Report a concern" screen to demonstrate the women-centric, anonymity-preserving safety net, and the admin queue receiving it — closing the story on trust and safety, not just transactions.

This single journey touches every major PPT feature in one coherent narrative rather than isolated screens, and is the sequence to rehearse and time before the actual evaluation.
