---
name: db-migration
description: Make any database change in the footvolley app (new table, column, RLS policy, SQL function or RPC), test it on PGlite, and hand the SQL to the owner to run in the Supabase SQL Editor. Use whenever a feature needs schema or permission changes.
---

# Database migration

The production database is changed **by hand**: the owner pastes SQL into the Supabase SQL Editor. There is no `supabase db push` in the workflow. Read `footvolley-league/docs/DATABASE.md` first.

## Steps

1. **Create a new file.** Never edit a migration that was already run.
   `footvolley-league/supabase/migrations/<YYYYMMDDHHMMSS>_<snake_name>.sql`, with a timestamp later than every existing file. Start with a one-line Hebrew or English comment saying what it is for.

2. **Write idempotent-friendly SQL** where cheap: `add column if not exists`, `create or replace function`, `drop policy if exists` before `create policy`.

3. **Security checklist** for every new table:
   - `alter table ... enable row level security;` plus explicit policies in the same file.
   - League data (read by all, written by admin): `for select using (true)` and `for all using (public.is_admin()) with check (public.is_admin())`.
   - User-owned data: `user_id = auth.uid()` on read and write, plus a deadline check if it is a prediction.
   - Validation across rows ("exactly 4", "all teams once", deadlines) goes in a `security definer set search_path = public` function with `grant execute ... to authenticated`. Do not add a direct insert policy in that case.
   - Never expose other users' predictions before the relevant deadline.

4. **Update the app code** so it works **both before and after** the owner runs the SQL. The deploy may land first. Prefer `select("*")` plus optional TypeScript fields (`field?: T | null`), and map "column does not exist" errors to a Hebrew message like "יש להריץ ב-Supabase את קובץ ה-SQL של ...". See `updateSeason` in `src/app/admin/actions.ts` for an example.

5. **Update types** in `src/lib/types.ts` and docs in `docs/DATABASE.md` (the migrations table plus the tables, functions or RLS tables). Update `docs/SCORING.md` if scoring changed.

6. **Test.** Add checks to `supabase/tests/db.test.mjs`. It loads every migration in order, and `as(uid, sql)` runs SQL as a user under RLS. Then run from `footvolley-league/`:
   ```bash
   npm run test:db
   ```
   All tests must print PASS.

7. **Hand the SQL to the owner.** Copy it and open the editor (PowerShell):
   ```powershell
   Get-Content -Raw -Encoding UTF8 "<abs path to migration>" | Set-Clipboard; Start-Process "https://supabase.com/dashboard/project/akgcwifctvrnnhjopqkg/sql/new"
   ```
   Then tell the owner, in Hebrew, with numbered steps: click in the editor, Ctrl+A and Delete if there is old text, Ctrl+V, **Run**, confirm the destructive-operation warning if shown, and expect **Success**.

8. **Verify it ran.** Query through the REST API with the public key from `footvolley-league/.env.local`:
   ```bash
   curl -s "https://akgcwifctvrnnhjopqkg.supabase.co/rest/v1/<table>?select=<new_column>&limit=1" -H "apikey: <publishable key>"
   ```
   `PGRST205` or `42703` means it has not been run yet.

9. Ship with the `ship` skill.
