# Architecture

## Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19, Server Components, Server Actions) |
| Styling | Tailwind CSS v4, tokens in `src/app/globals.css` |
| Database and auth | Supabase (Postgres + Row Level Security + email/password auth) |
| Supabase client | `@supabase/ssr` with cookie sessions |
| Hosting | Vercel, auto-deploy from GitHub `main` |
| DB tests | PGlite (Postgres in WASM), `npm run test:db` |

There is no separate API server. Pages read data in Server Components, and mutations go through Server Actions or Postgres RPC functions. **All permissions are enforced in the database by RLS**, so the UI checks are for convenience only.

## Folder layout
```
footvolley-league/
├─ src/
│  ├─ proxy.ts                     Next 16 "proxy" (was middleware): refreshes the session, redirects to /login
│  ├─ app/
│  │  ├─ layout.tsx                Root layout: RTL, Heebo font, Nav, sponsor footer
│  │  ├─ page.tsx                  Home: hero, next open round, leaders, sponsor prizes, scoring rules
│  │  ├─ login/                    Sign in / sign up (actions.ts has login, signup, logout)
│  │  ├─ auth/confirm/route.ts     Email-confirmation callback (token_hash or PKCE code)
│  │  ├─ rounds/                   Round list and round page (score predictions + quad picker)
│  │  ├─ predict-table/            Pre-season table prediction (drag / arrows)
│  │  ├─ standings/                Live league table computed from results
│  │  ├─ leaderboard/              Overall ranking + sponsor prizes
│  │  ├─ leagues/                  Private friends leagues, invite code, league leaderboard
│  │  ├─ join/[code]/              Invite link landing page
│  │  ├─ admin/                    Admin area (see below)
│  │  ├─ icon.png, apple-icon.png  XIMOBILITY "XI" app icon
│  ├─ components/                  Nav, Sponsor, LeaderboardTable, TeamBadge, ZoneLegend, ConfirmButton, NoSeason
│  └─ lib/
│     ├─ supabase/                 server.ts (per-request client), proxy.ts (session refresh), env.ts
│     ├─ data.ts                   getSessionUser, requireUser, requireAdmin, getActiveSeason (React cache)
│     ├─ scoring.ts                isValidSetScore, predictionPoints, computeStandings, table zones
│     ├─ format.ts                 Dates in Asia/Jerusalem, datetime-local conversions
│     └─ types.ts                  Row types (Season, Team, Player, Round, Match, ...)
├─ supabase/
│  ├─ migrations/                  Ordered SQL files. The owner runs them in the SQL Editor.
│  └─ tests/db.test.mjs            Runs all migrations on PGlite and checks RLS, deadlines and scoring
├─ public/xi-logo.png              Sponsor logo (white text, for dark backgrounds)
└─ docs/                           These docs
```

## Request flow
1. `src/proxy.ts` runs on every non-static request. It refreshes the Supabase session cookie and redirects anonymous users away from `/predict-table`, `/leagues`, `/admin` and `/join`.
2. Server Components call `createClient()` from `lib/supabase/server.ts`, which acts as the signed-in user, so RLS applies.
3. Page-level guards: `requireUser(next)` and `requireAdmin()` from `lib/data.ts`. The admin layout calls `requireAdmin()` once for the whole `/admin` tree.
4. Mutations:
   - User actions: `rounds/actions.ts`, `predict-table/actions.ts`, `leagues/actions.ts`. Client components call them and show `{ ok | error }`.
   - Admin actions: `admin/actions.ts`, plain `<form action>` posts. They finish with `done(fd, error?)`, which revalidates and redirects back to the form's `return_to` with `?ok=1` or `?error=...`. `AdminNotice` shows the message.
5. After a mutation, `revalidatePath` refreshes the affected pages.

## The active season
Almost every page works on the **active season** (`seasons.is_active = true`, at most one, enforced by a partial unique index). `getActiveSeason()` is cached per request. With no active season, pages render `<NoSeason />`.

## Time zones
Deadlines are stored as `timestamptz` (UTC). The admin enters Israel time in `datetime-local` inputs. `fromLocalInput` and `toLocalInput` in `lib/format.ts` convert, including daylight saving time. Display always uses `formatDateTime` (he-IL, Asia/Jerusalem).

## Auth
- Email + password through Supabase Auth. Sign-up stores `display_name` in user metadata. The `handle_new_user` trigger creates the `profiles` row (name padded to at least 2 characters).
- Admin = `profiles.is_admin`. Users cannot change it: the column is not granted for update. Set it with SQL (see DEPLOYMENT.md).
- Email confirmation links land on `/auth/confirm`. Its base URL comes from `NEXT_PUBLIC_SITE_URL`.

## Conventions
- UI text is Hebrew. Layout is `dir="rtl"`. Numbers, scores and codes that must read left-to-right get `dir="ltr"`.
- Server Components by default. Add `"use client"` only for interactive forms (`PredictionsForm`, `QuadPicker`, `TableOrderForm`, `LoginForm`, `LeagueForms`, `CopyInvite`, `AdminNotice`, `ConfirmButton`).
- Page files may only export Next's allowed page exports. Keep helpers non-exported or in `components/`.
- Destructive admin buttons use `ConfirmButton`, because deletes cascade to predictions.
- Mobile first: every screen must work at 375px width.
