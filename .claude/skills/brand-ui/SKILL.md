---
name: brand-ui
description: Build or restyle UI in the footvolley app in the XIMOBILITY sponsor style (dark header, turquoise brand, Heebo, RTL Hebrew, mobile first). Use for any new page, component or visual change.
---

# Brand UI

Read `footvolley-league/docs/DESIGN.md` for tokens and assets.

## Rules
1. **Tokens only.** Use `bg-brand`, `bg-brand-dark`, `text-accent`, `bg-accent-soft`, `border-border`, `text-muted`, `bg-card`. No raw hex values in components. Light and dark mode come free from `globals.css`.
2. **Existing classes first:** `.card`, `.btn`, `.btn-brand`, `.btn-secondary`, `.btn-danger`, `.input`, `.label`, `.score-input`, `.brand-stripes`, `h1.page-title`.
3. **Logo** only through `<SponsorLogo />` and only on dark backgrounds (its text is white). Sponsor links use `SPONSOR_URL` with `target="_blank" rel="noopener"`.
4. **Hebrew RTL.** Copy is Hebrew and short. Wrap scores, codes, emails and URLs in `dir="ltr"`. The "forward" arrow is `←`.
5. **Mobile first at 375px.** No page-level horizontal scroll. Long lists of teams use one row per item. Secondary table columns use `hidden sm:table-cell`.
6. **Server Components by default.** Add `"use client"` only for interactivity, and keep client components small (see `QuadPicker`, `PredictionsForm`).
7. **Sponsor visibility.** Any new page related to prizes or rankings should include `<SponsorPrizes season={season} />` or at least the "בחסות" logo line.

## Checking the result
1. Run the dev server from `footvolley-league/`: `npx next dev -p 3002` (in the background).
2. Open the page in the browser pane at the **mobile** preset (375×812), take a screenshot, and check alignment, cut-off names and contrast.
3. Check that `document.documentElement.scrollWidth === clientWidth` (no horizontal overflow).
4. Reset the viewport to desktop and check the wide layout once.
5. For pages that need data you can't create safely, render the component with mock props on a temporary route (e.g. `src/app/dev-preview/page.tsx`). **Delete it afterwards** and clear `.next` before `tsc` (stale route types reference it).
6. `npx tsc --noEmit && npx eslint src`, then use the `ship` skill.
