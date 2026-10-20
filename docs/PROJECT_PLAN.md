# AI Freelancer Assistant — Technical Delivery Plan

| | |
|---|---|
| **Document** | Technical Delivery Plan v1.0 |
| **Date** | 20 October 2026 |
| **Engagement length** | 5 working days (plus a half-day buffer, see §10) |
| **Status** | Draft for client sign-off |

---

## 1. Executive Summary

We will build a responsive web application that lets freelancers produce their everyday business documents with AI: proposals, cover letters, gig descriptions, client replies, invoices, contracts and pricing estimates. Every generated document is saved to the user's history and can be edited, copied, regenerated and exported to PDF.

The system is a React single-page app talking to a Node.js/Express REST API, backed by PostgreSQL. All AI calls go through the server. The browser never sees an AI key. Work is split into five daily milestones that match the client brief. Each day ends with a deployed, demonstrable increment rather than one big release on Day 5.

**Key decisions at a glance**

| Concern | Decision | Why |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS | The brief recommends React. Vite builds fast. TypeScript catches errors early. Tailwind gives a responsive UI and dark mode quickly. |
| Backend | Node.js 24 LTS + Express + TypeScript | One language across the stack, a large ecosystem, and it fits the brief. |
| Database | PostgreSQL (Neon, managed) + Prisma ORM | The data is relational (users → clients → invoices). Prisma gives typed queries and versioned migrations. |
| AI | Google Gemini (primary) behind a provider interface, OpenAI as a pluggable alternative | Gemini has a free tier, which keeps demo costs low. The interface lets us switch providers without touching feature code. |
| Auth | JWT access token (15 min) + rotating refresh token in an httpOnly cookie | Meets the "JWT" requirement without storing tokens in localStorage, where XSS could steal them. |
| PDF | `@react-pdf/renderer` on the client | No headless Chrome on the server, so it runs on free hosting tiers. Output is consistent and branded. |
| Hosting | Vercel (frontend), Render (API), Neon (DB), Cloudinary (avatars) | All four have free tiers. GitHub pushes deploy automatically. |

---

## 2. Scope

### 2.1 In scope (core — from brief)
1. Authentication: register, login, logout, forgot/reset password, session management, optional email verification.
2. Dashboard with widgets: proposals, cover letters, active clients, invoices, AI credits, recent activity, quick actions.
3. Proposal generator (full CRUD, history, copy, PDF export, regenerate, tone selection).
4. Cover letter generator (generate, save, history, regenerate).
5. Gig description generator (description, SEO keywords, FAQs).
6. Smart pricing calculator (deterministic calculation + AI suggestions).
7. Client reply generator (tone, copy, save).
8. Invoice generator (line items, tax, due date, PDF).
9. Contract generator (AI-drafted contract, PDF).
10. Unified history across all document types.
11. Profile (edit, avatar upload, change password) and settings (theme, own API key, notifications, language).
12. Hardening: validation, error handling, loading states, rate limiting, security headers.
13. Deployment, README, API documentation, database dump, demo video.

### 2.2 Bonus features (prioritised, delivered only if core is green)
| Priority | Feature | Effort | Notes |
|---|---|---|---|
| P1 | Dark/Light mode | XS | Built in from Day 1 via Tailwind. Effectively free. |
| P1 | Proposal templates | S | Seeded templates the user can start from. |
| P1 | Analytics dashboard | S | Charts over existing data (documents per week, invoice totals). |
| P2 | AI grammar checker | S | Reuses the AI service with one new prompt. |
| P2 | AI client risk score | S | Scores a client message or brief for red flags. |
| P2 | Multi-language support | M | i18n framework added Day 5. English plus one more language. |
| P3 | AI chat assistant, voice input, admin panel, email notifications, export reports | M–L | Proposed as a Phase 2 engagement. |
| Out | Subscription plans, payment gateway | L | Needs a commercial and legal decision first. Phase 2. |

### 2.3 Assumptions
- The client supplies, or approves us creating, accounts for Gemini/OpenAI, Neon, Render, Vercel, Cloudinary and an email provider (Resend).
- AI-generated contracts are **templates, not legal advice**. A disclaimer is shown in the UI and on every exported PDF.
- One currency per invoice. Currency is chosen per user in settings (default USD).
- English is the primary language. Generation can be requested in other languages through the prompt.

---

## 3. System Architecture

