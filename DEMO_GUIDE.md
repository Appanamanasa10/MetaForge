# MetaForge — Demo & Recruiter Guide

> **MetaForge** is a schema-driven, full-stack app builder. You define a JSON schema — MetaForge compiles it into a live application with validated forms, interactive data tables, CSV import, and workflow automation.

---

## 🚀 Quick Start (5-minute demo)

### 1. Sign In / Create Account
- Navigate to `/login` or `/signup`
- For immediate exploration without registration, use the **Developer Sandbox** on the login page (development mode only)
- Enter any email and optional display name → instant access

### 2. Create Your First Application
- On the Dashboard, click **New Application**
- Name it (e.g., "Student Management System") and add a description
- Click **Create Application** → you are redirected to the Schema Builder

### 3. Define a Schema
- In the **Schema Builder**, the JSON editor is pre-loaded with a sample schema
- Or click **⚡ Quick Templates** to pick from: Contact, Product, Task, Employee
- The schema defines your entity's fields with types: `text`, `email`, `number`, `select`, `checkbox`, `date`, `textarea`
- Live validation highlights errors in real time with a green/red status bar
- Click **Save Schema** → your entity is registered

### 4. Enter the Runtime
- Click **Launch Runtime** to open the entity's data management view
- Use **Add Record** to open the auto-generated form
- Fill in the form fields → submit → the record appears in the interactive table

### 5. Explore the Table
- **Search**: Type in the search box to filter records in real time
- **Pagination**: Navigate through large datasets
- **Edit**: Click the pencil icon to update a record inline
- **Delete**: Click trash with confirmation dialog (no accidental deletes!)
- **Export CSV**: Click "Export CSV" to download all records as a spreadsheet

### 6. Import Data via CSV
- Click **Import CSV** from the runtime view
- Drag-and-drop or select a `.csv` file
- The step wizard:
  1. **Upload**: Drop your file
  2. **Map Columns**: Match CSV headers to schema fields (auto-matched by name)
  3. **Pre-flight**: See which rows will have validation issues before importing
  4. **Execute**: Run the import → view summary (Imported / Duplicates / Failed)

---

## 🎯 Key Features to Highlight in a Demo

| Feature | Where to Find | What it Shows |
|---------|-------------|--------------|
| **Schema Builder** | `/app/{id}/builder` | JSON-to-application compilation |
| **Live JSON Validation** | Schema editor | Real-time error feedback |
| **Quick Templates** | Sparkles button in builder sidebar | Developer productivity |
| **Auto-generated Forms** | Runtime > Add Record | Dynamic form rendering from schema |
| **Zod Validation** | Try submitting invalid data | Full-stack schema enforcement |
| **Interactive Table** | Runtime entity view | Search, pagination, sort |
| **CSV Export** | "Export CSV" button in table | Data portability |
| **CSV Import Wizard** | Import CSV button | 3-step wizard with pre-flight validation |
| **Workflow Automation** | `/app/{id}/workflows` | Trigger-action rules (RECORD_CREATED etc.) |
| **Notification Center** | Sidebar > Notifications | Audit trail from workflow triggers |
| **Analytics Dashboard** | `/dashboard` | App/entity counts, search, sort |
| **Password Strength** | `/signup` | Client-side security UX |
| **Mobile Navigation** | Any page on mobile | Responsive sidebar drawer |

---

## 🏗️ Architecture Overview

```
MetaForge
├── Frontend: Next.js 15 (App Router) + React 19
├── Styling:  TailwindCSS v4 (no config file — inline @theme)
├── Auth:     NextAuth v4 (credentials + sandbox providers, Prisma adapter)
├── Database: Prisma ORM (PostgreSQL-compatible)
├── State:    TanStack React Query (server state management)
├── Forms:    React Hook Form + Zod (dynamic schema validation)
├── CSV:      PapaParser (client-side CSV parsing + import)
└── UX:       react-hot-toast, lucide-react, Inter font
```

