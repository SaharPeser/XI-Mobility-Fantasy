---
name: add-scoring-rule
description: Add a new way to earn points in the footvolley predictions game (e.g. bonus for a perfect round, playoff predictions, MVP pick) end to end: settings, SQL leaderboard, UI, admin and tests. Use when the owner asks for a new scoring type or to change how points are calculated.
---

# Add or change a scoring rule

Read `footvolley-league/docs/SCORING.md` first. **`get_leaderboard()` in SQL is the source of truth.** The UI only mirrors it.

## 1. Decide the rule precisely
Write down in one line: what the user predicts, when it locks, what the admin enters, and the formula. If any part is ambiguous (points value, tie handling, which stage), ask the owner in Hebrew **before** coding, and offer a sensible default.

## 2. Database (use the `db-migration` skill)
In one new migration:
- A points setting on `seasons`, e.g. `pts_perfect_round int not null default 5`, so the admin can tune it.
- New tables for new kinds of predictions, with RLS (own rows; others' only after lock) and a `security definer` save RPC if validation spans rows.
- `create or replace function public.get_leaderboard(...)`: copy the **current** body from the latest migration that defines it, then add a CTE for the new points, a new output column (e.g. `bonus_points numeric`), and include it in `total` and in the `rank()` expression. Adding an output column changes the return type, so `drop function public.get_leaderboard(uuid, uuid);` first, then re-`grant execute ... to anon, authenticated`.

## 3. App code
| File | Change |
|---|---|
| `src/lib/types.ts` | New `Season` field, new `LeaderboardRow` field |
| `src/lib/scoring.ts` | Pure helper if points are shown per item in the UI (keep identical to SQL) |
| `src/components/LeaderboardTable.tsx` | New column (`hidden sm:table-cell` so phones show only the total) |
| `src/app/page.tsx` | Add a line to "איך צוברים נקודות?" |
| `src/app/admin/page.tsx` + `updateSeason` in `src/app/admin/actions.ts` | Input for the new setting |
| Prediction UI | New client form + server action, or extend the round page. Lock after the deadline, and show earned points after lock |
| Admin input | If the admin must enter results, add it to the relevant admin page with the `admin-feature` skill |

## 4. Tests
In `supabase/tests/db.test.mjs`, extend the scoring scenario: create the prediction, enter the result as admin, and assert the new column and the new `total` from `get_leaderboard`. Also check the lock (editing after the deadline fails). Run `npm run test:db`.

## 5. Docs and ship
Update `docs/SCORING.md` (a new section plus defaults) and `docs/DATABASE.md`. Then use the `ship` skill. Remind the owner to run the SQL, and that changing point values recalculates the whole season.
