# Footvolley predictions game (XIMOBILITY)

A predictions game for the Israeli footvolley league, sponsored by XIMOBILITY. Users predict exact match scores, rank the final table, and pick a weekly "quad" of players. Built with Next.js 16 + Supabase, deployed on Vercel.

## Where things are
- The app lives in `footvolley-league/`. Run every npm command from there.
- Git root is this folder. GitHub: `SaharPeser/XI-Mobility-Fantasy`, branch `main`.
- Vercel project `footvolley` builds from Root Directory `footvolley-league` and auto-deploys every push to `main`. Live site: https://ximobilityfantasy.vercel.app
- Supabase project ref: `akgcwifctvrnnhjopqkg`.

## Read before changing things
| Topic | Doc |
|---|---|
| Code layout, auth, data flow | `footvolley-league/docs/ARCHITECTURE.md` |
| Tables, RLS, SQL functions, migrations | `footvolley-league/docs/DATABASE.md` |
| Scoring rules and where they are computed | `footvolley-league/docs/SCORING.md` |
| Brand, colors, UI components | `footvolley-league/docs/DESIGN.md` |
| Supabase, Vercel, env vars, domain | `footvolley-league/docs/DEPLOYMENT.md` |
| Planned features | `footvolley-league/docs/ROADMAP.md` |
| Admin guide for the league manager (Hebrew) | `footvolley-league/docs/ADMIN-GUIDE.md` |

Next.js 16 differs from older versions (`proxy.ts` instead of middleware, async `params`/`cookies()`). See `footvolley-league/AGENTS.md` and read `node_modules/next/dist/docs/` before using an unfamiliar API.

## Project skills
- `db-migration`: any database change (tables, columns, RLS, SQL functions).
- `add-scoring-rule`: a new way to earn points.
- `admin-feature`: new screens or actions in `/admin`.
- `brand-ui`: UI work in the XIMOBILITY style.
- `ship`: verify, commit, push and check the live deploy.

## Working with the owner
- The owner (Sahar) speaks Hebrew and is not a developer. Reply in Hebrew with short numbered steps that name the exact buttons on screen.
- The UI is Hebrew and RTL. Code, comments in English files, and docs for developers are in English. Short code comments may be in Hebrew (matching existing code).
- Pushing to `main` is pre-approved. After every change: verify, commit with a clear Hebrew message, push, and give the owner the commits link https://github.com/SaharPeser/XI-Mobility-Fantasy/commits/main
- The owner runs database migrations by hand in the Supabase SQL Editor. Copy the SQL to the clipboard and open the editor for them (see the `db-migration` skill).
