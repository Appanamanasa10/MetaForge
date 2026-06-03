# MetaForge

**Tagline**: "Build applications from configuration."

MetaForge is a metadata-driven application runtime that converts JSON configurations into working, responsive, and type-safe full-stack applications. Users define schema entities using JSON, and the system automatically compiles forms, datagrids, backend REST APIs, validations, and workflow automations.

---

## Technical Stack

* **Core & Layout**: Next.js 15 (App Router), React 19, TypeScript
* **Styling**: TailwindCSS
* **Validation & Forms**: React Hook Form, Zod, `@hookform/resolvers`
* **Data Management**: TanStack Query (v5)
* **Authentication**: NextAuth.js (v4), Credentials provider, Sandbox credentials bypass (development only)
* **Database & ORM**: PostgreSQL (Neon in production), Prisma ORM
* **CSV Parsing**: PapaParse

---

## Core Architecture & Safety Rules

MetaForge is fully schema-driven. When you define an entity schema (like `Student` or `Inventory`), the following happens dynamically:

1. **Frontend Compilation**: The schema properties compile on-the-fly into a Zod validation object. React Hook Form uses this schema to enforce constraints (e.g. required state, valid emails, numeric limits).
2. **Backend Validation**: The REST APIs `/api/records` and `/api/imports` run the same Zod parsing server-side, returning standard structured validation alerts on invalid formats.
3. **Resilience & Crash Prevention**: Unrecognized components (e.g., fields with types outside text, textarea, email, number, select, checkbox, date) are captured by the rendering engine and display a localized `"Unsupported Component: [type]"` message. The rest of the page remains fully online, protected by `RuntimeErrorBoundary` wrappers.

---

## Getting Started & Local Setup

### 1. Prerequisites
Ensure you have **Node.js (v20+)** and **npm** installed.

### 2. Install Dependencies
Clone the repository and install packages:
```bash
npm install
```

### 3. Database Migration
MetaForge uses Prisma to connect to PostgreSQL.
1. Create a PostgreSQL database (e.g. on [Neon](https://neon.tech)).
2. Copy `.env.example` to `.env` and fill in the `DATABASE_URL` with your connection string:
   ```bash
   DATABASE_URL="postgresql://username:password@hostname/dbname?sslmode=require"
   ```
3. Push the schema to the database:
   ```bash
   npx prisma db push
   ```
   *This initializes all standard tables (User, Session, Account, Application, Entity, Record, Workflow, Notification, AuditLog).*

### 4. Configure NextAuth
Fill in the following variables inside `.env`:
* `NEXTAUTH_URL` (typically `http://localhost:3000` for development)
* `NEXTAUTH_SECRET` (generate a secure 32-character string, minimum 16 characters)

> [!NOTE]
> **Sandbox Login Bypass**: In development, you can use the **Developer Sandbox credentials form** on the login page. Enter any email and name to sign in and register instantly. This bypass is disabled when running in production (`NODE_ENV=production`).

### 5. Launch the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to launch MetaForge.

---

## Features Walkthrough

### 1. Application Builder & JSON Editor
Create a new container, then define entities. Paste or edit your schema inside the JSON editor:
```json
{
  "entity": "Student",
  "fields": [
    { "name": "name", "type": "text", "required": true },
    { "name": "email", "type": "email", "required": true },
    { "name": "cgpa", "type": "number", "placeholder": "Enter CGPA" },
    { "name": "status", "type": "select", "options": ["Active", "Graduated"] }
  ]
}
```
Toggle the **Live Preview** tab to see your forms and tables reactively update as you type.

### 2. Dynamic Runtime Grid & CRUD
Enter runtime to view records. Create new rows via forms, search through entries with keyword matching, sort columns, paginate, and edit or delete records.

### 3. CSV Import Column Mapper
Upload any CSV file. Map the CSV columns dynamically to your schema properties. MetaForge previews the parsed records, checks for duplicate rows in the database, maps valid data, and details schema errors in an import log.

### 4. Workflow Automations
Register automation chains on database actions:
* **Triggers**: Record Created, Record Updated, Record Deleted
* **Actions**: Create Notification (logs to Notification Center), Create Audit Log (writes to AuditLog table)
* **Interpolation**: Use `{{fieldName}}` tokens inside template text blocks to dynamically print record details (e.g. `"New student {{name}} registered with email {{email}}."`).

---

## Production Deployment

For deploying MetaForge to production, please refer to the detailed [DEPLOYMENT.md](file:///c:/Users/manuu/OneDrive/Documents/AIAPP/DEPLOYMENT.md) guide.

### Environment Variables
Configure the following required variables on your deployment platform (e.g. Vercel):
* `DATABASE_URL`: Connection URL to your Neon PostgreSQL database.
* `NEXTAUTH_URL`: Canonical URL of your live application.
* `NEXTAUTH_SECRET`: Strong secret key (min 16 chars) for NextAuth session security.
* `NODE_ENV`: Set to `production`.

### Database Setup
1. Create a serverless PostgreSQL database on [Neon.tech](https://neon.tech).
2. Set `DATABASE_URL` in Vercel. We recommend using the pooled connection string provided by Neon.
3. The build script in `package.json` (`prisma generate && prisma migrate deploy && next build`) will automatically run database migrations safely during deployment.

