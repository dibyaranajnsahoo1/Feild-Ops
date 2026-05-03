# Field Ops Platform 


A production-grade **Multi-Tenant Field Operations & Inspection Management Platform** built with Next.js 14 (App Router), MongoDB, Tailwind CSS, and shadcn/ui.

🔗 Live Demo: https://feild-ops-nine.vercel.app/dashboard
---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (React/Next.js)                      │
│  Server Components (RSC) ←→ Client Components ←→ Server Actions     │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ HTTP / Cookie JWT
┌─────────────────────────────────▼───────────────────────────────────┐
│                     Next.js Middleware Layer                         │
│          JWT Verification · Rate Limiting · RBAC Guards             │
└──────────┬──────────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────────┐
│                    API Routes (Route Handlers)                       │
│  /api/auth  /api/forms  /api/submissions  /api/analytics  /api/ai   │
└──────────┬──────────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────────┐
│                      Service Layer                                   │
│  authService · formService · submissionService · analyticsService   │
└──────────┬──────────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────────┐
│                      Data Layer (Mongoose)                           │
│       Organization · User · Site · Form · Submission · AuditLog     │
└──────────┬──────────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────────┐
│                     MongoDB (Multi-Tenant)                           │
│           Compound Indexes · Tenant Isolation · Capped Collections  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
field-ops-platform/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group (no sidebar)
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/              # Protected route group (with sidebar)
│   │   │   ├── dashboard/page.tsx    # Server Component — SSR dashboard
│   │   │   ├── forms/
│   │   │   │   ├── page.tsx          # Forms list
│   │   │   │   ├── builder/page.tsx  # Dynamic form builder
│   │   │   │   └── [formId]/page.tsx # Edit form
│   │   │   ├── submissions/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [submissionId]/page.tsx
│   │   │   ├── analytics/page.tsx    # Charts + AI Insights
│   │   │   └── sites/page.tsx
│   │   ├── api/
│   │   │   ├── auth/{login,register,me}/route.ts
│   │   │   ├── forms/route.ts        # List + Create
│   │   │   ├── forms/[formId]/route.ts
│   │   │   ├── submissions/route.ts
│   │   │   ├── submissions/[id]/route.ts
│   │   │   ├── analytics/route.ts    # Aggregation pipelines
│   │   │   ├── sites/route.ts
│   │   │   ├── ai/insights/route.ts  # OpenRouter AI integration
│   │   │   └── health/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Root redirect
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives
│   │   ├── layout/                   # Sidebar, TopBar
│   │   ├── dashboard/                # StatsCard, RecentSubmissions, QuickActions
│   │   ├── forms/                    # FormBuilder, FieldEditor, FieldPalette,
│   │   │                             # DynamicFormRenderer
│   │   ├── analytics/                # AnalyticsDashboard, AIInsightsPanel
│   │   ├── submissions/              # SubmissionActions
│   │   └── sites/                   # CreateSiteDialog
│   │
│   ├── models/                       # Mongoose schemas
│   │   ├── Organization.ts
│   │   ├── User.ts                   # With bcrypt + instance methods
│   │   ├── Site.ts
│   │   ├── Form.ts                   # Dynamic field schema
│   │   ├── Submission.ts             # Flexible JSON + AI fields
│   │   └── AuditLog.ts              # Capped collection
│   │
│   ├── services/                     # Business logic layer
│   │   ├── authService.ts
│   │   ├── formService.ts
│   │   ├── submissionService.ts      # With async AI analysis
│   │   └── analyticsService.ts      # MongoDB aggregation pipelines
│   │
│   ├── middleware/
│   │   └── api.ts                    # withAuth, rateLimit, tenantFilter,
│   │                                 # sanitizeMongoInput
│   ├── middleware.ts                  # Next.js Edge Middleware (JWT + RBAC)
│   │
│   ├── lib/
│   │   ├── auth/jwt.ts               # JWT sign/verify, RBAC helpers
│   │   ├── db/connect.ts             # MongoDB connection pool singleton
│   │   ├── db/seed.ts               # Development seed script
│   │   ├── ai/aiService.ts          # OpenRouter AI integration
│   │   ├── validations/schemas.ts   # Zod schemas (shared client+server)
│   │   └── utils.ts                 # cn, formatCompact, slugify, etc.
│   │
│   ├── hooks/                        # Custom React hooks
│   └── types/index.ts               # TypeScript domain types
│
├── __tests__/
│   ├── unit/services/               # Jest unit tests
│   │   ├── middleware.test.ts
│   │   ├── validation.test.ts
│   │   └── utils.test.ts
│   └── e2e/                         # Playwright E2E tests
│       ├── auth.spec.ts
│       └── forms.spec.ts
│
├── .github/workflows/ci-cd.yml      # GitHub Actions CI/CD
├── jest.config.ts
├── playwright.config.ts
├── tailwind.config.ts
├── next.config.ts
├── vercel.json
└── .env.example
```

---

## Core Features

### 1. Multi-Tenant Architecture
Every database query is scoped by `organizationId`. The `tenantFilter()` function in `src/middleware/api.ts` enforces this automatically — no query can leak across tenant boundaries.

**How it works:**
```typescript
// Every service function accepts organizationId and scopes ALL queries
const forms = await Form.find({ organizationId, ...otherFilters });