```
┌──────────────────────────┐      HTTPS / JSON       ┌───────────────────────────────┐
│  React SPA (Vercel)      │ ──────────────────────▶ │  Express API (Render)         │
│  - React Router          │   Bearer access token   │  ┌─────────────────────────┐  │
│  - TanStack Query        │ ◀────────────────────── │  │ Routes → Controllers    │  │
│  - React Hook Form + Zod │   httpOnly refresh      │  │   → Services → Prisma   │  │
│  - @react-pdf/renderer   │   cookie                │  └─────────┬───────────────┘  │
└──────────────────────────┘                         │            │                  │
                                                     │   ┌────────▼────────┐         │
                                                     │   │  AI Service     │──────────────▶ Gemini / OpenAI
                                                     │   │  (provider-     │         │
                                                     │   │   agnostic)     │         │
                                                     │   └─────────────────┘         │
                                                     └──────┬──────────────┬─────────┘
                                                            │              │
                                                   ┌────────▼───┐   ┌──────▼──────┐   Resend (email)
                                                   │ PostgreSQL │   │ Cloudinary  │
                                                   │  (Neon)    │   │ (avatars)   │
                                                   └────────────┘   └─────────────┘
```

### 3.1 Backend layering
- **Routes**: URL plus middleware (auth, validation, rate limit) only.
- **Controllers**: turn the HTTP request into a service call and shape the response.
- **Services**: business logic (credit deduction, price calculation, prompt assembly).
- **Prisma**: data access. Every query is scoped by `userId`, which blocks IDOR at the service layer.
- **AI Service**: a single `generate(promptKey, input, options)` entry point. Prompt templates are versioned files, not inline strings, so they can be tuned without touching feature code.

### 3.2 Repository layout (monorepo, npm workspaces)
```
ai-freelancer-assistant/
├── apps/
│   ├── web/                 # React + Vite
│   │   └── src/{pages,components,features/<module>,hooks,lib,pdf,i18n}
│   └── api/                 # Express
│       ├── src/{routes,controllers,services,middleware,ai/prompts,utils}
│       └── prisma/{schema.prisma,migrations,seed.ts}
├── packages/
│   └── shared/              # Zod schemas + TS types shared by web and api
├── docs/                    # This plan, API docs, ERD, demo script
├── .github/workflows/ci.yml # Lint, typecheck, test on every PR
└── README.md
```
The `shared` package matters: the **same Zod schema validates a form in the browser and the request body on the server**, so validation rules cannot drift apart.

---

## 4. Data Model

All tables have `id` (cuid), `createdAt`, `updatedAt`. All document tables have `userId` (FK, cascade delete) and an index on `(userId, createdAt DESC)` for history queries.

| Table | Key columns | Notes |
|---|---|---|
| **User** | email (unique), passwordHash, emailVerifiedAt, aiCredits (default 100), role | scrypt (Node built-in, OWASP parameters). |
| **UserProfile** | userId (1:1), fullName, title, bio, skills[], hourlyRate, portfolioUrl, avatarUrl, location | Used to pre-fill generator forms. |
| **UserSettings** | userId (1:1), theme, language, currency, notifyEmail, aiProvider, encryptedApiKey | API key encrypted with AES-256-GCM. Only the last 4 characters are ever returned. |
| **RefreshToken** | userId, tokenHash, expiresAt, revokedAt, userAgent | Rotation and reuse detection. Supports "log out all devices". |
| **PasswordResetToken** / **EmailVerificationToken** | userId, tokenHash, expiresAt, usedAt | Single use, 30 min / 24 h expiry. |
| **Client** | name, email, company, address, status (active/archived) | *Not in the brief, but required:* it powers the "Active Clients" widget and auto-fills invoices and contracts. |
| **Proposal** | clientId?, clientName, projectTitle, projectDescription, skills[], budget, timeline, tone, content, version | |
| **CoverLetter** | jobTitle, companyName, experience, skills[], portfolioUrl, tone, content | |
| **GigDescription** | category, skills[], experienceLevel, deliveryDays, features[], revisions, description, seoKeywords[], faqs (JSON) | |
| **PricingEstimate** | hourlyRate, estimatedHours, complexity, urgency, additionalCharges (JSON), taxRate, subtotal, total, aiSuggestion (JSON) | Pricing history. |
| **ClientReply** | clientMessage, tone, reply | |
| **Invoice** | invoiceNumber (unique per user), clientId, projectDetails, issueDate, dueDate, taxRate, subtotal, taxAmount, total, status (draft/sent/paid/overdue), notes | Money stored as `Decimal(12,2)`, never float. |
| **InvoiceItem** | invoiceId, description, quantity, unitPrice, amount | |
| **Contract** | clientId, freelancerDetails (JSON), scope, timeline, paymentTerms, terms, content, status | |
| **AiUsage** | userId, feature, provider, model, inputTokens, outputTokens, creditsUsed, success | Audit trail, credit accounting and cost monitoring. |
| **Activity** | userId, type, entityType, entityId, summary | Feeds the "Recent Activity" widget. |

