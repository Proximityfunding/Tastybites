# Store App — Mini Store Business Management Platform

POS + online ordering + inventory + CRM + expenses + accounting for a small
food store. See `Spec.md` (project root) for the full product spec.

## Prerequisites

- Node.js 20+
- PostgreSQL — this project uses a **portable, no-install PostgreSQL 17**
  instance at `C:\Users\Andrian\pgsql17` (not a Windows service, since the
  full installer requires interactive UAC elevation that wasn't available
  when this was set up). You must start it manually before running the app.

## Starting Postgres

Postgres does **not** start automatically on boot. Start it before `npm run dev`:

```bash
"C:\Users\Andrian\pgsql17\bin\pg_ctl.exe" -D "C:\Users\Andrian\pgsql17\data" -l "C:\Users\Andrian\pgsql17\logfile.txt" -o "-p 5432" start
```

Check it's running:

```bash
"C:\Users\Andrian\pgsql17\bin\pg_isready.exe" -p 5432
```

Stop it:

```bash
"C:\Users\Andrian\pgsql17\bin\pg_ctl.exe" -D "C:\Users\Andrian\pgsql17\data" stop
```

Database credentials (dev only, see `.env`): user `storeapp` / password
`storeapp_dev_pw`, database `storeapp`. Superuser is `postgres` / `wampstorepass`.

## Getting Started

```bash
npm install
npx prisma migrate dev   # first time / after schema changes
npx prisma db seed       # loads sample menu, chart of accounts, owner login
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public storefront,
or [http://localhost:3000/login](http://localhost:3000/login) for staff.

**Seeded login:** `owner@store.local` / `password123` (Owner/Admin role).

## Architecture notes

- **Stack deviates from a "typical" Next.js app** because this machine runs
  Next.js 16.2.10 / React 19.2.4 — a version far ahead of any public
  release. `middleware.ts` is renamed `proxy.ts` in this version (see
  `src/proxy.ts`). Read `node_modules/next/dist/docs/` before assuming any
  API works the way you remember.
- Prisma 7 requires an explicit driver adapter — see `src/lib/db.ts`
  (`@prisma/adapter-pg`).
- All monetary values are stored as **integer centavos** (`src/lib/money.ts`
  converts to/from ₱ display).
- `src/lib/orders.ts` is the single source of truth for order lifecycle:
  creating orders, deducting stock, posting ledger entries, and voiding with
  full reversal. Every module (POS, online storefront, deliveries) goes
  through it so books stay consistent — see spec §11.
- RBAC is enforced in two layers: `src/proxy.ts` blocks unauthenticated
  access to all staff routes, and `src/lib/access.ts`'s `requirePageRole()` /
  `requireRole()` enforce per-role access in both page components (redirects
  to `/unauthorized`) and server actions (throws, caught as a form error).
  The sidebar (`src/app/(dashboard)/Sidebar.tsx`) only controls what's
  *shown* — it is not a security boundary on its own.