// The middleware injects the session org ID — it cannot be spoofed
export const GET = withAuth(async (req, session) => {
  const data = await getForms(session.organizationId, params);
});
```

### 2. Role-Based Access Control (RBAC)
Four roles with hierarchical permissions:

| Role         | Dashboard | Submit | View All | Manage Forms | Analytics | Manage Users |
|-------------|-----------|--------|----------|-------------|-----------|--------------|
| super_admin | ✅        | ✅     | ✅        | ✅           | ✅        | ✅           |
| admin       | ✅        | ✅     | ✅        | ✅           | ✅        | ✅           |
| manager     | ✅        | ✅     | ✅        | ✅           | ✅        | ❌           |
| staff       | ✅        | ✅     | Own only  | ❌           | ❌        | ❌           |

### 3. Dynamic Form Builder
- Admin/Manager creates forms with drag-and-drop field ordering
- Supports: text, textarea, number, email, phone, dropdown, checkbox, date, file
- Form schema stored as JSON in MongoDB
- `DynamicFormRenderer` renders any schema client-side with validation
- Version tracking on schema changes

### 4. AI Integration (OpenRouter / GPT-4.1-mini)
Three AI capabilities:

**Per-submission analysis** (async, non-blocking):
```typescript
// Runs after submission is saved — doesn't block the response
analyzeSubmission(submission, form).then(({ summary, anomalies }) => {
  Submission.findByIdAndUpdate(id, { aiSummary: summary, aiAnomalies: anomalies });
});
```

**Site-level insights** (on-demand):
- Aggregates last 100 submissions
- Generates executive summary, anomaly detection, trend analysis
- Returns structured JSON with severity levels

**Anomaly detection** across form submissions over time.

### 5. Analytics Dashboard
- Area chart: submission trends over time
- Bar charts: by site, by form
- Pie chart: status distribution
- All powered by MongoDB aggregation pipelines (not raw queries)
- 5-minute ISR revalidation

### 6. Security Implementation

**JWT Authentication:**
- HS256 signed tokens via `jose` library
- Stored in `httpOnly; SameSite=Lax; Secure` cookies
- Token expiry: 7 days

**Rate Limiting:**
- In-memory implementation (use Redis in production)
- Auth endpoints: 10 req / 15 min
- AI endpoints: 20 req / hour
- Configurable per route

**MongoDB Injection Prevention:**
- `sanitizeMongoInput()` strips `$` operators from user input
- Regex patterns block `$where`, `$expr`, `javascript:` injection attempts

**CSRF Protection:**
- `SameSite=Lax` cookie attribute
- `Referer` header validation via Content-Security-Policy

**XSS Protection:**
- React's built-in escaping on all rendered values
- `X-Content-Type-Options: nosniff` header
- Content-Security-Policy header configured in `next.config.ts`

**Input Sanitization:**
- All API inputs validated with Zod before any database operation
- Type coercion handled by Zod schemas

---

## Database Schema Design

### Key Decisions:
1. **Flexible submission data**: `data: Mixed` stores arbitrary form responses as JSON — allows any form schema without schema migrations
2. **Compound indexes**: `{ organizationId, createdAt }` on Submission for fast tenant-scoped queries
3. **Capped AuditLog collection**: 100MB cap, auto-rotates — prevents unbounded growth
4. **Version tracking on Forms**: Increment version when `fields` change — enables schema history

### Index Strategy:
```javascript
// Submission — most queried collection
{ organizationId: 1, createdAt: -1 }        // tenant + time range
{ formId: 1, createdAt: -1 }                 // form-specific queries
{ siteId: 1, createdAt: -1 }                 // site-specific queries
{ organizationId: 1, status: 1 }             // status filters
{ organizationId: 1, siteId: 1, createdAt: -1 } // combined filter

// User — auth + listing
{ email: 1 }                                  // unique, auth
{ organizationId: 1, role: 1 }               // team listing
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 7+ (local or MongoDB Atlas)
- npm

### Installation

```bash
# 1. Clone and install
git clone <repo-url>
cd field-ops-platform
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your MongoDB URI and secrets

# 3. Seed demo data
npm run db:seed

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo credentials** (after seeding):
| Role    | Email                         | Password   |
|---------|-------------------------------|------------|
| Admin   | admin@demo.fieldops.dev       | Demo@1234  |
| Manager | manager@demo.fieldops.dev     | Demo@1234  |
| Staff   | staff@demo.fieldops.dev       | Demo@1234  |

---

## Environment Variables

```env
# Required
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<min 32 chars random string>
NEXTAUTH_SECRET=<min 32 chars random string>