An ERD diagram (`docs/erd.png`) is generated from the Prisma schema and delivered with the database dump.

---

## 5. AI Integration Design

**Provider abstraction**
```ts
interface AIProvider {
  generate(req: { system: string; prompt: string; json?: boolean; maxTokens?: number }): Promise<{ text: string; usage: Usage }>;
}
// GeminiProvider, OpenAIProvider. Chosen per request:
// the user's own key (if set in Settings) → otherwise the platform key.
```

**Prompt engineering**
- One versioned template per feature (`ai/prompts/proposal.v1.ts`). Each has a system prompt (role, rules, output format) and a user prompt built from validated inputs.
- **Structured output.** Gig and pricing generations ask for JSON and are checked with Zod. If parsing fails, we retry once with a repair instruction before showing an error.
- **Tone** comes from a fixed enum (Professional, Friendly, Persuasive, Formal, Concise), so prompts stay predictable.
- **Profile context.** The user's name, title, skills and experience are injected automatically, so output is personalised without retyping.
- **Prompt-injection hygiene.** User text (especially pasted client messages) is wrapped in delimiters and the model is told to treat it as data. The model's output is never executed or rendered as raw HTML.

**Credits & cost control**
- Each generation costs 1 credit (contracts cost 2). The deduction is an atomic DB update (`WHERE aiCredits >= cost`), so concurrent requests cannot overspend.
- If the provider fails, the credit is refunded in the same transaction.
- Users who bring their own API key are not charged credits.
- Rate limit: 20 AI requests per user per minute, plus 30 s timeouts and exponential backoff on 429/5xx.

**Regenerate** re-runs with the same inputs and a higher temperature. The previous version is kept until the user saves.

---

## 6. Security Plan

| Area | Control |
|---|---|
| Passwords | scrypt via Node `crypto` (N=2^14, r=8, p=5, random salt, constant-time compare). 8–128 characters, with complexity checked by Zod. |
| Tokens | Short-lived access JWT held in memory. Refresh token in an `httpOnly; Secure; SameSite` cookie, rotated on each use, with reuse detection. |
| Authorization | Every query is scoped by `userId`. Requesting another user's document returns 404, not 403, so we don't confirm the record exists. |
| Input | Zod validation on every endpoint. Prisma parameterises all SQL. React escapes output. Markdown is rendered with sanitisation. |
| Transport & headers | HTTPS only. `helmet`. CORS restricted to the frontend origin. |
| Abuse | `express-rate-limit` on auth (5 attempts / 15 min) and AI endpoints. Forgot-password returns the same response whether or not the account exists, so emails can't be enumerated. |
| Secrets | `.env` only, never committed. User API keys encrypted at rest. A `.env.example` is provided. |
| Uploads | Avatars only: images, at most 2 MB, MIME type checked, stored on Cloudinary rather than our server. |
| Dependencies | `npm audit` in CI. Dependabot enabled on the repo. |

---

## 7. API Surface (summary)

Base path `/api/v1`. All responses use `{ data }` or `{ error: { code, message, details } }`. Full docs are delivered as an OpenAPI 3 spec served at `/api/docs` (Swagger UI), plus a Postman collection.

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `GET /auth/me` |
| Dashboard | `GET /dashboard/stats`, `GET /dashboard/activity` |
| Clients | `GET/POST /clients`, `GET/PATCH/DELETE /clients/:id` |
| Proposals | `GET/POST /proposals`, `GET/PATCH/DELETE /proposals/:id`, `POST /proposals/generate` |
| Cover letters | same pattern under `/cover-letters` |
| Gigs | same pattern under `/gigs` |
| Pricing | `POST /pricing/calculate` (deterministic, no credit), `POST /pricing/suggest` (AI), `GET /pricing/history`, `DELETE /pricing/:id` |
| Replies | same CRUD + generate pattern under `/replies` |
| Invoices | CRUD under `/invoices`, `PATCH /invoices/:id/status` |
| Contracts | CRUD + generate under `/contracts` |
| History | `GET /history?type=&q=&page=` (unified, paginated, searchable) |
| Profile & settings | `GET/PATCH /profile`, `POST /profile/avatar`, `PATCH /auth/password`, `GET/PATCH /settings`, `PUT/DELETE /settings/api-key`, `DELETE /account` |

