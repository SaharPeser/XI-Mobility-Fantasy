# Deployment and environments

## Services
| Service | Project | Notes |
|---|---|---|
| GitHub | `SaharPeser/XI-Mobility-Fantasy` | App code is in the `footvolley-league/` folder of the repo |
| Vercel | team `footvolley`, project `footvolley` | Root Directory **`footvolley-league`**, Framework Next.js, auto-deploy on push to `main`. Functions run in **`fra1` (Frankfurt)**, set in `footvolley-league/vercel.json`, so they sit next to the Supabase DB. Don't remove it: in `iad1` every query crosses the Atlantic and pages took 1–1.4 s. Check with the `X-Vercel-Id` header (`fra1::fra1::…`) |
| Domain | https://ximobilityfantasy.vercel.app | The old `footvolley.vercel.app` redirects here |
| Supabase | ref `akgcwifctvrnnhjopqkg` | Frankfurt. SQL Editor: https://supabase.com/dashboard/project/akgcwifctvrnnhjopqkg/sql/new |
| Supabase Storage | buckets `player-photos`, `team-logos` | Public read, admin-only write (created by migrations) |

## Migrations applied in production
Keep this list current. A migration is "applied" only after the owner ran it in the SQL Editor and it was verified (see the `db-migration` skill).

| Migration | Applied |
|---|---|
| `20260924000000_init.sql` | ✅ 2026-09-24 |
| `20260925000000_sponsor_prizes.sql` | ✅ 2026-09-25 |
| `20260927000000_player_scoring.sql` | ✅ 2026-09-27 |
| `20260928000000_squad_nationality.sql` | ✅ 2026-09-28 |
| `20260930000000_player_photos.sql` | ✅ 2026-09-30 |
| `20261001000000_team_logos.sql` | ✅ 2026-10-01 |

## Environment variables
| Name | Value | Where |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://akgcwifctvrnnhjopqkg.supabase.co` | Vercel + `.env.local` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` (public key) | Vercel + `.env.local` |
| `NEXT_PUBLIC_SITE_URL` | `https://ximobilityfantasy.vercel.app` (local: `http://localhost:<port>`) | Vercel + `.env.local` |

- In Vercel these must be type **Config**, not **Secret**. Vercel refuses `NEXT_PUBLIC_*` as Secret, and a saved Secret cannot be converted, so delete it and re-create it.
- `NEXT_PUBLIC_*` values are baked in at build time. After changing one, **Redeploy**.
- The app never uses the Supabase **secret / service_role** key. Do not add it.
- `.env.local` is git-ignored. `.env.example` documents the names.

## Supabase Auth settings
- **URL Configuration**: Site URL `https://ximobilityfantasy.vercel.app`. Redirect URLs `https://ximobilityfantasy.vercel.app/**` and `http://localhost:3000/**` (add the local port you use).
- **Email → Confirm email**: currently off (sign-up works instantly). If turned on, confirmation links go to `/auth/confirm`.

## Deploy flow
1. Verify locally (see the `ship` skill): `npx tsc --noEmit`, `npx eslint src`, `npm run test:db`, `npx next build`.
2. Commit and `git push origin main` from the repo root.
3. Vercel builds automatically (about 1–2 min). Check **Deployments** for Ready or Error.
4. If the change includes a new migration, the owner must run it in the SQL Editor. Deploy code that tolerates the missing column, or ask the owner to run the SQL first.

## Running locally
```bash
cd footvolley-league
npm install
npm run dev
```
Port 3000 is often taken on the owner's machine by another app. Use `npx next dev -p 3002` and set `NEXT_PUBLIC_SITE_URL` to match. Local dev uses the **production** Supabase project, so test data you create is real. Clean it up afterwards.

**Previewing changes for the owner** (they review every visible change before it is committed). The full procedure is in the `local-preview` skill:
- Desktop: open `http://localhost:3002/...` in their browser (PowerShell `Start-Process`). They are signed in there as admin.
- Phone on the same Wi-Fi: `http://10.20.0.16:3002/...` (the Wi-Fi IP at the time of writing; check with `Get-NetIPAddress` and ignore the VMware adapters).
- Chrome device mode: F12, then Ctrl+Shift+M.
- `.env.local` and the dev server live in `Desktop\footvolley-league\footvolley-league`. The Claude preview pane once started a server from an old scratch folder, so start it with Bash from the right folder instead.

## Troubleshooting
| Symptom | Cause |
|---|---|
| Vercel `404: NOT_FOUND` on every page | Root Directory is not `footvolley-league` |
| `Your project's URL and Key are required` | Env vars missing, or the server started from another folder |
| "יש להריץ ב-Supabase את קובץ ה-SQL..." in admin | A migration has not been run yet |
| `PGRST205 Could not find the table` | Migration not run in this Supabase project |
| Email confirmation link opens localhost | `NEXT_PUBLIC_SITE_URL` or Supabase Site URL is wrong |
| Vercel refuses to save a `NEXT_PUBLIC_*` variable | It is set as **Secret**. Delete it and re-create it as **Config** |
| Image upload says "Bucket not found" / the SQL message | The photos/logos migration has not been run |
| `tsc` errors about a deleted route (e.g. `dev-preview`) | Stale `.next/types`: delete `.next/types` and `.next/dev/types`, then `npx next typegen` |
| `git push` blocked by the Claude permission classifier | The owner approves pushes in chat. `.claude/settings.local.json` (git-ignored) allows `git push` |
