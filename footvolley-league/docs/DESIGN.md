# Design and branding

The app promotes the sponsor **XIMOBILITY** (https://xi-mobility.co.il), which gives the prizes for the top 3. The look follows their site: a dark header, turquoise accents, the Heebo font.

## Brand assets
| Asset | File | Notes |
|---|---|---|
| Logo | `public/xi-logo.png` (600×98) | Turquoise "XI" + **white** "MOBILITY". Use only on dark backgrounds (`bg-brand-dark`). Render through `<SponsorLogo className="h-6" />` |
| App icon | `src/app/icon.png` (512), `src/app/apple-icon.png` (180) | The "XI" mark on `#1C1A1B` |
| Sponsor link | `SPONSOR_URL` in `src/components/Sponsor.tsx` | Always open in a new tab with `rel="noopener"` |

## Color tokens (`src/app/globals.css`)
| Token | Light | Dark | Use |
|---|---|---|---|
| `brand` | `#48C8E8` | same | Turquoise from the logo: highlights, brand buttons, admin badge, captain chip |
| `brand-dark` | `#1C1A1B` | `#0C0B0B` | Header, footer, hero, sponsor cards |
| `accent` | `#177FAB` | `#48C8E8` | Main buttons, links, focus rings (steel blue from their site) |
| `accent-contrast` | white | `#0B1A20` | Text on `accent` |
| `accent-soft` | `#E4F5FB` | `#11303A` | Hover and selected backgrounds |
| `background` / `card` / `border` / `muted` / `foreground` | light greys | dark greys | Page surfaces and text |

Use these as Tailwind classes (`bg-brand`, `text-accent`, `border-border`, ...). Do not hard-code hex values in components. Zone colors (emerald / sky / amber / rose) are the only exception.

## Component classes
| Class | Look |
|---|---|
| `.card` | White rounded panel with border |
| `.btn` | Main action (steel blue) |
| `.btn-brand` | Turquoise button with dark text, for sponsor and hero actions |
| `.btn-secondary` | Outlined |
| `.btn-danger` | Red text, for deletes (wrap in `ConfirmButton`) |
| `.input`, `.label`, `.score-input` | Form fields (light) |
| `.score-input-dark` | Score input on a dark card (white text, turquoise focus) |
| `.input-highlight` | Add to `.input` to keep the focus look (accent border + light-blue ring) at all times, e.g. the squad picker search. A plain utility like `border-accent` can't override `.input`, because component classes are unlayered CSS |
| `.brand-card` | Dark rounded card in the banner style. Always combine with `.brand-stripes` (`className="brand-card brand-stripes"`), because `@apply` cannot include a custom class |
| `.brand-stripes` | Diagonal turquoise and blue stripes inspired by the "X". Use on `bg-brand-dark` panels |
| `.sand`, `.net` | Sand court texture and net |
| `.swipe-hand`, `.deck-hint` | Animations for the rounds deck (off under `prefers-reduced-motion`) |
| `h1.page-title` | Page heading |

All buttons (`.btn`, `.btn-brand`, `.btn-secondary`) shrink slightly when pressed (`active:scale-[0.97]`).

## The banner style
The owner's reference design is the home hero: `bg-brand-dark` + `.brand-stripes`, a small "בחסות" + `<SponsorLogo />` line, a big bold white title with the key words in `text-brand`, and secondary text in `text-white/60–70`. When the owner asks for "the style of the image", this is it. It is used on: the home hero, sponsor prizes, round cards, match cards, the squad panel and the main menu.

## Navigation
- **Header** (`Nav.tsx`, sticky, `bg-brand-dark`): sponsor logo + "ליגת הפוצ'יוולי" (links home), and the **menu button**, which shows the current page name.
- **Main menu** (`MainMenu.tsx`): opens over most of the screen in the banner style. Big bold items (`text-2xl font-extrabold`) with emoji icons, the current page on solid `bg-brand`, a pulsing arrow while the next page loads (`useLinkStatus`), staggered slide-in animation. Footer: ⚙️ ניהול (admins) + יציאה, or כניסה / הרשמה. It closes on ✕, outside click, Esc, or route change, and locks page scroll while open. This is the only way to reach `/admin` from the header.
- **Shortcuts row** (`NavLinks.tsx`, under the header): horizontally scrolling links. The active page is turquoise, a clicked link pulses while loading, and the row auto-scrolls to the active link. The owner asked to keep **both** the menu and this row. The admin sub-nav uses the same component (`variant="light"`).
- The link list lives once, in `LINKS` in `Nav.tsx` (`href`, `label`, `icon`). "ראשי" appears only in the big menu.

## Round page (`/rounds/[number]`)
- **Match cards** (`PredictionsForm` and the locked view in `page.tsx`): `brand-card brand-stripes`. Date + small sponsor logo on top, one row per team (`TeamBadge` in white + `.score-input-dark`), and a turquoise `<VsDivider />` between the teams. After the lock: the winner in bold with a turquoise score, the user's prediction in a gray box, and points in a badge (solid turquoise for an exact score). The save button is `.btn-brand`.
- **Squad section:** one dark `brand-card brand-stripes` panel with the title "שישיית **מחזור N**", a rules line, and "בחסות". The `SandPitch` sits inside it, so its texts and status pills use dark-background colors. Its sheets (picker, player actions) stay light, with an explicit `text-foreground`.

## Sand court (squad picker)
`src/app/rounds/[number]/SandPitch.tsx`, a client component, also used read-only after the lock with points per player.
- Court: `.sand` texture + white lines + `.net` in the middle (both in `globals.css`), turquoise frame. Slots are placed by `slotPositions(size)`: pyramid (2 back, 1 front) in each half for 6 players.
- Empty slot: dashed circle with **+**, which opens the player picker sheet (search, team chips, photo + flag per player; Brazilians are disabled when the limit is reached).
- Filled slot: the player's `PlayerAvatar` (photo or initials), a flag badge, and a name/team label. Tapping it opens a sheet with **make captain** and **remove**.
- Captain: gold gradient **C** badge (`from-yellow-200 via-amber-400 to-amber-600`).
- Flags: `<Flag code="BR|IL" />` is an inline SVG, because Windows does not render flag emoji.

## Player photos
- Always render a player through `<PlayerAvatar player={p} className="h-10 w-10 text-sm" />` (`src/components/PlayerAvatar.tsx`). It shows the photo in a circle, or the initials on `bg-brand-dark` when there is no photo.
- Used on the sand court slots, in the player picker, on `/players`, and in admin.
- Upload and crop: `src/app/admin/ImageEditor.tsx` (`PlayerPhotoEditor`, `TeamLogoEditor`), one shared crop dialog. The admin drags and zooms inside a circular mask, the browser crops to a 400×400 WebP, and `uploadPlayerPhoto` / `uploadTeamLogo` save it to Storage (generic `uploadImage(kind)` in `admin/actions.ts`).
- Players always fill the circle. Team logos can shrink until the whole logo (its diagonal) fits the circle, on a white background.
- Team logos render through `TeamBadge` (standings, match cards, players table). Teams are no longer given a logo URL by hand.

## Rounds deck (`/rounds`)
`src/app/rounds/RoundDeck.tsx`, a client component. The rounds are a stack of cards in the hero style (`bg-brand-dark` + `.brand-stripes` + "בחסות" logo line), round 1 on top.
- Drag right = next round, drag left = previous (RTL). There are also arrow buttons, dots (turquoise = open, gray = locked) and the keyboard arrows. "למחזור הפתוח" jumps to the first open round.
- Horizontal dragging starts only after a clear horizontal move, so vertical page scroll still works (`touch-pan-y`). A drag never counts as a click on the card button.
- A "החליקו ימינה או שמאלה" banner with an animated hand sits above the deck. On first load the top card wiggles once (`.deck-hint`) until the user swipes or clicks.
- Cards behind the top one fan out alternately to the sides and down (`translate`, `scale`, `rotate`), get lighter with depth (`brightness`), a turquoise ring, and show their round name at the bottom edge. The container needs bottom margin (`mb-24`) for them, and the wrapper uses `overflow-x-clip` so a card flying off never causes horizontal scroll.
- Each card shows status (open / locked / finished), the deadline, and for signed-in users two progress bars (predictions x/y, squad x/6). The button goes to `/rounds/N`.

## Sponsor placements
- Header: logo + "ליגת הפוצ'יוולי" on every page (`Nav.tsx`), and "בחסות" + logo at the top of the main menu
- Round cards, match cards and the squad panel: "בחסות" + logo
- Footer: "בחסות" + logo, linking to the sponsor
- Home hero: "בחסות" + logo
- `<SponsorPrizes season={season} />` on the home page and leaderboard. It reads `prize_1..3`, with fallback text "פרס מבית XIMOBILITY"
- Login page: dark welcome card with the logo

## RTL and mobile rules
- The root is `dir="rtl"`. Use logical layout: flex order follows RTL. For "forward" arrows in Hebrew, use `←`.
- Scores, invite codes, emails and URLs: wrap in `dir="ltr"`.
- Test every screen at 375px. There must be no page-level horizontal scroll. Wide tables hide secondary columns below `sm` (`hidden sm:table-cell`).
- Match cards use one row per team (team name, then input). Do not go back to a side-by-side `home : away` layout, because names get cut off on phones.
- Emoji are fine for icons (menu, banner), but **not** for flags: Windows shows flag emoji as letters, so use `<Flag />`.
- Popups (menu, sheets, crop dialog) are `fixed inset-0` overlays with `role="dialog"`. They close on Esc and on a backdrop click, and lock body scroll while open.
- **No `autoFocus` on text inputs inside popups** (owner request): on phones it opens the keyboard immediately and hides the list. Let the user tap the field.
