# MetaForge Production Deployment Guide

This document describes how to deploy MetaForge to production on **Vercel** with a serverless **Neon PostgreSQL** database and **NextAuth** credentials-based authentication.

---

## Architecture Overview

```mermaid
graph TD
    Client[Client Browser] -->|Requests| Vercel[Vercel Serverless Frontend & APIs]
    Vercel -->|Auth Session| NextAuth[NextAuth Middleware / JWT]
    Vercel -->|Database Queries| Neon[Neon PostgreSQL Serverless]
    Neon -->|Direct Connection| PrismaMigrate[Prisma Migrations on Build]
```

---

## 1. Database Setup (Neon PostgreSQL)

Neon is a serverless PostgreSQL database optimized for Vercel.

1. **Sign Up / Sign In**: Go to [Neon.tech](https://neon.tech) and create an account.
2. **Create Project**: Click **Create Project**, name it `metaforge-prod`, select a PostgreSQL version, and select your preferred region.
3. **Retrieve Database Connection String**:
   - In your Neon Console dashboard, select the **Connection string** widget.
   - Choose **Prisma** from the dropdown menu (which formats the connection URL correctly).
   - Copy the string. It will look like this:
     `postgresql://<user>:<password>@<host>/neondb?sslmode=require`
4. **Connection Pooling (Recommended)**:
   - For serverless environments like Vercel, Neon provides an built-in connection pooler via PgBouncer.
   - To use pooling, copy the connection string and check the **Pooled connection** toggle (which appends `-pooler` to the host name, e.g., `ep-noisy-frog-123456-pooler.us-east-1.aws.neon.tech`).
   - If using a pooled connection string for `DATABASE_URL`, you should define a `DIRECT_URL` environment variable for running migrations, since migrations require a non-pooled, direct connection.
   - **Prisma Schema Configuration** (already optimized for standard databases, but if you want direct url capability, it's defined in the env variables).

---

## 2. Authentication Configuration

MetaForge uses a **Credentials Provider** (Email + Password) in production.
- Google OAuth and GitHub OAuth are disabled.
- Developer Sandbox bypass is automatically blocked when `NODE_ENV=production` for security.

For NextAuth to work securely:
1. **NEXTAUTH_SECRET**: Generate a strong 32-character random string for signing JWT tokens:
   - Run in your terminal: `openssl rand -base64 32` or similar tool.
2. **NEXTAUTH_URL**: Set this to your canonical production domain name (e.g. `https://metaforge.vercel.app` or custom domain).

---

## 3. Environment Variables Configuration

Set the following variables in the Vercel dashboard:

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL connection string (pooled or direct). | `postgresql://neondb_owner:password@ep-host-pooler.aws.neon.tech/neondb?sslmode=require` |
| `NEXTAUTH_URL` | Canonical URL of your deployed application. | `https://metaforge.vercel.app` |
| `NEXTAUTH_SECRET` | Secret key used to encrypt NextAuth JWT tokens. | `some-random-32-char-base64-string` |
| `NODE_ENV` | Runtime environment mode. | `production` |

---

## 4. Vercel Deployment Steps

1. **Push Code to GitHub**:
   - Ensure your repository is committed and pushed to a GitHub repository (public or private).
2. **Import Project to Vercel**:
   - Log into your [Vercel Dashboard](https://vercel.com).
   - Click **Add New** > **Project**.
   - Import your repository.
3. **Configure Project Settings**:
   - **Framework Preset**: Next.js (Vercel auto-detects this).
   - **Build Command**: Set to default (`npm run build` which will execute `prisma generate && prisma migrate deploy && next build`).
   - **Install Command**: Set to default (`npm install`).
4. **Add Environment Variables**:
   - Expand the **Environment Variables** section.
   - Add the variables listed in the table above.
5. **Deploy**:
   - Click **Deploy**. Vercel will build your application and automatically run database migrations on Neon via Prisma.

---

## 5. Continuous Development & Updates

To push updates without breaking data:
1. Make code or schema changes locally.
2. If schema changes are made (`prisma/schema.prisma`), run:
   - `npx prisma migrate dev --name <migration_name>` to create a new migration folder in `prisma/migrations`.
3. Commit and push the migration folder to GitHub.
4. Vercel will auto-trigger a deployment, automatically run `prisma migrate deploy` (applying new migrations safely without data loss), compile pages, and update the live app.

---

## 6. Pre-Flight Deployment Checklist

- [ ] `.env` is NOT committed to version control (`.gitignore` lists `.env`).
- [ ] Zod environment validation utility `src/lib/env.ts` is imported in `src/lib/db.ts` and `src/lib/auth.ts`.
- [ ] Public `/api/health` check responds with `{ "status": "ok" }`.
- [ ] Sandbox authentication is blocked when running in `production`.
- [ ] Build script in `package.json` contains `prisma migrate deploy` before building.
- [ ] Middleware handles API routes with clean `401 Unauthorized` JSON responses.
- [ ] Global error fallback boundaries (`src/app/error.tsx`) and loading indicators (`src/app/loading.tsx`) are verified.
- [ ] Neon connection strings have `sslmode=require` enabled.