### Key Architecture Decisions
- **Schema-driven**: All entity definitions stored as JSON in the database — no code generation required
- **Runtime compilation**: Forms and tables are compiled from schema at render time, not build time
- **Full-stack Zod**: Validation schemas are derived from the same JSON definition on both client and server
- **Workflow engine**: Trigger-action rules execute asynchronously on record mutations

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/login        → Login page (NextAuth credentials + sandbox)
│   ├── (auth)/signup       → Registration with password strength indicator
│   ├── dashboard/          → Application list with analytics
│   ├── notifications/      → Notification center (grouped + filterable)
│   ├── settings/           → Profile + account settings
│   └── app/[appId]/
│       ├── builder/        → JSON Schema editor + live preview
│       ├── runtime/[entityId]/       → Record table management
│       ├── runtime/[entityId]/new    → Create new record form
│       ├── runtime/[entityId]/[id]   → View/edit record detail
│       ├── import/[entityId]/        → CSV import wizard
│       └── workflows/               → Workflow automation
├── components/
│   ├── dashboard-layout.tsx  → Sidebar + mobile nav layout
│   ├── confirm-dialog.tsx    → Reusable confirmation modal
│   ├── stats-card.tsx        → Analytics stat card
│   ├── empty-state.tsx       → Consistent empty state UI
│   └── runtime/
│       ├── form-renderer.tsx   → Dynamic form from schema
│       ├── table-renderer.tsx  → Dynamic table from schema + CSV export
│       ├── detail-renderer.tsx → Read-only record detail view
│       └── error-boundary.tsx  → Runtime error recovery
├── lib/
│   ├── auth.ts   → NextAuth configuration
│   ├── db.ts     → Prisma client singleton
│   └── env.ts    → Environment variable validation
└── types/index.ts → Shared TypeScript types
```

---

## 🔌 API Routes

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET/POST | `/api/applications` | List / create applications |
| PATCH/DELETE | `/api/applications` | Edit / delete applications (cascade) |
| GET/POST/DELETE | `/api/entities` | Schema entity CRUD |
| GET/POST/PUT/DELETE | `/api/records` | Data record CRUD + search + pagination |
| POST | `/api/imports` | Batch CSV import with validation |
| GET/PUT | `/api/notifications` | Notifications list + mark read |
| GET/PUT | `/api/user` | User profile |
| GET/POST | `/api/workflows` | Workflow trigger-action rules |
| POST | `/api/auth/signup` | User registration |

---

## 🛠 Environment Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Set required variables in .env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# 4. Run dev server (migrates DB automatically in dev)
npm run dev
```

### Required `.env` Variables
| Variable | Description |
|---------|------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for JWT signing |
| `NEXTAUTH_URL` | App base URL (http://localhost:3000 in dev) |

---

## 🎨 Design System

**Color Palette**: Dark slate (`slate-950` background) + blue accent (`blue-500`)
**Typography**: Inter (Google Fonts) with Geist fallback
**Components**: Glassmorphism panels with `backdrop-blur`, subtle gradients, smooth animations
**Micro-animations**: Page entry `fadeInUp`, dropdown `slideDown`, skeleton shimmer

---

## ✅ Recruiter Checklist

- [x] **Modern tech stack** — Next.js 15, React 19, TailwindCSS v4, Prisma
- [x] **Full-stack capability** — Custom API routes, database, auth, validation
- [x] **Type safety** — TypeScript throughout, Zod runtime validation
- [x] **Security** — NextAuth JWT sessions, bcrypt password hashing, server-side ownership checks
- [x] **Code organization** — Feature-based folder structure, reusable components
- [x] **UX quality** — Loading states, error boundaries, toast notifications, empty states
- [x] **Performance** — React Query caching, debounced search, optimistic UI patterns
- [x] **Mobile-first** — Responsive at all breakpoints, mobile drawer navigation
- [x] **Data portability** — CSV import + export
- [x] **Developer experience** — Sandbox login, quick-start templates, live schema validation
