# Database

All schema lives in `supabase/migrations/`, applied in file-name order. **Never edit a migration that has already been run in production.** Add a new file instead (see the `db-migration` skill).

| Migration | What it does |
|---|---|
| `20260924000000_init.sql` | Full schema, RLS, RPC functions |
| `20260925000000_sponsor_prizes.sql` | `seasons.prize_1..3` (XIMOBILITY prize text) |

## Tables
| Table | Purpose | Key columns |
|---|---|---|
| `profiles` | One row per auth user | `display_name`, `is_admin` |
| `seasons` | A season and its scoring settings | `is_active` (max one), `table_deadline`, `pts_winner`, `pts_exact`, `pts_table_position`, `quad_multiplier`, `captain_multiplier`, `prize_1..3` |
| `teams` | Teams in a season | `name` (unique per season), `logo_url`, `final_position` (set by admin at season end) |
| `players` | Players in a team | `is_active` (inactive players cannot be picked) |
| `rounds` | A round with its lock time | `number` (unique per season), `stage` (`regular` / `playoff` / `final_four` / `relegation`), `deadline` |
| `matches` | A match in a round | `home_team_id`, `away_team_id`, `starts_at`, `sort_order`, `home_score`, `away_score` (null until played) |
| `player_round_points` | Fantasy points per player per round, entered by admin | PK (`player_id`, `round_id`), `points` numeric |
| `match_predictions` | A user's score prediction | PK (`user_id`, `match_id`), `home_score`, `away_score` |
| `table_predictions` | A user's predicted final table | PK (`user_id`, `season_id`, `team_id`), unique `position` |
| `quad_picks` | A user's 4 players for a round | PK (`user_id`, `round_id`, `player_id`), `is_captain` (max one per round) |
| `leagues` | Private friends league | `name`, `invite_code` (6 chars, unique), `owner_id` |
| `league_members` | League membership | PK (`league_id`, `user_id`) |

Cascades: deleting a season, team, round or match deletes everything under it, **including predictions**.

## Functions
| Function | Type | Purpose |
|---|---|---|
| `handle_new_user()` | trigger on `auth.users` | Creates the profile |
| `is_admin()` | security definer | Used by admin RLS policies |
| `is_valid_set_score(a, b)` | immutable | Single set to 21, win by 2, cap 25. Used in CHECK constraints. Mirrors `isValidSetScore` in `src/lib/scoring.ts` |
| `round_is_open_for_match(match_id)` | security definer | `now() < round.deadline` |
| `is_league_member(league_id)` | security definer | Avoids recursive RLS on `league_members` |
| `add_league_owner()` | trigger on `leagues` | Adds the owner as a member |
| `join_league(code)` | RPC | Joins by invite code (case-insensitive) |
| `save_table_prediction(season_id, team_ids[])` | RPC | Atomic replace. All teams exactly once, before `table_deadline` |
| `save_quad(round_id, player_ids[], captain_id)` | RPC | Atomic replace. Exactly 4 active players of the season, captain among them, before the deadline |
| `get_leaderboard(season_id, league_id?)` | RPC, security definer | All scoring. Returns `match_points`, `table_points`, `quad_points`, `total`, `rank`. With `league_id`, returns only members, and nothing if the caller is not a member |

## Row Level Security
| Table | Read | Write |
|---|---|---|
| `profiles` | everyone | own `display_name` only (column grant) |
| `seasons`, `teams`, `players`, `rounds`, `matches`, `player_round_points` | everyone (including anonymous) | admin only |
| `match_predictions` | own; others' after the round deadline | own, only while the round is open |
| `table_predictions` | own; others' after `table_deadline` | only through `save_table_prediction` |
| `quad_picks` | own; others' after the round deadline | only through `save_quad` |
| `leagues` | owner and members | create as owner; owner updates or deletes |
| `league_members` | members of that league | join through `join_league`; leave yourself, or owner removes |

## Rules for changes
- New table: `enable row level security` and explicit policies in the same migration. A table without policies is closed. A table with RLS disabled is open to anyone holding the public key.
- Write paths that need validation across rows (counts, deadlines, "exactly N") belong in a `security definer` RPC with `set search_path = public`, plus a `grant execute ... to authenticated`.
- Keep `is_valid_set_score` and `isValidSetScore` identical. Playoff formats that differ need a new function, not a change to this one.
- Add a check to `supabase/tests/db.test.mjs` for every new rule, and run `npm run test:db`.

## Useful admin SQL
```sql
-- Make a user an admin
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'someone@example.com');

-- Leaderboard for the active season
select * from get_leaderboard((select id from seasons where is_active));
```
