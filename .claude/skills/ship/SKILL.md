---
name: ship
description: Verify, update the docs and changelog, commit, push and confirm the live Vercel deploy for the footvolley app, then report to the owner in Hebrew. Use after the owner approves a change ("מאשר"), or when they ask to upload or deploy.
---

# Ship a change

Run this only after the owner has seen the change locally and approved it (`local-preview` skill). Pushing to `main` is then pre-approved. Vercel auto-deploys `main` (Root Directory `footvolley-league`).

## 1. Verify (from `footvolley-league/`)
```bash
npx tsc --noEmit
npx eslint src
npm run test:db
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=x npx next build --experimental-build-mode=compile
```
- Wrap long commands with `timeout 150` (eslint/tsc can hang on this machine), and filter out `npm notice` lines.
- If `tsc` complains about a route that no longer exists (e.g. `dev-preview`), run `rm -rf .next/types .next/dev/types && npx next typegen`.
- Fix every failure before committing. Never skip hooks.

## 2. Update the docs and skills (required, every change)
The owner asked that **every change** is written down, so nothing is lost when a conversation's context runs out. In the same commit:
- [ ] `footvolley-league/docs/CHANGELOG.md`: a new entry at the top with the date, what changed for users, any SQL, and the main files.
- [ ] Docs the change touches: `ARCHITECTURE.md` (new files/components), `DATABASE.md` (schema, RLS, Storage, migrations table), `DESIGN.md` (UI patterns), `SCORING.md` + `SCORING-MODEL.md` (scoring), `ADMIN-GUIDE.md` (anything the admin does differently, in Hebrew), `ROADMAP.md` (tick done items), `README.md` (feature list).
- [ ] `DEPLOYMENT.md` → "Migrations applied in production": add the new migration once verified.
- [ ] Root `CLAUDE.md` and `.claude/skills/*`: update if a workflow, pattern or rule changed.

## 3. Check what is being committed (from the repo root)
```bash
git status --short
```
- Must **not** include `.env.local`, `.claude/settings.local.json`, `node_modules`, `.next` or `src/app/dev-preview`.
- `.claude/skills/` **is** committed.

## 4. Commit and push
Commit message: Hebrew summary line, then short bullet points, then the co-author trailer.
```bash
git add -A
git commit -m "<Hebrew summary>

- <what changed>

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

## 5. Confirm the deploy
- Poll for a marker of the change, for example:
  `for i in $(seq 1 12); do curl -s -m 20 https://ximobilityfantasy.vercel.app/<page> | grep -q '<marker>' && echo LIVE && break; sleep 15; done`
  It usually takes 15–60 seconds. If curl hangs, use the browser pane (`navigate` + `javascript_tool`).
- A 404 on every page means Vercel's Root Directory was changed. See `docs/DEPLOYMENT.md`.

## 6. Report to the owner (Hebrew)
- That it is uploaded and live (say what you checked).
- What changed, in plain words (no file names unless asked).
- Any action they must take (run a SQL file, fill new admin fields, upload images).
- The commits link: https://github.com/SaharPeser/XI-Mobility-Fantasy/commits/main
