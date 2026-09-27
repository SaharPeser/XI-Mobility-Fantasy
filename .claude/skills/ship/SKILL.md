---
name: ship
description: Verify, commit, push and confirm the live Vercel deploy for the footvolley app, then report to the owner in Hebrew. Use at the end of every code change, or when the owner asks to upload or deploy.
---

# Ship a change

Pushing to `main` is pre-approved by the owner. Vercel auto-deploys `main` (Root Directory `footvolley-league`).

## 1. Verify (from `footvolley-league/`)
```bash
npx tsc --noEmit
npx eslint src
npm run test:db
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=x npx next build
```
- If `tsc` complains about a route that no longer exists, delete `.next` and run `npx next typegen` first.
- Fix every failure before committing. Never skip hooks.

## 2. Check what is being committed (from the repo root)
```bash
git status --short
```
- Must **not** include `.env.local`, `.claude/settings.local.json`, `node_modules`, `.next` or temporary preview routes.
- `.claude/skills/` **is** committed.

## 3. Commit and push
Commit message: Hebrew summary line, then short bullet points, then the co-author trailer.
```bash
git add -A
git commit -m "<Hebrew summary>

- <what changed>

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

## 4. Confirm the deploy
- Wait about 1–2 minutes, then open https://ximobilityfantasy.vercel.app in the browser pane (`navigate` + `get_page_text`) and check the change is live.
- A 404 on every page means Vercel's Root Directory was changed. See `docs/DEPLOYMENT.md`.

## 5. Report to the owner (Hebrew)
- What changed, in plain words (no file names unless asked).
- Any action they must take (usually: run a SQL file, see the `db-migration` skill; or fill new admin fields).
- The commits link: https://github.com/SaharPeser/XI-Mobility-Fantasy/commits/main
