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
| `.input`, `.label`, `.score-input` | Form fields |
| `.brand-stripes` | Diagonal turquoise and blue stripes inspired by the "X". Use on `bg-brand-dark` panels |
| `h1.page-title` | Page heading |

## Sand court (squad picker)
`src/app/rounds/[number]/SandPitch.tsx`, a client component, also used read-only after the lock with points per player.
- Court: `.sand` texture + white lines + `.net` in the middle (both in `globals.css`). Slots are placed by `slotPositions(size)`: pyramid (2 back, 1 front) in each half for 6 players.
- Empty slot: dashed circle with **+**, which opens the player picker sheet (search, team chips, flags; Brazilians are disabled when the limit is reached).
- Filled slot: dark circle with initials, a flag badge, and a name/team label. Tapping it opens a sheet with **make captain** and **remove**.
- Captain: gold gradient **C** badge (`from-yellow-200 via-amber-400 to-amber-600`).
- Flags: `<Flag code="BR|IL" />` is an inline SVG, because Windows does not render flag emoji.

## Rounds deck (`/rounds`)
`src/app/rounds/RoundDeck.tsx`, a client component. The rounds are a stack of cards in the hero style (`bg-brand-dark` + `.brand-stripes` + "בחסות" logo line), round 1 on top.
- Drag right = next round, drag left = previous (RTL). There are also arrow buttons, dots (turquoise = open, gray = locked) and the keyboard arrows. "למחזור הפתוח" jumps to the first open round.
- Horizontal dragging starts only after a clear horizontal move, so vertical page scroll still works (`touch-pan-y`). A drag never counts as a click on the card button.
- Cards behind the top one are offset down, scaled and slightly rotated. The container needs bottom margin (`mb-12`) for them, and the wrapper uses `overflow-x-clip` so a card flying off never causes horizontal scroll.

## Sponsor placements
- Header: logo + "ליגת הפוצ'יוולי" on every page (`Nav.tsx`)
- Footer: "בחסות" + logo, linking to the sponsor
- Home hero: "בחסות" + logo
- `<SponsorPrizes season={season} />` on the home page and leaderboard. It reads `prize_1..3`, with fallback text "פרס מבית XIMOBILITY"
- Login page: dark welcome card with the logo

## RTL and mobile rules
- The root is `dir="rtl"`. Use logical layout: flex order follows RTL. For "forward" arrows in Hebrew, use `←`.
- Scores, invite codes, emails and URLs: wrap in `dir="ltr"`.
- Test every screen at 375px. There must be no page-level horizontal scroll. Wide tables hide secondary columns below `sm` (`hidden sm:table-cell`).
- Match cards use one row per team (team name, then input). Do not go back to a side-by-side `home : away` layout, because names get cut off on phones.
