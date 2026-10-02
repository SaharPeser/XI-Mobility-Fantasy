# Roadmap

Ideas the owner mentioned or that follow from the league format. Each item notes what already exists.

## Post-season stages
The league format after the 11 regular rounds:
- Places 1–2 qualify directly to the **Final Four**.
- Places 3–6 play for two more spots: **3 vs 6** and **4 vs 5**.
- Places 9–10 play **promotion/relegation crossovers** against league 2 teams.
- Places 11–12 are **relegated**.

Already in place: `rounds.stage` supports `playoff`, `final_four` and `relegation`, and live standings count only `regular` rounds.

Still needed:
- [ ] Decide the playoff match format (sets, target score). If it differs, add a stage-aware validity function. Do not change `is_valid_set_score`.
- [ ] Crossover matches include league 2 teams that are not in `teams`. Options: a `teams.is_external` flag, or free-text opponent names.
- [ ] Separate point values per stage (for example, a Final Four exact score is worth more).
- [ ] "Who wins the Final Four" and "who is relegated" predictions before the playoffs (new tables + RPC, see the `db-migration` skill).

## More scoring ("בעתיד נוסיף עוד דברים לניקוד")
- [x] Personal player scoring per match (2026-09-27), with a round MVP chosen by the admin.
- [ ] Bonus for a perfect round (all winners correct).
- [ ] Users predict the round MVP.
- [ ] Use the `add-scoring-rule` skill for each one.

## Players and teams
- [x] Nationality (IL/BR) and a Brazilian limit in the squad (2026-09-28).
- [x] Player photos and team logos, uploaded and cropped to a circle (2026-09-30, 2026-10-01).
- [ ] Show photos in the admin match-stats form and on the leaderboard.
- [ ] Team page: roster with photos and season stats.

## Engagement
- [ ] Reminder before a round locks (email via Supabase, or WhatsApp share text).
- [ ] After the deadline, show friends' predictions per match on the round page (RLS already allows reading them).
- [ ] Per-round leaderboard ("מלך המחזור").
- [ ] Profile page: edit display name (the column is already granted).
- [ ] "Forgot password" flow: `resetPasswordForEmail`, then a page that calls `updateUser({ password })`. `/auth/confirm` already verifies `type=recovery` links.

## Sponsor
- [ ] Sponsor banner or coupon code for participants, managed from admin.
- [ ] UTM tags on sponsor links to measure traffic sent to XIMOBILITY.

## Admin quality of life
- [ ] Bulk import of matches for a round (paste text).
- [ ] Choose which season to manage when there are several (today admin pages use the active season).
- [ ] Users screen in admin (list, delete). Today users are deleted in Supabase → Authentication → Users, and that also deletes friends leagues they own.

Everything that is already built is listed by date in `docs/CHANGELOG.md`.
