# Footvolley predictions game (XIMOBILITY)

A predictions game for the Israeli footvolley league, sponsored by XIMOBILITY. Users predict exact match scores, rank the final table, and pick a 6-player "squad" (שישיית המחזור) with a captain on a sand court. Players earn personal points per match, entered by the admin. Built with Next.js 16 + Supabase (DB, auth, Storage), deployed on Vercel.

## Where things are
- The app lives in `footvolley-league/`. Run every npm command from there.
- Git root is this folder. GitHub: `SaharPeser/XI-Mobility-Fantasy`, branch `main`.
- Vercel project `footvolley` builds from Root Directory `footvolley-league` and auto-deploys every push to `main`. Live site: https://ximobilityfantasy.vercel.app
- Supabase project ref: `akgcwifctvrnnhjopqkg`. Storage buckets `player-photos`, `team-logos`.
- Local dev server: `npx next dev -p 3002` (uses the **production** database).

## Read before changing things
| Topic | Doc |
|---|---|
| **What was built and when** (start here) | `footvolley-league/docs/CHANGELOG.md` |
| Code layout, auth, data flow | `footvolley-league/docs/ARCHITECTURE.md` |
| Tables, RLS, SQL functions, Storage, migrations | `footvolley-league/docs/DATABASE.md` |
| Scoring rules and where they are computed | `footvolley-league/docs/SCORING.md` |
| Scoring model for users (Hebrew, keep in sync with defaults) | `footvolley-league/docs/SCORING-MODEL.md` |
| Brand, colors, UI components, navigation | `footvolley-league/docs/DESIGN.md` |
| Supabase, Vercel, env vars, applied migrations, troubleshooting | `footvolley-league/docs/DEPLOYMENT.md` |
| Planned features | `footvolley-league/docs/ROADMAP.md` |
| Admin guide for the league manager (Hebrew) | `footvolley-league/docs/ADMIN-GUIDE.md` |

Next.js 16 differs from older versions (`proxy.ts` instead of middleware, async `params`/`cookies()`, `useLinkStatus`). See `footvolley-league/AGENTS.md` and read `node_modules/next/dist/docs/` before using an unfamiliar API.

## Project skills
- `db-migration`: any database or Storage change (tables, columns, RLS, SQL functions, buckets).
- `add-scoring-rule`: a new way to earn points.
- `admin-feature`: new screens or actions in `/admin` (including image upload).
- `brand-ui`: UI work in the XIMOBILITY banner style.
- `local-preview`: show a change to the owner on the local dev server before committing.
- `ship`: verify, update docs, commit, push and check the live deploy.

## Working with the owner (standing rules)
1. **Language.** The owner (Sahar) speaks Hebrew and is not a developer. Reply in Hebrew, with short numbered steps that name the exact buttons on screen. The UI is Hebrew and RTL. Developer docs and code are in English; short code comments may be Hebrew (matching existing code).
2. **Show before committing.** Every visible change is shown to the owner first on the local dev server (`local-preview` skill). Commit and push only after they approve ("מאשר"). Keep migrations additive, so the live site keeps working while they preview.
3. **Update the docs and skills with every change.** In the same commit: add an entry to `docs/CHANGELOG.md`, update the docs the change touches (ARCHITECTURE, DATABASE, DESIGN, SCORING, ADMIN-GUIDE, SCORING-MODEL, DEPLOYMENT's applied-migrations table, ROADMAP), and update the skills if a pattern or workflow changed. The owner asked for this so that nothing is lost when a conversation's context runs out.
4. **Pushing** to `main` is pre-approved once the owner approves the change. Commit messages are in Hebrew. After pushing, verify the live site and give the commits link https://github.com/SaharPeser/XI-Mobility-Fantasy/commits/main
5. **Database changes:** the owner runs migrations by hand in the Supabase SQL Editor. Copy the SQL to the clipboard and open the editor for them (`db-migration` skill), then verify it ran.
