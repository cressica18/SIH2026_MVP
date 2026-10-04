# Kabadiwala Connect (कबाड़ीवाला कनेक्ट) — SIH 2026 MVP

> **Problem Statement SIH26229:** Smart & Verified Lot Pooling & Commerce Platform connecting informal Kabadiwalas / Collectors directly with Authorized Recyclers.

---

## Executive Summary

Kabadiwala Connect is a **direct scrap collector-to-recycler digital commerce and smart pooling platform** that eliminates middleman exploitation in the informal waste supply chain. It protects collector identities until transaction confirmation and aggregates small, fragmented scrap lots (metal, plastic, paper, e-waste, rubber, glass) into high-volume Smart Pools required by industrial recycling facilities.

---

## Key Value Propositions & Technical Architecture

| Informal Scrap Problem | Kabadiwala Connect Solution | Implementation File(s) |
| :--- | :--- | :--- |
| **Price opacity & cartel collusion** — Collectors sell at arbitrary local yard rates without benchmarks | `marketService.ts` provides AI price bands [Min - Fair - Max] benchmarked against regional scrap market trends | `server/src/services/marketService.ts` |
| **Middleman exploitation & harassment** — Brokers capture collector contacts early to force underpricing | `scrapLotController.ts` enforces anonymous `KABAD-XXXXX` listings; real identity is revealed **only on offer acceptance** | `server/src/controllers/scrapLotController.ts` |
| **Low-volume fragmentation** — Recyclers require multi-ton lots, ignoring small individual collectors | `smartPoolController.ts` clusters compatible nearby lots by material category, weight, and pickup window into Verified Smart Pools | `server/src/controllers/smartPoolController.ts` |
| **Quality disputes at handover** — Recyclers dispute purity or grade upon pickup | `qualityService.ts` runs CNN-simulated material quality grading (Grade A/B/C + purity, defect %, and firmness scores) | `server/src/services/qualityService.ts` |
| **Digital literacy barriers** — Informal collectors struggle with complex text interfaces | Multilingual Web Speech API STT voice input in 5 regional languages (Hindi, Marathi, Telugu, Punjabi, English) extracts material, weight, and price | `src/hooks/useVoiceCapture.ts`, `server/src/services/voiceService.ts` |
| **Cash flow bottlenecks** — Delayed payments for daily-wage collectors | AI Risk Scoring + AEPS Banking Correspondent biometric cash-out simulator for instant advances | `server/src/services/riskService.ts`, `src/components/AepsModal.tsx` |

---

## Core Roles & Workflows

### 1. Kabadiwala / Collector (PRIMARY ROLE)
- **Voice & Manual Lot Creation:** Speak or type scrap lot details (e.g. "500 kg copper wire, 620 rupees per kg").
- **AI Material Quality & Price Band:** Automatic CNN quality scan and benchmark market pricing.
- **Smart Pools:** Join compatible lots into high-value bulk pools or create new ones.
- **Offer Acceptance:** Review competitive offers from authorized recyclers, accept terms, and unlock handover reference codes.
- **AEPS Cash-Out:** Access working capital advances and simulate biometric cash withdrawals.

### 2. Authorized Recycler (SECONDARY ROLE)
- **Browse Smart Pools:** Filter verified pools by material category (metal, plastic, paper, e-waste, glass, rubber, mixed) and district.
- **Competitive Bidding:** Submit formal price-per-kg offers with transport terms.
- **Settlement & Pickup:** Confirm deals, verify handover QR/reference codes upon physical pickup, and issue digital receipts.

### 3. Admin & Whistleblower Safety
- **100% Anonymous Reporting:** Whistleblower portal for reporting cartel underpricing or middleman harassment without storing personal PII.
- **Moderation Queue:** Admin dashboard to triage, review, and resolve safety reports.

---

## End-to-End Deal Flow

```
[ Collector ] ---> Voice Input / Photo Upload ---> AI Quality & Price Band
       |
       v
[ Scrap Lot ] ---> Join / Form ---> [ Smart Pool ]
                                           |
                                           v
[ Recycler ] <--- Browse & Bids <--- [ Bidding Open ]
       |
       +---> Accepts Offer ---> [ Deal Confirmed ] ---> Identity & Reference Unlocked
                                      |
                                      v
                                [ QR/Reference Handover & Settlement ]
```

---

## API Summary

- `POST /api/auth/otp/send` — Request secure 6-digit OTP
- `POST /api/auth/otp/verify` — Verify OTP and receive JWT access/refresh tokens
- `GET /api/scrap-lots` — List active scrap lots (PII scrubbed)
- `POST /api/scrap-lots` — Create new scrap lot
- `GET /api/smart-pools` — List active smart pools
- `POST /api/smart-pools/join` — Join a scrap lot to a smart pool
- `POST /api/smart-pools/offers` — Submit recycler bid for a smart pool
- `POST /api/smart-pools/offers/respond` — Accept or reject recycler offer
- `POST /api/smart-pools/settlements/complete` — Verify QR/reference code and complete handover
- `POST /api/voice/extract-listing` — Natural language speech extraction
- `POST /api/quality/assess` — CNN material quality assessment
- `POST /api/reports` — Submit anonymous safety report
- `GET /api/reports/admin` — Admin moderation queue

---

## Verification & Test Commands

```bash
# Run Vitest test suite
npm test

# Run TypeScript linting
npm run lint
npm run lint:server

# Production build
npm run build
```