# AI (OpenRouter)
OPENAI_API_KEY=sk-or-v1-...
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-4.1-mini
OPENAI_MAX_TOKENS=1200

# Optional
NEXT_PUBLIC_APP_URL=https://your-domain.com
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
```

---

## Testing

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests (requires running dev server)
npm run test:e2e

# E2E with UI (debug mode)
npm run test:e2e:ui
```

**Test structure:**
- `__tests__/unit/` — Jest tests for middleware, validation, utilities
- `__tests__/e2e/` — Playwright tests for auth flow, form builder, analytics
- Coverage target: 60% across branches, functions, lines, statements

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add OPENAI_API_KEY
# ... etc

# Production deploy
vercel --prod
```

### Required Vercel Environment Variables:
- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — Random 32+ char string
- `NEXTAUTH_SECRET` — Random 32+ char string
- `OPENAI_API_KEY` — Your OpenRouter API key
- `NEXTAUTH_URL` — Your production URL

### GitHub Actions CI/CD:
Add these repository secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `OPENAI_API_KEY`
- `CODECOV_TOKEN` (optional)

The pipeline runs: **Lint → Type Check → Unit Tests → Build → E2E Tests → Deploy**

---

## API Reference

### Authentication
| Method | Endpoint           | Auth | Description         |
|--------|--------------------|------|---------------------|
| POST   | /api/auth/login    | ❌   | Login               |
| POST   | /api/auth/register | ❌   | Register + create org |
| GET    | /api/auth/me       | ✅   | Current user        |
| DELETE | /api/auth/me       | ✅   | Logout              |

### Forms
| Method | Endpoint              | Min Role | Description     |
|--------|-----------------------|----------|-----------------|
| GET    | /api/forms            | staff    | List forms      |
| POST   | /api/forms            | manager  | Create form     |
| GET    | /api/forms/:id        | staff    | Get form        |
| PATCH  | /api/forms/:id        | manager  | Update form     |
| DELETE | /api/forms/:id        | manager  | Soft delete     |

### Submissions
| Method | Endpoint                 | Min Role | Description         |
|--------|--------------------------|----------|---------------------|
| GET    | /api/submissions         | staff    | List (staff: own only) |
| POST   | /api/submissions         | staff    | Submit form         |
| GET    | /api/submissions/:id     | staff    | Get submission      |
| PATCH  | /api/submissions/:id     | manager  | Update status       |

### Analytics
| Method | Endpoint                     | Min Role | Description    |
|--------|------------------------------|----------|----------------|
| GET    | /api/analytics?type=overview | manager  | Overview stats |
| GET    | /api/analytics?type=trends   | manager  | Time series    |
| GET    | /api/analytics?type=sites    | manager  | Per-site data  |
| GET    | /api/analytics?type=forms    | manager  | Per-form data  |

### AI
| Method | Endpoint           | Min Role | Description           |
|--------|--------------------|----------|-----------------------|
| POST   | /api/ai/insights   | manager  | Generate site insights |

### Sites
| Method | Endpoint    | Min Role | Description  |
|--------|-------------|----------|--------------|
| GET    | /api/sites  | staff    | List sites   |
| POST   | /api/sites  | admin    | Create site  |

---

## Performance Optimizations

1. **Server Components by default** — Pages are RSC; only interactive parts are Client Components
2. **ISR revalidation** — Dashboard revalidates every 60s, analytics every 5min
3. **MongoDB connection pooling** — Singleton connection with `maxPoolSize: 10`
4. **Compound indexes** — All common query patterns are indexed
5. **Async AI analysis** — Submission saves immediately; AI runs in background
6. **Aggregation pipelines** — Analytics uses MongoDB `$group`/`$lookup` — not N+1 queries
7. **Code splitting** — Recharts and heavy components lazy-loaded

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| JWT in httpOnly cookies (not localStorage) | XSS protection — JS cannot access the token |
| In-memory rate limiter | Zero dependencies; swap for Redis in production via `rate-limiter-flexible` |
| Mongoose over Prisma | Better support for `Mixed` types and dynamic schemas needed for form fields |
| Async AI analysis | Don't block submission response on AI latency (~2-3s) |
| Zod on both client + server | Single source of truth for validation, type inference |
| Route groups `(auth)` and `(dashboard)` | Different layouts without affecting URL structure |
| Capped AuditLog collection | Automatic rotation without cron jobs — self-managing |
| Server Components for data-fetching pages | Eliminates loading states, improves LCP, reduces JS bundle |

---

## Contributing

1. Fork and clone the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes and write tests
4. Run `npm test && npm run type-check && npm run lint`
5. Commit with conventional commits: `feat: add site GPS tracking`
6. Open a Pull Request

---

## License

MIT License — see [LICENSE](./LICENSE) for details.