Generation is deliberately **separate from saving**: `generate` returns a draft, and the user edits it and then saves with `POST`. This matches the brief's "Generate → Edit → Save" flow and means half-finished drafts never pile up in the database.

---

## 8. Day-by-Day Delivery Plan

Each day ends with: code merged to `main` → CI green → auto-deployed → 10-minute demo to the client.

### Day 1 — Foundation, Authentication & Dashboard
| # | Task | Output |
|---|---|---|
| 1.1 | Monorepo scaffold, TypeScript, ESLint/Prettier, CI workflow | Repo builds and lints in CI |
| 1.2 | Provision Neon, Render, Vercel, and wire environment variables | Empty app live at a URL **on Day 1** (removes deployment risk early) |
| 1.3 | Prisma schema: User, UserProfile, UserSettings, tokens, Client, Activity, AiUsage. First migration and seed script | DB connected |
| 1.4 | Auth API: register, login, refresh, logout, me, forgot/reset password via Resend, email verification (optional flag) | Auth endpoints with tests |
| 1.5 | Frontend shell: router, protected routes, auth context, Axios interceptor with silent refresh, app layout (sidebar, topbar, mobile drawer), theme toggle | |
| 1.6 | Auth pages: Login, Register, Forgot, Reset | |
| 1.7 | Dashboard: stat widgets, recent activity, quick actions, AI credit meter. Real counts with empty states | |

**Acceptance:** a new user can register, verify, log in, refresh the page and stay logged in, reset a forgotten password, and see a dashboard of zero-state widgets on mobile and desktop.

### Day 2 — Proposals, Cover Letters & AI Core
| # | Task |
|---|---|
| 2.1 | AI service: provider interface, Gemini + OpenAI adapters, credit deduct/refund transaction, usage logging, timeout/retry, rate limit |
| 2.2 | Prompt templates v1: proposal and cover letter |
| 2.3 | Proposal module: form (client, title, description, skills chips, budget, timeline, tone), generate → rich-text editor → save, list with search/pagination, view/edit/delete, copy to clipboard, regenerate |
| 2.4 | Reusable `<DocumentEditor>`, `<GenerateButton>` (loading/streaming state) and `<DocumentList>` components. Days 3–4 reuse them, which is what keeps those days feasible |
| 2.5 | PDF export: shared branded layout with `@react-pdf/renderer` |
| 2.6 | Cover letter module, built from the same components |
| 2.7 | Activity log hooked into dashboard |

**Acceptance:** proposal and cover-letter flows work end to end. Credits go down on use and are refunded on failure. PDF downloads correctly.

### Day 3 — Gig Descriptions & Smart Pricing
| # | Task |
|---|---|
| 3.1 | Gig generator: category, skills, level, delivery, features, revisions → JSON output (description, SEO keywords, FAQs), rendered as editable sections |
| 3.2 | Pricing calculator, **deterministic and free**: `base = rate × hours`, then complexity multiplier (1.0 / 1.25 / 1.5), urgency multiplier (1.0 / 1.2 / 1.5), plus itemised extras and optional tax. Updates live as you type, with a breakdown table |
| 3.3 | AI pricing suggestions (on demand): suggested price range, recommended delivery time, market positioning analysis, improvement tips. Clearly labelled as an estimate |
| 3.4 | Pricing history list and "use this price in a proposal/invoice" shortcut |
| 3.5 | Check the pricing formula against hand-calculated examples (money maths must be exact) |

**Acceptance:** gig output saves and re-opens correctly. Calculator totals match the hand-checked test cases. AI suggestion returns valid structured data.

### Day 4 — Client Replies, Invoices & Contracts
| # | Task |
|---|---|
| 4.1 | Client reply generator: paste message, choose tone, generate, copy, save |
| 4.2 | Clients CRUD page (lightweight). Invoices and contracts auto-fill from it |
| 4.3 | Invoice builder: client picker, project details, dynamic line items, tax, due date, auto-numbered `INV-2026-0001`, live totals, status workflow. Totals recalculated **on the server**, never trusted from the client |
| 4.4 | Invoice PDF: professional template with freelancer details from profile |
| 4.5 | Contract generator: client + freelancer details, scope, timeline, payment terms, custom T&Cs → AI-drafted contract, editable, PDF with signature blocks and legal disclaimer |

**Acceptance:** all three modules save, list and export. Invoice totals match hand-calculated examples.

