# Scoring

All point values live on the `seasons` row, so the admin can change them in **ניהול → עונה וניקוד**. The leaderboard is recomputed on every read, so a change applies retroactively to the whole season.

## Where points are computed
| Place | Role |
|---|---|
| `get_leaderboard()` in SQL | **Source of truth** for totals and ranks (general and league leaderboards, home page) |
| `predictionPoints()` in `src/lib/scoring.ts` | Per-match points shown on the round page. Must match the SQL |
| Round page (`src/app/rounds/[number]/page.tsx`) | Per-player quad points shown after lock (reads `player_round_scores`) |
| `player_match_points` / `player_round_scores` views | Personal player scoring (section 3a) |

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
The user picks 4 active players and one captain before the round deadline.

```
quad points = Σ round_score × quad_multiplier (default 2)
            + captain_round_score × captain_multiplier (default 4)   ← instead of ×2
if round_score < 0 and quad_multiply_negative = false → multiplier is 1
```
Players with no score in the round count as 0.

## 3a. Player personal scoring (feeds the quad)
The admin fills a per-match form (`match_player_stats`, one row = the player played). Values live on `seasons.ppts_*`. Penalties are stored as **positive** numbers and subtracted.

| Item | Column | Default | Source |
|---|---|---|---|
| Played | `ppts_played` | +1 | row exists |
| Win | `ppts_win` | +3 | auto: the player's team won |
| Crushing win | `ppts_crushing_win` | +2 | auto: win with margin ≥ `crushing_margin` (7), on top of the win |
| Overtime | `ppts_overtime` | +1 | auto: `greatest(score) >= 22`, everyone who played |
| Block | `ppts_block` | +1 each | `blocks` |
| Great defense | `ppts_great_defense` | +2 each | `great_defense` |
| 8+ personal points | `ppts_scored_8` | +2 | `scored_tier = 1` |
| 14+ personal points | `ppts_scored_14` | +4 | `scored_tier = 2` (replaces 8+, not cumulative) |
| Match MVP | `ppts_match_mvp` | +4 | `is_mvp` (one per match) |
| Round MVP | `ppts_round_mvp` | +5 | `rounds.mvp_player_id`, on top of match MVP |
| Yellow card | `ppts_yellow` | −2 | `yellow_card` (cumulative with red) |
| Red card | `ppts_red` | −5 | `red_card` |
| Unforced error | `ppts_unforced_error` | −1 each | `unforced_errors` |

Computed in SQL views:
- `player_match_points`: one row per (match, player).
- `player_round_scores`: per (player, round) = Σ match points + round MVP bonus + manual adjustment (`player_round_points`, optional, may be negative).

The labels and fallback defaults for the UI (admin form, `/rules`) come from `PLAYER_RULES` in `src/lib/scoring.ts`. Keep them in sync with the migration defaults. `quadMultiplier()` mirrors the SQL multiplier rule.

The user-facing summary in Hebrew is `docs/SCORING-MODEL.md`. Update it when defaults or rules change.

## 4. Live standings (not scoring)
`computeStandings()` sorts by wins, then point difference, then points scored, then name. It counts only `stage = 'regular'` rounds. The official order used for scoring is always `teams.final_position` from the admin.

## Adding a new rule
Use the `add-scoring-rule` skill. It lists every file to touch (migration, `get_leaderboard`, types, leaderboard table, home page rules list, admin settings, tests).
