# Architecture

## Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19, Server Components, Server Actions) |
| Styling | Tailwind CSS v4, tokens and component classes in `src/app/globals.css` |
| Database and auth | Supabase (Postgres + Row Level Security + email/password auth) |
| File storage | Supabase Storage (public buckets `player-photos`, `team-logos`, admin-only write) |
| Supabase client | `@supabase/ssr` with cookie sessions (server side only; there is no browser client) |
| Hosting | Vercel, auto-deploy from GitHub `main` (Root Directory `footvolley-league`) |
| DB tests | PGlite (Postgres in WASM), `npm run test:db` |

There is no separate API server. Pages read data in Server Components, and mutations go through Server Actions or Postgres RPC functions. **All permissions are enforced in the database by RLS** (and Storage policies), so the UI checks are for convenience only.

## Folder layout
```
footvolley-league/
├─ src/
│  ├─ proxy.ts                       Next 16 "proxy" (was middleware): refreshes the session, redirects to /login
│  ├─ app/
│  │  ├─ layout.tsx                  Root layout: RTL, Heebo font, Nav, sponsor footer
│  │  ├─ globals.css                 Color tokens, .card/.btn/.brand-card…, sand court, animations
│  │  ├─ page.tsx                    Home: hero, next open round, leaders, sponsor prizes, scoring summary
│  │  ├─ login/                      Sign in / sign up (actions.ts: login, signup, logout)
│  │  ├─ auth/confirm/route.ts       Email-confirmation callback (token_hash or PKCE code)
│  │  ├─ rounds/
│  │  │  ├─ page.tsx                 Loads all rounds + the user's progress → RoundDeck
│  │  │  ├─ RoundDeck.tsx            Client: swipeable deck of round cards (banner style)
│  │  │  ├─ actions.ts               saveMatchPredictions, saveSquad (RPC save_squad)
│  │  │  └─ [number]/
│  │  │     ├─ page.tsx              Round page: predictions (open) or results + points (locked), squad section
│  │  │     ├─ PredictionsForm.tsx   Client: dark match cards with score inputs, quick win, VS divider
│  │  │     └─ SandPitch.tsx         Client: sand-court squad picker (slots, picker sheet, captain), read-only after lock
│  │  ├─ predict-table/              Pre-season table prediction (drag / arrows)
│  │  ├─ standings/                  Live league table computed from results
│  │  ├─ leaderboard/                Overall ranking + sponsor prizes
│  │  ├─ players/                    Public player points (season / per round), photos, round MVP 🏅
│  │  ├─ rules/                      Scoring rules page, values read live from the season row
│  │  ├─ leagues/                    Private friends leagues, invite code, league leaderboard
│  │  ├─ join/[code]/                Invite link landing page
│  │  ├─ admin/                      Admin area (see below)
│  │  └─ icon.png, apple-icon.png    XIMOBILITY "XI" app icon
│  ├─ components/
│  │  ├─ Nav.tsx                     Header: logo, MainMenu button, NavLinks shortcuts row
│  │  ├─ MainMenu.tsx                Client: menu button + full-screen banner-style menu
│  │  ├─ NavLinks.tsx                Client: scrolling shortcuts row, active page + pending state (also used in admin)
│  │  ├─ Sponsor.tsx                 SponsorLogo, SponsorPrizes, SPONSOR_URL
│  │  ├─ PlayerAvatar.tsx            Player photo in a circle, or initials
│  │  ├─ Flag.tsx                    SVG flags (IL / BR) + NATIONALITY_LABEL
│  │  ├─ TeamBadge.tsx               Team logo circle (or first letter) + name
│  │  ├─ VsDivider.tsx               Turquoise "VS" line between two teams
│  │  ├─ LeaderboardTable, ZoneLegend, ConfirmButton, NoSeason
│  └─ lib/
│     ├─ supabase/                   server.ts (per-request client), proxy.ts (session refresh), env.ts
│     ├─ data.ts                     getSessionUser, requireUser, requireAdmin, getActiveSeason (React cache)
│     ├─ scoring.ts                  isValidSetScore, predictionPoints, computeStandings, zones, PLAYER_RULES, quadMultiplier
│     ├─ format.ts                   Dates in Asia/Jerusalem, datetime-local conversions
│     └─ types.ts                    Row types (Season, Team, Player, Round, Match, MatchPlayerStat, …)
├─ supabase/
│  ├─ migrations/                    Ordered SQL files. The owner runs them in the SQL Editor (see DATABASE.md)
│  └─ tests/db.test.mjs              Runs all migrations on PGlite (with auth/storage stand-ins) and checks RLS, deadlines, scoring
├─ public/xi-logo.png                Sponsor logo (white text, for dark backgrounds)
└─ docs/                             These docs (+ CHANGELOG.md)
```

