# Scoring

All point values live on the `seasons` row, so the admin can change them in **ניהול → עונה וניקוד**. The leaderboard is recomputed on every read, so a change applies retroactively to the whole season.

## Where points are computed
| Place | Role |
|---|---|
| `get_leaderboard()` in SQL | **Source of truth** for totals and ranks (general and league leaderboards, home page) |
| `predictionPoints()` in `src/lib/scoring.ts` | Per-match points shown on the round page. Must match the SQL |
| Round page (`src/app/rounds/[number]/page.tsx`) | Per-player quad points shown after lock |

If you change a formula, change it in **both** places and add a test case in `supabase/tests/db.test.mjs`.

## 1. Match predictions (regular season)
Valid set score (`is_valid_set_score`): one set, and one of these:
- Winner has 21 and the loser has at most 19 (e.g. 21:15)
- Winner has 22, 23 or 24 and wins by exactly 2 (e.g. 23:21)
- Winner has 25 and the loser has 23 or 24 (golden point at 24:24)

| Result | Points (default) |
|---|---|
| Exact score | `pts_exact` = 5 (total, not added to the winner points) |
| Correct winner | `pts_winner` = 2 |
| Wrong or missing | 0 |

Only matches with a result count (`home_score is not null`).

## 2. Table prediction
Before `table_deadline`, the user orders all teams (12). After the regular season, the admin sets `teams.final_position`. Each team whose predicted position equals its final position earns `pts_table_position` (default 3), for a maximum of 36.

Table zones (display only, `zoneForPosition`): 1–2 Final Four · 3–6 playoff (3 vs 6, 4 vs 5) · 9–10 promotion/relegation playoff against league 2 · 11–12 relegation.

## 3. Round quad (רביעיית המחזור)
The user picks 4 active players and one captain before the round deadline. The admin enters `player_round_points` for each player after the round.

```
quad points = Σ player_points × quad_multiplier (default 2)
            + captain_points × captain_multiplier (default 4)   ← instead of ×2
```
Players without entered points count as 0.

## 4. Live standings (not scoring)
`computeStandings()` sorts by wins, then point difference, then points scored, then name. It counts only `stage = 'regular'` rounds. The official order used for scoring is always `teams.final_position` from the admin.

## Adding a new rule
Use the `add-scoring-rule` skill. It lists every file to touch (migration, `get_leaderboard`, types, leaderboard table, home page rules list, admin settings, tests).
