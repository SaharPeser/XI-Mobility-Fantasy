# Changelog

What was built, newest first. **Add an entry with every change** (same commit). Each entry lists what changed for users, any SQL the owner had to run, and the main files.

## 2026-10-07 — Sign-in required + terms and privacy
- The whole site requires signing in. `src/lib/supabase/proxy.ts` redirects every path except `PUBLIC_PATHS` (`/login`, `/auth`, `/terms`) to `/login?next=<path>`, and a signed-in user opening `/login` is sent on. The header for visitors shows only the logo + "כניסה".
- New public page `/terms` (terms of use + privacy policy), linked from the footer. The initial Hebrew draft lives in `src/lib/legal.ts` (`DEFAULT_CONTENT`). It has a `[כתובת מייל ליצירת קשר]` placeholder for the owner to fill, and a legal review is recommended before prizes.
- Admin screen `/admin/content`: edit title + body of each document, preview, reset to the initial version. Simple formatting ("## " heading, "- " list) rendered by `components/RichText.tsx` (text only, no HTML).
- Sign-up requires an "I agree" checkbox, and `profiles.terms_accepted_at` records when.
- SQL: `20261007000000_site_content.sql` (`site_content` table, `profiles.terms_accepted_at`, updated `handle_new_user`).

## 2026-10-06 — Icons in the big menu
- The big menu uses professional `lucide-react` line icons (house, volleyball, list, chart, trophy, player, group, book) instead of emoji, plus icons for close, row arrow, admin, log out and log in.
- The owner tried icons across the whole site and chose to keep them **only in the big menu**; all other emoji stay as they were.
- The page list moved to `src/lib/nav.ts` (`NAV_ITEMS`). New dependency: `lucide-react`.

## 2026-10-06 — Faster navigation + loading skeletons
- Vercel functions moved from `iad1` (Washington) to `fra1` (Frankfurt), next to the Supabase DB (`vercel.json`). Measured from Israel: before ~1.0–1.4 s per page, after ~0.45–0.55 s (warm).
- `getSessionUser` uses `auth.getClaims()` (local ES256 JWT verification) instead of `auth.getUser()` (a network call per page).
- `experimental.staleTimes.dynamic = 30`: pages visited in the last 30 s reopen instantly. Server actions' `revalidatePath` clears it.
- Skeletons (`loading.tsx`) shaped like each page: root (generic), `/rounds`, `/rounds/[number]`, `/leaderboard`, `/standings`, `/players`. Shimmer classes `.skeleton` / `.skeleton-dark`, building blocks in `components/Skeleton.tsx`.

## 2026-10-06 — Squad picker search box
- Opening the player picker (tapping **+** on the sand court) no longer focuses the search box, so the phone keyboard doesn't pop up.
- The search box always has the light-blue focus frame (new class `.input-highlight`), a 🔍 hint, and `type="search"` / `enterKeyHint="search"`.
- Files: `app/rounds/[number]/SandPitch.tsx`, `globals.css`.

## 2026-10-02 — Docs and skills refresh
- All docs updated to the current state. Added this changelog, the "migrations applied" table in `DEPLOYMENT.md`, and the `local-preview` skill.
- New standing rule (owner request): every change updates the docs and skills, so nothing is lost when a conversation ends.

## 2026-10-01 — Main menu (plus the shortcuts row)
- Header menu button showing the current page. It opens a full-screen menu in the banner style (big bold items with icons, current page in turquoise, ⚙️ ניהול / יציאה / כניסה at the bottom).
- The owner asked to keep the old scrolling shortcuts row too, so both exist.
- Files: `components/MainMenu.tsx`, `components/Nav.tsx`.

## 2026-10-01 — Team logos
- Upload + circular crop for team logos in admin. Logos can shrink to fit entirely, on a white background. The manual "logo URL" field was removed.
- Shared crop dialog for players and teams (`admin/ImageEditor.tsx`), generic `uploadImage(kind)` in `admin/actions.ts`. Deleting a team removes its logo and its players' photos.
- SQL: `20261001000000_team_logos.sql` (bucket `team-logos`).

## 2026-09-30 — Player photos
- Upload + circular crop (drag, zoom) per player in admin. Shown on the sand court, in the player picker, on `/players`. Initials when there is no photo.
- SQL: `20260930000000_player_photos.sql` (`players.photo_url`, bucket `player-photos`).
- Files: `components/PlayerAvatar.tsx`, `admin/ImageEditor.tsx`.

## 2026-09-30 — Banner-style match cards and squad panel
- Every match is a dark `brand-card` with stripes, logo and a turquoise VS line. Dark score inputs, winner highlight and points badge after the lock.
- The squad section is a dark panel with a title, a rules line and "בחסות".

## 2026-09-29 — Rounds as a swipeable card deck
- `/rounds` is a deck of round cards (banner style, round 1 on top). Swipe right = next, left = previous, plus arrows, dots and keyboard. A "החליקו" banner with an animated hand, fanned cards behind, and a one-time wiggle hint.
- Files: `app/rounds/RoundDeck.tsx`.

## 2026-09-29 — Clickable navigation feedback
- The active page is highlighted in the menu, the clicked link pulses while loading, and buttons shrink when pressed.
- Files: `components/NavLinks.tsx`, `globals.css`.

## 2026-09-28 — Six-player squad on a sand court + nationality
- The 4-player quad became a 6-player squad with a captain, picked on an interactive sand court. At most 3 Brazilians. Size and limit are set in admin.
- Player nationality (IL/BR) with SVG flags.
- SQL: `20260928000000_squad_nationality.sql` (`players.nationality`, `seasons.squad_size`, `max_brazilians`, RPC `save_squad`).
- Files: `app/rounds/[number]/SandPitch.tsx`, `components/Flag.tsx`.

## 2026-09-27 — Personal player scoring
- Per-match player stats form in admin (played, blocks, great defense, 8+/14+, MVP, cards, errors). Win, crushing win and overtime are automatic. Round MVP, manual adjustments, and all values editable per season.
- Public `/players` page and `/rules` page. `docs/SCORING-MODEL.md` written for participants.
- SQL: `20260927000000_player_scoring.sql`.

## 2026-09-27 — Docs and skills
- `docs/` folder, root `CLAUDE.md`, and project skills (db-migration, add-scoring-rule, admin-feature, brand-ui, ship).

## 2026-09-25 — XIMOBILITY sponsorship branding
- Sponsor logo, colors (turquoise / steel blue / dark), Heebo font, XI app icon, sponsor footer, prizes card (`prize_1..3` in admin).
- SQL: `20260925000000_sponsor_prizes.sql`.

## 2026-09-24 — Launch
- Predictions game: match predictions, table prediction, 4-player quad, friends leagues, leaderboard, admin area. Deployed to Vercel (`ximobilityfantasy.vercel.app`) with Supabase.
- SQL: `20260924000000_init.sql`.