### Admin area (`src/app/admin/`)
| File | Purpose |
|---|---|
| `layout.tsx` | `requireAdmin()`, admin sub-nav (`NavLinks` light), `AdminNotice` |
| `page.tsx` | Season settings, prizes, personal scoring values, squad size / Brazilian limit |
| `teams/page.tsx` | Teams (name, logo) and players (name, nationality, active, photo) |
| `rounds/page.tsx` | Rounds list: create 11 rounds, deadlines, stage |
| `rounds/[id]/page.tsx` + `MatchStatsForm.tsx` | Matches and results, per-match player stats, round MVP, manual adjustments |
| `standings/page.tsx` | Final regular-season positions |
| `ImageEditor.tsx` | Client: shared upload + circular crop dialog (`PlayerPhotoEditor`, `TeamLogoEditor`) |
| `actions.ts` | All admin server actions |
| `AdminNotice.tsx` | Shows `?ok` / `?error` after a form post |

## Request flow
1. `src/proxy.ts` runs on every non-static request. It refreshes the Supabase session cookie and redirects anonymous users away from `/predict-table`, `/leagues`, `/admin` and `/join`.
2. Server Components call `createClient()` from `lib/supabase/server.ts`, which acts as the signed-in user, so RLS applies.
3. Page-level guards: `requireUser(next)` and `requireAdmin()` from `lib/data.ts`. The admin layout calls `requireAdmin()` once for the whole `/admin` tree.
4. Mutations:
   - **User actions:** `rounds/actions.ts`, `predict-table/actions.ts`, `leagues/actions.ts`. Client components call them and show `{ ok | error }`.
   - **Admin form actions:** `admin/actions.ts`, plain `<form action>` posts. They finish with `done(fd, error?)`, which revalidates and redirects back to `return_to` with `?ok=1` or `?error=...`.
   - **Admin client-called actions** (image upload/remove): return `{ ok, error, url }` and call `revalidatePath` themselves.
5. Images: the browser crops to a 400×400 WebP and posts it to `uploadPlayerPhoto` / `uploadTeamLogo` (FormData, ≤1MB). The server uploads to Storage, stores the public URL (`players.photo_url` / `teams.logo_url`) and removes older files.

## The active season
Almost every page works on the **active season** (`seasons.is_active = true`, at most one, enforced by a partial unique index). `getActiveSeason()` is cached per request. With no active season, pages render `<NoSeason />`.

## Time zones
Deadlines are stored as `timestamptz` (UTC). The admin enters Israel time in `datetime-local` inputs. `fromLocalInput` and `toLocalInput` in `lib/format.ts` convert, including daylight saving time. Display always uses `formatDateTime` (he-IL, Asia/Jerusalem).

## Auth
- Email + password through Supabase Auth. Sign-up stores `display_name` in user metadata. The `handle_new_user` trigger creates the `profiles` row (name padded to at least 2 characters).
- Admin = `profiles.is_admin`. Users cannot change it: the column is not granted for update. Set it with SQL (see DEPLOYMENT.md). Admins reach `/admin` from the main menu (⚙️ ניהול).
- Email confirmation links land on `/auth/confirm`. Its base URL comes from `NEXT_PUBLIC_SITE_URL`.

## Conventions
- UI text is Hebrew. Layout is `dir="rtl"`. Numbers, scores and codes that must read left-to-right get `dir="ltr"`.
- Server Components by default. Client components: `PredictionsForm`, `SandPitch`, `RoundDeck`, `TableOrderForm`, `LoginForm`, `LeagueForms`, `CopyInvite`, `AdminNotice`, `ConfirmButton`, `MainMenu`, `NavLinks`, `ImageEditor`.
- Page files may only export Next's allowed page exports. Keep helpers non-exported or in `components/`.
- Destructive admin buttons use `ConfirmButton`, because deletes cascade to predictions.
- Mobile first: every screen must work at 375px width.
- Internal names still say "quad" (`quad_picks`, `quad_multiplier`, `quad_points`) even though the feature is now the 6-player "squad" (שישייה).
