# LeadFlow

A lead assignment and status-tracking tool for running a freelancer-sourced
lead pipeline: freelancers submit leads, an admin routes them to a team
member for qualification, qualified leads get handed to a sales manager to
work, and every status change (and any request for rework) is visible back
to the freelancer who sourced the lead.

## Roles

- **Admin** — creates all accounts (freelancers, qualifiers, sales
  managers) using their Gmail address as the login email, assigns new leads
  to a qualifier, and hands qualified leads to a sales manager.
- **Freelancer** — submits leads, sees their status update live (new →
  in qualification → qualified/rejected/needs rework → assigned to sales →
  in progress → converted/closed), and can resubmit a lead with a comment
  when asked to rework it.
- **Qualifier** ("team") — reviews leads assigned to them and decides:
  Qualify, Reject, or Request rework (with a required comment explaining
  what's missing).
- **Sales Manager** — works qualified leads assigned to them, updates
  status (In progress / Converted / Closed), and can also send a lead back
  to the freelancer for rework with a comment.

Every lead has a running comment thread, visible to everyone involved with
that lead (freelancer, admin, assigned qualifier, assigned sales manager),
so decisions and rework requests are always explained in context.

## Tech stack

- Next.js (App Router) + TypeScript
- Prisma + PostgreSQL
- NextAuth (credentials-based login; accounts are created by the admin, no
  external OAuth setup required)
- Tailwind CSS

## Getting started (local development)

You need a Postgres database — the free tier on [Neon](https://neon.tech) or
[Vercel Postgres](https://vercel.com/storage/postgres) both work fine and take
about a minute to set up.

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, NEXTAUTH_SECRET, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
npx prisma migrate dev    # creates the tables
npm run db:seed           # creates the first admin account
npm run dev
```

Generate a real secret for `NEXTAUTH_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Then sign in at `/login` with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. From
the admin's **Manage users** page, create accounts for your qualifiers,
sales managers, and freelancers (each one logs in with the Gmail address and
temporary password you set for them — they can't self-register).

## How the workflow maps to the app

1. Freelancer submits a lead → status `New`.
2. Admin assigns it to a qualifier → `In qualification`.
3. Qualifier decides:
   - **Qualify** → `Qualified` (ready for the admin to hand to sales).
   - **Reject** → `Rejected` (closed, with a required comment).
   - **Request rework** → `Needs rework`; the freelancer sees the comment,
     edits the lead, and resubmits — it goes straight back to the same
     qualifier.
4. Admin assigns a qualified lead to a sales manager → `Assigned to sales`.
5. Sales manager updates status as they work it: `In progress`,
   `Converted`, or `Closed`. They can also **Send back to freelancer**
   (`Needs rework`) with a comment if the lead needs more info — resubmitting
   sends it back to the same sales manager.

All of this is visible to the freelancer on their own dashboard in real
time, including every comment left along the way.

## Deploying to Vercel

1. **Push this repo to GitHub** (already done if you're reading this from
   the repo) and go to [vercel.com/new](https://vercel.com/new) → import it.
2. **Add a Postgres database**: in the new Vercel project, open the
   **Storage** tab → **Create Database** → Postgres (Neon-powered). Vercel
   automatically adds a `DATABASE_URL` environment variable for you.
3. **Add the remaining environment variables** under Project Settings →
   Environment Variables:
   - `NEXTAUTH_SECRET` — generate with
     `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `NEXTAUTH_URL` — your Vercel URL, e.g. `https://your-app.vercel.app`
   - `SEED_ADMIN_EMAIL` — your Gmail address (this becomes your admin login)
   - `SEED_ADMIN_PASSWORD` — a strong password (8+ characters)
4. **Deploy.** The build command (`prisma migrate deploy && prisma db seed
   && next build`) creates the tables and your admin account automatically
   on first deploy — no shell access needed. Every later deploy re-runs the
   same command safely (it won't overwrite an existing admin account).
5. Sign in at `https://your-app.vercel.app/login` with the
   `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` you set, then use **Manage
   users** to create accounts for your qualifiers, sales managers, and
   freelancers.

This also works the same way on any other Node host (Render, Railway, a
VPS, etc.) — just point `DATABASE_URL` at your Postgres instance and set the
same environment variables.
