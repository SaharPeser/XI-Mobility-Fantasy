# Deployment and environments

## Services
| Service | Project | Notes |
|---|---|---|
| GitHub | `SaharPeser/XI-Mobility-Fantasy` | App code is in the `footvolley-league/` folder of the repo |
| Vercel | team `footvolley`, project `footvolley` | Root Directory **`footvolley-league`**, Framework Next.js, auto-deploy on push to `main` |
| Domain | https://ximobilityfantasy.vercel.app | The old `footvolley.vercel.app` redirects here |
| Supabase | ref `akgcwifctvrnnhjopqkg` | Frankfurt. SQL Editor: https://supabase.com/dashboard/project/akgcwifctvrnnhjopqkg/sql/new |

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

## Troubleshooting
| Symptom | Cause |
|---|---|
| Vercel `404: NOT_FOUND` on every page | Root Directory is not `footvolley-league` |
| `Your project's URL and Key are required` | Env vars missing, or the server started from another folder |
| "יש להריץ ב-Supabase את קובץ ה-SQL..." in admin | A migration has not been run yet |
| `PGRST205 Could not find the table` | Migration not run in this Supabase project |
| Email confirmation link opens localhost | `NEXT_PUBLIC_SITE_URL` or Supabase Site URL is wrong |
