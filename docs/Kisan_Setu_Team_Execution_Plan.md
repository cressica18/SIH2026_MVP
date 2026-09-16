# Kisan Setu — Team Execution Plan
### 6-Person Build Plan for the SIH MVP (Team Bumble Bee 404)

This plan turns the PPT + Implementation Blueprint into a **day-to-day execution flow** for our team. Read your name, follow your rows, and check the "Dependencies" line before you start each phase.

**Teams:**
- **Backend:** Subhangi, Samaira
- **API / External Integrations:** Yoda, Samhitha
- **Frontend:** Sarah, Maansi

---

## 1. Shared Decisions — Lock These Before Building

Will be finalized later
---

## 2. Backend Split (Subhangi & Samaira)

**Subhangi — architecture & critical logic**:
- Repo scaffold, core config, DB session, JWT/security setup
- Database schema & models (owns the ERD)
- Auth & role-based access endpoints
- Listings core CRUD + anonymous-identity enforcement (buyers never see real names/phones)
- Order state machine (status transitions + identity reveal-on-confirm)
- Matching engine (ranks listings for buyers)
- AI price recommendation model (training + endpoint)
- AI quality assessment model (training + endpoint)
- Reputation scoring formula & service
- Logistics pooling backend (stores pools/routes, calls Yoda's route solver)
- Leads final cross-team integration pass (Phase 6) and deployment (Phase 7)

**Samaira — substantial, self-contained modules:**
- Farmer / buyer / logistics onboarding endpoints (profile create & edit)
- Voice-to-listing draft endpoint (turns Yoda's transcript into structured fields)
- Government schemes matching endpoint (rule-based, using Samhitha's dataset)
- Risk scoring service (XGBoost) + advance-request endpoint
- Market insights aggregation endpoint (stats + charts data; plugs in Samhitha's AI summary)
- Anonymous reporting endpoints + admin moderation queue
- Notifications endpoint
- Seed data scripts (grows every phase so the app is always demoable)

Samaira's modules are all independent enough to build without waiting on Subhangi mid-phase, but she needs the schema/auth contracts locked first.

---

## 3. API / External Integrations Split (Yoda & Samhitha)

**Yoda — voice & logistics (heavier technical share):**
- Voice/STT+TTS adapter: Web Speech API for the demo, with a documented Bhashini API adapter behind the same interface for production swap-in
- Logistics route optimization: DBSCAN clustering of nearby confirmed orders + Google OR-Tools route solving, exposed as one callable function for Backend
- Historical mandi price data pipeline (Agmarknet) — cleans and hands off real price data that Subhangi's pricing model trains on

**Samhitha — integrations & data (substantial, self-contained):**
- AEPS simulated cash-out flow (mock BC-agent screen + fake NPCI-style reference), built as a real, swappable service interface
- Government schemes dataset — curates 15–20 real schemes from myscheme.gov.in / state portals into a structured format for Samaira's matching endpoint
- Claude API call for AI market insights — turns aggregated stats into a short natural-language summary for Samaira's insights endpoint
- Geocoding/maps support for location fields used across listings and logistics

### Integration Interface Details

| Integration | Purpose | Owner | What Backend Needs From It | Input → Output | Connects Where | How It's Tested |
|---|---|---|---|---|---|---|
| Voice STT/TTS | Turn spoken listing into text | Yoda | A transcript string, per language | Audio (browser mic) → text transcript | Feeds Samaira's `/voice/extract-listing` | Speak a sample listing in 2 languages, confirm correct transcript |
| Logistics route solver | Cluster & sequence nearby orders | Yoda | A function that takes a list of confirmed orders and returns clustered pools + solved routes | Order list (lat/lng, quantity) → pools + `route_json` | Feeds Subhangi's `logistics_service.py` | Run on seeded orders, confirm valid multi-order route output |
| Mandi price data | Real historical prices for AI pricing model | Yoda | A clean per-crop/per-region price dataset | Agmarknet CSV/API → structured dataset | Feeds Subhangi's price model training | Spot-check known crop prices against source data |
| AEPS cash-out | Simulated Aadhaar+biometric cash-out | Samhitha | A function returning a fake settlement reference + status | Farmer ID + amount → `{reference, status}` | Feeds Samaira's `/finance/aeps/simulate-cashout` | Walk a seeded farmer through request → settled in UI |
| Gov schemes dataset | Real scheme data to match farmers to | Samhitha | A structured JSON list with eligibility rules | Curated research → JSON `gov_schemes` seed | Feeds Samaira's schemes matching endpoint | Every seeded farmer profile returns a non-empty, plausible match list |
| Claude API (insights) | Natural-language market summary | Samhitha | A function that takes aggregated stats and returns a short paragraph | Aggregated price/demand stats → summary text | Feeds Samaira's `/insights/dashboard` | Change underlying data, confirm summary text updates accordingly |
| Maps/geocoding | Convert address/pin to lat/lng | Samhitha | A simple lookup function | Address or map pin → `{lat, lng}` | Used in onboarding & listing creation forms | Enter a known location, confirm correct coordinates |

The rule for both Yoda and Samhitha: **never let raw third-party logic leak into the app.** Every integration is one clean function/endpoint that Backend or Frontend can call — nobody else needs to know which API is behind it.

---

## 4. Frontend Split (Sarah & Maansi)

**Sarah — the farmer journey, end to end:**
- Login / OTP screens
- Farmer onboarding (multi-step)
- Farmer home (voice mic front-and-center)
- Listing creation screen — text form + voice flow (using Yoda's voice hook)
- "My Listings" screen (status, AI price band, quality grade)
- Farmer order tracking + rating prompt
- "Schemes for you" feed
- Finance tab (advance request + AEPS cash-out screens)
- "Report a concern" screen

**Maansi — buyer, logistics, admin, and shared components:**
- Buyer & logistics onboarding
- Buyer marketplace (browse/search/filter) + listing detail page
- Buyer order flow + "Recommended for you" section
- Logistics-provider dashboard (pool list + route map)
- Admin report-review queue
- Market Insights dashboard (charts + AI summary)
- Shared components: layout/nav shell, reputation badge, notification bell, language switcher, design tokens
- PWA/offline shell + low-bandwidth optimization pass

Shared components (reputation badge, notification bell, language switcher, base layout) are owned by **Maansi**, but both use them — if Sarah needs a change to a shared component, she asks Maansi rather than editing it herself, to avoid two people changing the same file.

---

## 5. Phase-by-Phase Execution Flow

> Work through phases in order. Everyone in a phase can start their row as soon as the phase's dependency is met — you don't need to wait for teammates in the *same* phase unless your row says so.

### Phase 0 — Shared Contracts & Setup
- **Backend — Subhangi:** Scaffold monorepo (`/web`, `/api`), env files, Docker Compose for local Postgres. Draft the ERD and circulate for review. Define API conventions (auth headers, error format).
- **Backend — Samaira:** Review the ERD, set up local dev environment, draft profile schema fields with Subhangi.
- **API — Yoda:** Review Bhashini + Web Speech API docs, draft the voice adapter interface. Draft the logistics/OR-Tools approach note.
- **API — Samhitha:** Start sourcing government schemes list. Draft the AEPS simulated-flow spec. Test a basic Claude API call.
- **Frontend — Sarah:** Set up Next.js app shell, confirm farmer route folders, review design tokens.
- **Frontend — Maansi:** Set up shared component structure (shadcn), design tokens, confirm buyer/logistics/admin route folders.
- **Dependencies:** None — this is kickoff.
- **Expected result:** Repo is live, everyone can run the project locally, contracts in Section 1 are agreed.

### Phase 1 — Auth, Onboarding, Skeleton Screens
- **Backend — Subhangi:** Build OTP send/verify (dev: OTP logged to console), JWT issuance, `require_role()` dependency, `/auth/me`, `/refresh`.
- **Backend — Samaira:** Build onboarding endpoints for farmer/buyer/logistics profiles (`GET/PUT /users/profile`) plus anonymous-identity creation, using Subhangi's schema.
- **API — Yoda:** Deliver the voice adapter interface (even as a mock transcript function) so Frontend/Backend can build against it. Start the Agmarknet price data pipeline.
- **API — Samhitha:** Continue schemes research. Draft the AEPS endpoint interface (function signature, not full implementation yet).
- **Frontend — Sarah:** Build phone+OTP login screens, farmer onboarding form, farmer home shell with a placeholder mic button.
- **Frontend — Maansi:** Build buyer & logistics onboarding screens, placeholder dashboards for buyer/logistics/admin, shared layout/nav, `useAuth()` wiring.
- **Dependencies:** Phase 0 contracts and repo.
- **Expected result:** All three roles can sign up, log in via OTP, and land on their (placeholder) dashboards.

### Phase 2 — Listings Core + Voice Layer + Marketplace Browse
- **Backend — Subhangi:** Build listings CRUD, enforce anonymous seller ID in buyer-facing responses (no real name/phone ever returned), add placeholder price/quality fields to the listing schema.
- **Backend — Samaira:** Build `POST /voice/extract-listing` (turns Yoda's transcript into structured crop/quantity/price fields).
- **API — Yoda:** Deliver a working voice hook contract to Sarah and Samaira. Finalize the price-data pipeline output format for Subhangi (needed in Phase 3).
- **API — Samhitha:** Continue schemes/AEPS work. Build a simple geocoding helper for location fields.
- **Frontend — Sarah:** Build the listing creation screen (text form + mic button using Yoda's hook) and "My Listings" screen.
- **Frontend — Maansi:** Build the buyer marketplace browse/search/filter screen and listing detail page (price/quality show as "assessing…" for now).
- **Dependencies:** Phase 1.
- **Expected result:** Farmer can create a listing by text or voice; buyer can browse and search listings (AI price/quality still pending).

### Phase 3 — AI Price & Quality Models + Marketplace Polish
- **Backend — Subhangi:** Train and wire the AI price recommendation model and the produce quality CNN; integrate both into listing creation and listing responses.
- **Backend — Samaira:** Build the reputation scoring formula and `GET /reputation/{user_id}` (ready for Phase 4's order events). Expand seed data.
- **API — Yoda:** Deliver the cleaned mandi price dataset to Subhangi. Hand off the produce-quality training image set/format.
- **API — Samhitha:** Finalize the schemes dataset (15–20 real schemes) and deliver it to Samaira. Continue building the AEPS mock.
- **Frontend — Sarah:** Wire the live AI price band + quality grade into the listing creation screen.
- **Frontend — Maansi:** Wire price band + quality badge into the marketplace/listing detail page. Build the shared reputation-badge component.
- **Dependencies:** Phase 2 (listing schema, price data pipeline).
- **Expected result:** Every listing shows a real AI price band and quality grade to both farmer and buyer.

### Phase 4 — Orders, Matching & Logistics Pooling
- **Backend — Subhangi:** Build the full order state machine (pending → matched → confirmed → in_transit → delivered → settled, plus disputed), identity reveal exactly at "confirmed," and the matching engine ("Recommended for you" logic).
- **Backend — Samaira:** Wire reputation events to order lifecycle (fulfillment, rating, dispute) and the buyer/farmer rating endpoint.
- **API — Yoda:** Build the logistics route-solver (DBSCAN clustering + OR-Tools VRP) as one callable function and hand it to Subhangi.
- **API — Samhitha:** Build geocoding support for pickup/dropoff points; assist with map-tile setup for Maansi.
- **Frontend — Sarah:** Build the farmer order-tracking screen and post-settlement rating prompt.
- **Frontend — Maansi:** Build the buyer order flow, "Recommended for you" section, and the logistics-provider dashboard (pool list + route map).
- **Dependencies:** Phase 3 (listings with price/quality, reputation skeleton).
- **Expected result:** An order can move through every status correctly; nearby confirmed orders visibly pool into an optimized route on the logistics dashboard.

### Phase 5 — Government Schemes, Financial Inclusion & Market Insights
- **Backend — Subhangi:** Support/review the risk model and insights service architecture; integrate Samhitha's AI summary into the insights response.
- **Backend — Samaira:** Build the schemes matching endpoint (using Samhitha's dataset), the risk scoring service (XGBoost) + advance-request endpoint, and the insights aggregation endpoint.
- **API — Yoda:** Provide price-volatility data (from the mandi pipeline) as a risk-model input feature for Samaira.
- **API — Samhitha:** Deliver the finished AEPS simulated cash-out flow to Samaira. Deliver the Claude API insight-summary function for the insights endpoint.
- **Frontend — Sarah:** Build the "Schemes for you" feed and the Finance tab (advance request + AEPS cash-out screens).
- **Frontend — Maansi:** Build the Market Insights dashboard (charts + AI summary).
- **Dependencies:** Phase 3 (price data), Phase 4 (fulfillment/reputation data for risk scoring).
- **Expected result:** Farmer sees matched schemes and can complete a simulated AEPS cash-out; both roles see an insights dashboard with real charts and an AI-written summary.

### Phase 6 — Privacy, Reporting, Notifications & Full Integration
- **Backend — Subhangi:** Lead the full cross-role integration pass — walk every user journey end-to-end and fix any broken handoff between modules.
- **Backend — Samaira:** Build anonymous reporting endpoints (with moderation workflow) and the notifications endpoint.
- **API — Yoda:** Support integration testing on voice + logistics flows; fix adapter bugs found.
- **API — Samhitha:** Support integration testing on AEPS/schemes/insights flows; fix adapter bugs found.
- **Frontend — Sarah:** Build the "Report a concern" screen (plain, reassuring language, clear about what stays anonymous).
- **Frontend — Maansi:** Build the admin report-review queue and the shared notification bell.
- **Dependencies:** All prior phases.
- **Expected result:** The full farmer → buyer → logistics → settlement → report journey runs with no broken transitions.

### Phase 7 — Polish, Testing, Deployment & Demo Readiness
- **Backend — Subhangi:** Lead deployment (frontend → Vercel, backend → Railway/Render, DB → Supabase/Neon). Oversee the full test suite passing.
- **Backend — Samaira:** Write/pass tests for her modules; extend seed data for schemes, risk, and reports.
- **API — Yoda:** Verify voice + logistics integrations work in the deployed environment; document production swap-in notes (real Bhashini, OR-Tools at scale).
- **API — Samhitha:** Verify AEPS/schemes/insights integrations in the deployed environment; document production swap-in notes (real AEPS/NPCI, live scheme APIs).
- **Frontend — Sarah:** UI/UX polish pass on all farmer-side screens — accessibility, large tap targets, loading/empty/error states.
- **Frontend — Maansi:** UI/UX polish pass on buyer/logistics/admin screens, plus PWA/offline shell and low-bandwidth optimization.
- **All six:** Rehearse the full demo script (Section 9) at least twice, timed.
- **Dependencies:** All prior phases.
- **Expected result:** A fresh deployment, seeded from scratch, runs the entire demo live with no local-only dependencies.

---

## 6. Integration Flows — How the Pieces Connect

**Voice listing creation:**
Farmer speaks (Frontend mic) → STT via Yoda's voice adapter → transcript → Samaira's `/voice/extract-listing` → structured draft → Subhangi's `/listings` (with Subhangi's price model + quality model attached) → database → shown back to farmer on "My Listings" (Sarah's screen).

**Marketplace discovery & recommendation:**
Buyer opens marketplace (Maansi's screen) → Subhangi's `/listings` search/filter → results include AI price band + quality grade + reputation badge → Subhangi's matching engine ranks "Recommended for you" → rendered on Maansi's screen.

**Order → reveal → settlement:**
Buyer places order (Maansi's UI) → Subhangi's order state machine → status updates through `matched → confirmed` → identity reveal fires automatically → both sides see real contact info (Sarah's + Maansi's order screens) → `delivered → settled` → Samaira's reputation event fires → updated badge shown everywhere.

**Logistics pooling:**
Multiple confirmed orders in the same area → Yoda's clustering+route solver runs → Subhangi's `logistics_service` stores the pool + route → shown on Maansi's logistics dashboard map → provider marks `in_transit` → reflected on farmer/buyer order trackers (Sarah/Maansi).

**Government schemes:**
Samhitha's curated dataset → Samaira's matching endpoint (using farmer profile: state/crop/land size) → ranked scheme list → Sarah's "Schemes for you" feed.

**Financial inclusion (AEPS):**
Farmer requests advance (Sarah's Finance tab) → Samaira's risk service scores eligibility → farmer confirms → Samhitha's simulated AEPS flow → fake settlement reference returned → shown as "settled" on Sarah's screen.

**Market insights:**
Samaira's aggregation endpoint pulls real listing/order data → Samhitha's Claude API call turns the stats into a short summary → combined response → charts + summary shown on Maansi's insights dashboard.

**Anonymous reporting:**
Farmer submits report (Sarah's screen, identity optional) → Samaira's `/reports` endpoint (zero identifying fields stored if anonymous) → appears in Maansi's admin queue → status moves through the moderation workflow.

---

## 7. GitHub Collaboration Workflow

Keep it simple — one shared repo, `main` always stable.

1. **Branch per feature, not per person.** Name branches by what they touch, e.g. `backend/order-state-machine`, `api/voice-adapter`, `frontend/marketplace-browse`.
2. **Pull before you start work each day.** Always branch off the latest `main`.
3. **Push and open a PR as soon as your piece is demoable**, even if small — don't sit on large unmerged branches.
4. **Review = your pair teammate.** Subhangi reviews Samaira's backend PRs and vice versa; Yoda/Samhitha review each other's API PRs; Sarah/Maansi review each other's frontend PRs. Cross-team review is welcome but not required for merge.
5. **Merge to `main` at the end of each phase item**, not only at the end of a whole phase — smaller, frequent merges avoid painful conflicts.
6. **Conflicts:** if two people touch the same file, the person who merges *second* resolves the conflict, and pings the other person if unsure which version is correct.
7. **`main` must always run.** Never merge a broken build — if your PR breaks the app, fix it before merging, not after.
8. **End-of-phase sync:** before moving to the next phase, everyone pulls the latest `main` and confirms their part of the demo still works against everyone else's changes.

---

## 8. Responsibility Matrix

● = primary owner  ○ = supporting/consumer

| Feature | Subhangi | Samaira | Yoda | Samhitha | Sarah | Maansi |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Auth & OTP | ● | | | | ○ | |
| DB schema / ERD | ● | ○ | | | | |
| Farmer/buyer/logistics onboarding | | ● | | | ○ | ○ |
| Listings CRUD & anonymous ID | ● | | | | ○ | ○ |
| Voice/STT adapter | | | ● | | ○ | |
| Voice-to-listing extraction | | ● | ○ | | ○ | |
| AI price recommendation | ● | | ○ | | ○ | ○ |
| Produce quality assessment (CNN) | ● | | ○ | | ○ | ○ |
| Marketplace browse/search | ● | | | | | ● |
| Order state machine & reveal | ● | | | | ○ | ○ |
| Matching engine | ● | | | | | ○ |
| Reputation scoring | | ● | | | ○ | ○ |
| Logistics route optimization | ○ | | ● | | | |
| Logistics pooling backend | ● | | ○ | | | ○ |
| Government schemes dataset | | ○ | | ● | | |
| Government schemes matching | | ● | | ○ | ○ | |
| Risk scoring (advance eligibility) | | ● | ○ | | ○ | |
| AEPS simulated cash-out | | ○ | | ● | ○ | |
| Market insights aggregation | | ● | ○ | ○ | | ○ |
| AI insight summary (Claude API) | | ○ | | ● | | ○ |
| Anonymous reporting | | ● | | | ● | ○ |
| Admin moderation queue | | ○ | | | | ● |
| Notifications | | ● | | | ○ | ● |
| Shared components (badges, nav, language switcher) | | | | | ○ | ● |
| PWA / offline / low-bandwidth polish | | | | | | ● |
| Deployment | ● | ○ | ○ | ○ | ○ | ○ |

---

## 9. Parallel Development Plan

At every phase, all six people can work at the same time — this is what keeps the timeline short:

| Phase | Subhangi | Samaira | Yoda | Samhitha | Sarah | Maansi |
|---|---|---|---|---|---|---|
| 0 | Repo + ERD | Env setup | Voice/OR-Tools research | Schemes/AEPS research | App shell | Component structure |
| 1 | Auth backend | Onboarding backend | Voice interface draft | AEPS interface draft | Login + farmer onboarding UI | Buyer/logistics onboarding UI |
| 2 | Listings CRUD | Voice extraction endpoint | Voice hook + price pipeline | Geocoding helper | Listing creation UI | Marketplace browse UI |
| 3 | Price + quality AI models | Reputation service | Price/quality data handoff | Schemes dataset finalized | Price/quality UI (farmer) | Price/quality UI (buyer) |
| 4 | Order state machine + matching | Reputation events | Logistics route solver | Geocoding for logistics | Order tracking (farmer) | Order flow + logistics dashboard |
| 5 | Insights integration support | Schemes/risk/insights endpoints | Risk data feed | AEPS + Claude integration | Schemes + Finance UI | Insights dashboard |
| 6 | Cross-role integration lead | Reports + notifications backend | Voice/logistics QA | AEPS/schemes/insights QA | Report screen | Admin queue + notification bell |
| 7 | Deployment lead | Testing + seed data | Voice/logistics deployment check | AEPS/schemes deployment check | Farmer-side polish | Buyer-side polish + PWA |

---

## 10. Integration Checkpoints

The whole team comes together (not just async PRs) at these points:

- **End of Phase 1:** Confirm all three roles can log in and reach their dashboards — no auth issues blocking anyone.
- **End of Phase 2:** Confirm a listing created via voice or text shows up correctly in the marketplace.
- **End of Phase 3:** Confirm AI price band and quality grade appear correctly on both farmer and buyer sides — this is a core demo moment, test it thoroughly.
- **End of Phase 4:** Walk a full order end-to-end (place order → confirm → reveal → logistics pool → delivered) as a team, live.
- **End of Phase 5:** Confirm schemes, AEPS cash-out, and insights dashboard all work against real seeded farmers.
- **End of Phase 6:** Full team run-through of every user journey, hunting for broken handoffs.
- **End of Phase 7:** Two full timed rehearsals of the demo script on the deployed (not local) version.

---

## 11. Final MVP Flow — The Demo Story

This is what the finished prototype should support, start to finish:

1. **Farmer, by voice, in a regional language:** Opens the app, taps the mic, speaks a listing ("2 quintal tomato, ₹18/kg"). The app transcribes it, extracts the details, shows the AI price band and (after a photo) the AI quality grade. Farmer confirms and publishes anonymously.
2. **Buyer:** Browses the marketplace, sees the anonymized listing with price, quality grade, and reputation badge, and finds it AI-ranked under "Recommended for you."
3. **Order & reveal:** Buyer places an order. Status moves pending → matched → confirmed. Identity reveals automatically at "confirmed" — both sides see real contact details.
4. **Logistics pooling:** A second nearby farmer's order clusters into the same pool. The logistics dashboard shows the optimized route; the order moves to "in_transit."
5. **Settlement & financial inclusion:** Order reaches delivered → settled. Farmer's reputation updates live. Farmer checks the Finance tab, sees an AI risk-based advance amount, requests it, and completes the simulated AEPS cash-out.
6. **Awareness & insights:** Farmer checks "Schemes for you" (matched to crop/state); buyer checks the Market Insights dashboard with real trend charts and an AI-written summary.
7. **Safety close:** Show the "Report a concern" screen and the admin queue receiving it — closing on trust and safety, not just transactions.

Rehearse this exact sequence, timed, before the evaluation.