### Day 5 — History, Profile, Settings, Hardening & Launch
| # | Task |
|---|---|
| 5.1 | Unified history page: tabs per type, search, date filter, pagination |
| 5.2 | Profile: edit details, avatar upload (Cloudinary), change password (revokes other sessions) |
| 5.3 | Settings: theme, language (i18n scaffold, EN plus one), notifications, bring-your-own API key (masked, test-connection button), delete account |
| 5.4 | Hardening pass: error boundaries, toast notifications, skeleton loaders, 404/500 pages, form validation messages, API error mapping |
| 5.5 | Performance: route-level code splitting, lazy-loaded PDF library, query caching, DB indexes verified, Lighthouse ≥ 90 |
| 5.6 | QA: full regression with the test checklist (§9), cross-browser and mobile check |
| 5.7 | Deliverables: README, OpenAPI docs, Postman collection, `pg_dump` database file with seed demo data, ERD, demo video |

---

## 9. Quality Assurance

Testing is manual, matching the brief's "Final Testing" requirement. Automated tests are out of scope for this engagement.

| When | How | What is checked |
|---|---|---|
| Every step | curl / browser, per the step's "Done when" | The feature just built works, including its error cases |
| Every push | CI: lint + typecheck | Code style and type errors |
| Day 5 (Final Testing) | Release checklist | Every auth flow, ownership checks (another user's document → 404), credit deduction/refund, invoice and pricing totals against hand-calculated examples. Chrome, Firefox, Safari, Edge. 360 px, 768 px and 1440 px widths. Keyboard navigation |

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 5-day timeline is tight for 7 modules | High | High | Shared components (Day 2) make Days 3–4 mostly configuration. Bonus features are strictly gated. Half-day buffer reserved. |
| AI API outage or quota exhaustion | Medium | High | Second provider wired in. Credits refunded on failure. Clear user-facing error. |
| Free-tier cold starts (Render sleeps after inactivity) | High | Low | Keep-alive ping during demo. Recommend the paid tier ($7/mo) for production. |
| Inconsistent AI output format | Medium | Medium | JSON mode + Zod validation + one auto-repair retry. |
| AI cost overrun | Low | Medium | Credit system, per-user rate limits, token caps per request, AiUsage reporting. |
| Legal reliance on AI contracts | Medium | High | Persistent disclaimer in the UI and PDF. Recommend lawyer review of the base template. |
| Email deliverability (reset emails in spam) | Medium | Medium | Verified sending domain on Resend. Fallback reset link logged in dev only. |

---

## 11. Deliverables Checklist (maps 1:1 to the brief)

- [ ] Complete working application — live URL
- [ ] Responsive UI (mobile, tablet, desktop)
- [ ] Fully functional backend + API
- [ ] Database integration + `database.sql` dump with demo data + ERD
- [ ] AI API integration (Gemini, with OpenAI switchable)
- [ ] CRUD on all document types
- [ ] Authentication system (JWT, refresh, reset, verify)
- [ ] PDF export (proposals, invoices, contracts, cover letters)
- [ ] GitHub repository with clean commit history and CI
- [ ] README (setup, env vars, architecture, screenshots)
- [ ] API documentation (Swagger UI + Postman collection)
- [ ] Project documentation (this plan, updated to as-built)
- [ ] Demo video, 5–10 min (scripted: onboarding → each module → settings → mobile view)
- [ ] Demo account credentials for evaluators

---

## 12. Running Costs (estimate)

| Service | Demo / evaluation | Small production (≈500 users) |
|---|---|---|
| Vercel | Free | Free – $20/mo |
| Render API | Free | $7/mo |
| Neon Postgres | Free | $19/mo |
| Cloudinary | Free | Free |
| Resend | Free (3k emails/mo) | Free – $20/mo |
| Gemini API | Free tier | ≈ $10–40/mo depending on usage |
| **Total** | **$0** | **≈ $40–110/mo** |

---

## 13. Phase 2 Roadmap (post-delivery proposal)
1. Subscription plans + Stripe (credit packs, Pro tier).
2. AI chat assistant with document context (RAG over the user's own history).
3. Admin panel (users, usage, credit grants, prompt version management).
4. Email notifications (invoice due reminders, overdue alerts).
5. Voice-to-text input, AI portfolio analyzer, resume builder.
6. Export reports to PDF/Excel, and a client portal for invoice viewing and payment.

---

## 14. Sign-off Needed Before Day 1
1. Confirm stack (§1). Alternatives such as MongoDB or Django are possible, but the timeline assumes this stack.
2. Provide or approve creation of third-party accounts (§2.3).
3. Confirm default AI credit allowance per user (proposed: 100).
4. Brand assets (logo, primary colour) for the UI and PDF templates. Otherwise we use a neutral house style.
5. Confirm second language for i18n (if required).
