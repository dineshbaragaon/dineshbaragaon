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
- Prisma + SQLite (swap the datasource for Postgres/MySQL in production —
  see below)
- NextAuth (credentials-based login; accounts are created by the admin, no
  external OAuth setup required)
- Tailwind CSS

## Getting started

```bash
npm install
cp .env.example .env      # then edit NEXTAUTH_SECRET, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
npx prisma migrate dev    # creates the SQLite database
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

## Moving to production

- Switch `datasource db` in `prisma/schema.prisma` from `sqlite` to
  `postgresql` (or your provider of choice) and point `DATABASE_URL` at a
  real database — everything else (models, API routes) is unchanged.
- Set `NEXTAUTH_URL` to your deployed URL and use a freshly generated
  `NEXTAUTH_SECRET`.
- Deploy to any Node host that supports Next.js (Vercel, Render, a VPS,
  etc.) — run `npx prisma migrate deploy` once against the production
  database before starting the app.
