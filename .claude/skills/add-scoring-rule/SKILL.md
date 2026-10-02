---
name: add-scoring-rule
description: Add a new way to earn points in the footvolley predictions game (e.g. bonus for a perfect round, playoff predictions, MVP pick) end to end: settings, SQL leaderboard, UI, admin and tests. Use when the owner asks for a new scoring type or to change how points are calculated.
---

# Add or change a scoring rule

Read `footvolley-league/docs/SCORING.md` first. **`get_leaderboard()` in SQL is the source of truth.** The UI only mirrors it.

Two kinds of scoring exist. Pick the right one:
- **User points** (predictions, table, squad): computed in `get_leaderboard`.
- **Player personal points** (feed the squad): computed in the views `player_match_points` → `player_round_scores`, with values on `seasons.ppts_*` and labels in `PLAYER_RULES` (`src/lib/scoring.ts`). A new player action means a column on `match_player_stats`, a term in `player_match_points`, a `ppts_*` setting, a `PLAYER_RULES` entry, and a field in `MatchStatsForm.tsx`. `/rules` and the admin settings form update themselves from `PLAYER_RULES`.

Naming: the 6-player squad is still called "quad" internally (`quad_picks`, `quad_multiplier`, `quad_points`).

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
| `src/app/rules/page.tsx` | Add the rule to the public rules page (values read from the season row) |
| `src/app/admin/page.tsx` + `updateSeason` in `src/app/admin/actions.ts` | Input for the new setting |
| Prediction UI | New client form + server action, or extend the round page. Lock after the deadline, and show earned points after lock |
| Admin input | If the admin must enter results, add it to the relevant admin page with the `admin-feature` skill |

## 4. Tests
In `supabase/tests/db.test.mjs`, extend the scoring scenario: create the prediction, enter the result as admin, and assert the new column and the new `total` from `get_leaderboard`. Also check the lock (editing after the deadline fails). Run `npm run test:db`.

## 5. Docs and ship
Update `docs/SCORING.md` (a new section plus defaults), `docs/SCORING-MODEL.md` (the Hebrew model the owner shares with participants, including the worked example), `docs/DATABASE.md` and `docs/CHANGELOG.md`. Show the change locally first (`local-preview`), then use the `ship` skill. Remind the owner to run the SQL, and that changing point values recalculates the whole season.
