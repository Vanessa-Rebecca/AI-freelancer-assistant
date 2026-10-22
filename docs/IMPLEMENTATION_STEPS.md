# Implementation Steps

The build order for [PROJECT_PLAN.md](PROJECT_PLAN.md), broken into small steps. **Each step is one commit.** Finish the step, check its "Done when", then commit with the message given.

## How we work

**Branches.** Make one branch per day and merge it into `main` at the end of that day:
```bash
git checkout -b day-1/foundation      # start of day
# ... steps, one commit each ...
git push -u origin day-1/foundation   # open a PR → merge into main → Vercel/Render redeploy
```

**Commit messages** follow [Conventional Commits](https://www.conventionalcommits.org): `type(scope): summary`.
`feat` new feature · `fix` bug fix · `chore` tooling/config · `docs` documentation · `refactor` code change with no behaviour change · `perf` performance · `ci` pipeline.

**Before every commit**
```bash
npm run lint && npm run typecheck    # from Step 0.3 onwards
git status                           # make sure no .env or secrets are staged
git add -A && git commit -m "<message from the step>"
```

---

## Day 0 — Repository setup (before Day 1, about 1 hour)

| Step | What to do | Done when | Commit message |
|---|---|---|---|
| 0.1 | Add `README.md` (title + one line), `.gitignore` (node_modules, dist, .env*, coverage), `.editorconfig`, and both docs files | `git status` is clean after the commit | `docs: add project plan and implementation steps` |
| 0.2 | Root `package.json` with npm workspaces `apps/*`, `packages/*`; `.nvmrc` (24) | `npm install` runs | `chore: set up npm workspaces monorepo` |
| 0.3 | Shared `tsconfig.base.json`, ESLint + Prettier configs, root scripts `lint`, `typecheck`, `format` | `npm run lint` passes | `chore: add TypeScript, ESLint and Prettier config` |
| 0.4 | Create the GitHub repo, push `main`, protect `main` (require PR + CI) | Repo visible on GitHub | *(no commit, just push)* |

---

## Day 1 — Foundation, Authentication & Dashboard

Branch: `day-1/foundation`

### Backend skeleton
| Step | What to do | Done when | Commit message |
|---|---|---|---|
| 1.1 | `apps/api`: Express + TS, `src/app.ts` / `src/server.ts`, `helmet`, `cors`, `cookie-parser`, JSON body limit, `GET /api/v1/health` | `curl localhost:4000/api/v1/health` → `{ "data": { "status": "ok" } }` | `feat(api): scaffold Express server with health check` |
| 1.2 | Env loader validated with Zod (`src/config/env.ts`), `.env.example` | Server refuses to start if a required variable is missing | `feat(api): add validated environment config` |
| 1.3 | Central error handler, `AppError` class, 404 handler (Express 5 forwards async errors itself, so no `asyncHandler` wrapper), request logger (built-in, no logging library) | Throwing in a route returns the `{ error: { code, message } }` shape | `feat(api): add error handling and request logging` |
| 1.4 | Create Neon DB; Prisma init; models `User`, `UserProfile`, `UserSettings`, `RefreshToken`, `PasswordResetToken`, `EmailVerificationToken`; first migration | `npx prisma migrate dev` succeeds; tables visible in Prisma Studio | `feat(db): add user, profile, settings and token models` |
| 1.5 | `packages/shared`: Zod schemas `registerSchema`, `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`; `validate(schema)` middleware in api | Invalid body → 400 with field errors | `feat(shared): add auth validation schemas` |

### Authentication
| Step | What to do | Done when | Commit message |
|---|---|---|---|
| 1.7 | `POST /auth/register`: scrypt hash (Node built-in), create User + Profile + Settings in one transaction | curl: user created, duplicate email → 409 | `feat(auth): add user registration` |
| 1.8 | Token utils: sign/verify access JWT (15 min), create/hash refresh token, set httpOnly cookie | A token signed then verified returns the same user id | `feat(auth): add JWT and refresh token utilities` |
| 1.9 | `POST /auth/login`, `requireAuth` middleware, `GET /auth/me` | curl: login → access token → `/me` returns the user; bad password → 401 | `feat(auth): add login and protected route middleware` |
| 1.10 | `POST /auth/refresh` (rotation + reuse detection), `POST /auth/logout` | curl: old refresh token rejected after rotation | `feat(auth): add refresh token rotation and logout` |
| 1.11 | `forgot-password` and `reset-password` endpoints (same response for unknown emails) with a development mailer that prints the email to the server log | Reset link from the log changes the password; token single-use | `feat(auth): add forgot and reset password flow` |
| 1.12 | *Deferred (optional in the brief).* Email verification (`verify-email`, resend link), behind `REQUIRE_EMAIL_VERIFICATION` flag. Do on Day 5 if time allows | Verification link sets `emailVerifiedAt` | `feat(auth): add optional email verification` |
| 1.13 | Rate limit on auth routes (5 / 15 min) | 6th failed login → 429 | `feat(auth): rate limit authentication endpoints` |

### Frontend shell
| Step | What to do | Done when | Commit message |
|---|---|---|---|
| 1.14 | `apps/web`: Vite + React + TS, Tailwind with `darkMode: 'class'`, base fonts and colour tokens | Dev server shows a styled page | `feat(web): scaffold React app with Tailwind` |
| 1.15 | React Router, TanStack Query, Axios client with silent refresh on 401, `AuthProvider`, `ProtectedRoute` | Visiting `/dashboard` logged out redirects to `/login` | `feat(web): add routing, API client and auth context` |
| 1.16 | UI primitives: Button, Input, Textarea, Select, Card, Spinner, Toast, Modal | Components render in light and dark mode | `feat(web): add base UI components` |
| 1.17 | Login, Register, Forgot Password and Reset Password pages using React Hook Form + shared Zod schemas | Full auth flow works in the browser | `feat(web): add authentication pages` |
| 1.18 | App layout: sidebar (all modules), topbar (theme toggle, credits, avatar menu), mobile drawer | Layout works at 360 px and 1440 px | `feat(web): add responsive app layout and theme toggle` |

### Dashboard
| Step | What to do | Done when | Commit message |
|---|---|---|---|
| 1.19 | Prisma models `Client`, `Activity`, `AiUsage`; migration; `logActivity()` service | Migration applied | `feat(db): add client, activity and AI usage models` |
| 1.20 | `GET /dashboard/stats` (counts + credits) and `GET /dashboard/activity` | Returns zeros for a new user | `feat(api): add dashboard stats and activity endpoints` |
| 1.21 | Dashboard page: 6 stat widgets, recent activity list, quick-action buttons, empty states, skeleton loaders | New user sees zero-state dashboard | `feat(web): build dashboard with widgets and quick actions` |

### Deploy
| Step | What to do | Done when | Commit message |
|---|---|---|---|
| 1.22 | GitHub Actions: install → lint → typecheck | CI green on the PR | `ci: add lint and typecheck workflow` |
| 1.23 | Render (api) + Vercel (web) config, production env vars, Vercel `/api` proxy so cookies stay same-site; real email provider (Resend) behind `sendEmail()` | Register/login works on the live URL | `chore: add deployment config for Render and Vercel` |
| 1.24 | Seed script: demo user + sample client | `npm run db:seed` works | `chore(db): add seed script with demo user` |

**End of day:** open PR → merge into `main` → demo.

---

## Day 2 — Proposals, Cover Letters & AI Core

Branch: `day-2/proposals-cover-letters`

### AI core
| Step | What to do | Done when | Commit message |
|---|---|---|---|
| 2.1 | `AIProvider` interface, `GeminiProvider`, `OpenAIProvider`, factory that chooses provider and key | Script call returns text from Gemini | `feat(ai): add provider abstraction with Gemini and OpenAI` |
| 2.2 | `aiService.generate()`: atomic credit deduction, refund on failure, `AiUsage` log, 30 s timeout, retry on 429/5xx | curl: credits deducted, refunded on error, 402 when out of credits | `feat(ai): add generation service with credit accounting` |
| 2.3 | Per-user AI rate limit (20/min) | 21st request → 429 | `feat(ai): rate limit AI generation endpoints` |
| 2.4 | Prompt template structure + `proposal.v1` and `coverLetter.v1` (system prompt, profile context, delimited user input, tone enum) | Generated prompt contains profile context and delimited input | `feat(ai): add proposal and cover letter prompt templates` |

### Proposals
| Step | What to do | Done when | Commit message |
|---|---|---|---|
| 2.5 | `Proposal` model + migration; shared `proposalInputSchema` | Migration applied | `feat(db): add proposal model` |
| 2.6 | `POST /proposals/generate` (returns draft, not saved) | Returns AI text; credits go down by 1 | `feat(proposals): add AI proposal generation endpoint` |
| 2.7 | Proposals CRUD: list (search + pagination), get, create, update, delete — all scoped by `userId` | curl: another user's proposal → 404 | `feat(proposals): add proposal CRUD endpoints` |
| 2.8 | Reusable `DocumentEditor` (Tiptap), `GenerateButton` (loading state), `DocumentList`, `CopyButton` | Components work in isolation | `feat(web): add reusable document editor and list components` |
| 2.9 | Proposal form page: inputs, skill chips, tone select → generate → edit → save; regenerate button | Generate → save → appears in list | `feat(web): add proposal generator page` |
| 2.10 | Proposals list + detail/edit page, delete with confirm modal, copy to clipboard | Full CRUD works in the browser | `feat(web): add proposal history, edit and delete` |
| 2.11 | Shared PDF layout (`@react-pdf/renderer`, lazy-loaded) + proposal PDF export | Downloaded PDF looks correct | `feat(pdf): add branded PDF layout and proposal export` |

### Cover letters
| Step | What to do | Done when | Commit message |
|---|---|---|---|
| 2.12 | `CoverLetter` model + migration, generate endpoint, CRUD endpoints | Endpoints work via curl | `feat(cover-letters): add cover letter API` |
| 2.13 | Cover letter generator, history and detail pages; PDF export (reusing step 2.8 and 2.11 components) | Full flow works | `feat(web): add cover letter generator and history` |
| 2.14 | Log activity on create/update/delete for both modules; dashboard counts update | Dashboard reflects new documents | `feat: record activity for proposals and cover letters` |

---

## Day 3 — Gig Descriptions & Smart Pricing

Branch: `day-3/gigs-pricing`

| Step | What to do | Done when | Commit message |
|---|---|---|---|
| 3.1 | JSON-mode helper in AI service: validate output with Zod, one repair retry | Malformed AI JSON triggers one retry | `feat(ai): add structured JSON output with validation` |
| 3.2 | `GigDescription` model + migration; `gig.v1` prompt (description, SEO keywords, FAQs as JSON) | Migration applied | `feat(gigs): add gig model and prompt template` |
| 3.3 | Gig generate endpoint + CRUD endpoints | Endpoints work via curl | `feat(gigs): add gig description API` |
| 3.4 | Gig generator page: form → editable sections (description, keyword chips, FAQ list) → save; history page | Full flow works | `feat(web): add gig description generator and history` |
| 3.5 | Pricing calculation in `packages/shared` (complexity/urgency multipliers, extras, tax; Decimal maths) | Totals match hand-calculated examples | `feat(pricing): add deterministic pricing calculator` |
| 3.6 | `PricingEstimate` model; `POST /pricing/calculate`, `GET /pricing/history`, `DELETE /pricing/:id` | Server total matches shared calculator | `feat(pricing): add pricing API and history` |
| 3.7 | `pricing.v1` prompt + `POST /pricing/suggest` (price range, delivery time, market analysis, tips) | Returns valid structured suggestion | `feat(pricing): add AI pricing suggestions` |
| 3.8 | Pricing page: live calculator, breakdown table, "Get AI suggestions" panel, save, history list | Totals update as you type | `feat(web): add smart pricing calculator page` |
| 3.9 | "Use this price" button → pre-fills a new proposal budget | Clicking it opens proposal form with budget set | `feat(web): link pricing results to proposal form` |

---

## Day 4 — Client Replies, Invoices & Contracts

Branch: `day-4/replies-invoices-contracts`

| Step | What to do | Done when | Commit message |
|---|---|---|---|
| 4.1 | `ClientReply` model, `reply.v1` prompt (client message treated as data), generate + CRUD endpoints | Endpoints work via curl | `feat(replies): add client reply API` |
| 4.2 | Client reply page: paste message, tone, generate, copy, save; history | Full flow works | `feat(web): add client reply generator` |
| 4.3 | Clients CRUD endpoints | Endpoints work via curl | `feat(clients): add client CRUD API` |
| 4.4 | Clients page (list, add, edit, archive); "Active Clients" widget now counts real data | Widget shows correct number | `feat(web): add clients management page` |
| 4.5 | `Invoice` + `InvoiceItem` models; invoice totals function in shared | Totals match hand-calculated examples | `feat(invoices): add invoice models and totals calculation` |
| 4.6 | Invoice CRUD endpoints: totals recalculated on the server, auto-number `INV-YYYY-NNNN`, status endpoint | curl: client-sent totals are ignored | `feat(invoices): add invoice API with numbering and status` |
| 4.7 | Invoice builder page: client picker, dynamic line items, tax, due date, live totals; invoice list with status badges | Can create and edit invoices | `feat(web): add invoice builder and list` |
| 4.8 | Invoice PDF template (freelancer details from profile) | PDF downloads correctly | `feat(pdf): add invoice PDF template` |
| 4.9 | `Contract` model, `contract.v1` prompt, generate (2 credits) + CRUD endpoints | Endpoints work via curl | `feat(contracts): add contract API` |
| 4.10 | Contract generator page + editor + list; PDF with signature blocks and disclaimer | Full flow works | `feat(web): add contract generator with PDF export` |

---

## Day 5 — History, Profile, Settings, Hardening & Launch

Branch: `day-5/history-settings-launch`

### Features
| Step | What to do | Done when | Commit message |
|---|---|---|---|
| 5.1 | `GET /history` (unified across all types, filter by type/date, search, pagination) | Returns mixed document types | `feat(history): add unified history endpoint` |
| 5.2 | History page: tabs per type, search, date filter, links to each document | Works with many documents | `feat(web): add unified history page` |
| 5.3 | Profile endpoints + Cloudinary avatar upload (image only, max 2 MB) | Avatar URL saved | `feat(profile): add profile update and avatar upload` |
| 5.4 | Change password (revokes other sessions), delete account | Other sessions logged out after change | `feat(auth): add change password and account deletion` |
| 5.5 | Profile page: edit form, avatar upload with preview, change password form | Works in browser | `feat(web): add profile page` |
| 5.6 | Settings endpoints; API key encrypted with AES-256-GCM, returned masked; test-connection endpoint | Key never returned in full | `feat(settings): add settings and encrypted API key storage` |
| 5.7 | Settings page: theme, language, currency, notifications, API key | Settings persist after reload | `feat(web): add settings page` |
| 5.8 | i18n with `react-i18next`, English + one more language | Switching language changes UI text | `feat(web): add multi-language support` |

### Hardening
| Step | What to do | Done when | Commit message |
|---|---|---|---|
| 5.9 | Error boundary, 404/500 pages, map API error codes to friendly toasts | Killing the API shows a friendly error, not a blank page | `feat(web): add error boundaries and API error handling` |
| 5.10 | Check every form for validation messages, loading states and disabled buttons while submitting | Manual checklist done | `fix(web): complete form validation and loading states` |
| 5.11 | Route-level code splitting, lazy PDF library, query cache settings, verify DB indexes | Lighthouse performance ≥ 90 | `perf: add code splitting and optimise queries` |
| 5.12 | Security pass: `npm audit fix`, check CORS/cookies/headers, check every route for ownership scoping | No high/critical audit issues | `fix: security hardening pass` |
| 5.14 | Fix bugs found in full manual QA (one commit per bug) | Checklist all green | `fix(<module>): <what was broken>` |

### Delivery
| Step | What to do | Done when | Commit message |
|---|---|---|---|
| 5.15 | OpenAPI spec + Swagger UI at `/api/docs`; export Postman collection to `docs/` | Docs page loads on live API | `docs(api): add OpenAPI spec and Swagger UI` |
| 5.16 | Seed rich demo data; `pg_dump` to `database/database.sql`; ERD image | Dump restores into an empty DB | `chore(db): add database dump and ERD` |
| 5.17 | Full README: features, screenshots, architecture, local setup, env vars, deployment, demo login | A new developer can run it from the README | `docs: write complete README` |
| 5.18 | Update PROJECT_PLAN.md to as-built, tick the deliverables checklist | Checklist complete | `docs: update project plan to as-built` |
| 5.19 | Merge to `main`, tag the release | Live site matches `main` | `git tag v1.0.0 && git push --tags` |
| 5.20 | Record demo video (5–10 min) and add the link to README | Link works | `docs: add demo video link` |

---

## Bonus steps (only after Day 5 core is done)

| Step | Feature | Commit message |
|---|---|---|
| B.1 | Proposal templates (seeded, "start from template") | `feat(proposals): add proposal templates` |
| B.2 | Analytics charts on dashboard | `feat(web): add analytics dashboard charts` |
| B.3 | AI grammar checker in the document editor | `feat(ai): add grammar checker` |
| B.4 | AI client risk score on the reply page | `feat(ai): add client risk score` |
