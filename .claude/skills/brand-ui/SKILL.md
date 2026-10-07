---
name: brand-ui
description: Build or restyle UI in the footvolley app in the XIMOBILITY sponsor "banner" style (dark brand cards with X stripes, turquoise highlights, Heebo, RTL Hebrew, mobile first). Use for any new page, component or visual change.
---

# Brand UI

Read `footvolley-league/docs/DESIGN.md` first: tokens, component classes, the banner style, navigation, the round page and the sand court.

## Rules
1. **Tokens only.** Use `bg-brand`, `bg-brand-dark`, `text-accent`, `bg-accent-soft`, `border-border`, `text-muted`, `bg-card`. No raw hex values in components. Light and dark mode come free from `globals.css`.
2. **Existing classes first:** `.card`, `.btn`, `.btn-brand`, `.btn-secondary`, `.btn-danger`, `.input`, `.label`, `.score-input`, `.score-input-dark`, `.brand-card` (always together with `.brand-stripes`), `h1.page-title`.
3. **"The style of the image" = the banner style.** When the owner sends the home-hero screenshot and asks for "the same style": `brand-card brand-stripes`, a small "בחסות" + `<SponsorLogo />` line, a big bold white title with the key word in `text-brand`, secondary text in `text-white/60–70`, a turquoise `.btn-brand` for the main action. Popups that sit inside a dark panel need an explicit `text-foreground` on their light surface.
4. **Icons:** `lucide-react` icons are used only in the big menu. Elsewhere the owner keeps emoji on purpose, so don't swap them without being asked.
5. **Existing components:** `<PlayerAvatar>` for any player (photo or initials), `<TeamBadge>` for any team (logo or letter + name), `<Flag code>` for nationality (never flag emoji), `<VsDivider>` between two teams, `<SponsorLogo>` / `<SponsorPrizes>` for the sponsor.
6. **Logo** only through `<SponsorLogo />` and only on dark backgrounds (its text is white). Sponsor links use `SPONSOR_URL` with `target="_blank" rel="noopener"`.
7. **Hebrew RTL.** Copy is Hebrew and short. Wrap scores, codes, emails and URLs in `dir="ltr"`. The "forward" arrow is `←`. In RTL, "next" comes from the left (the rounds deck: drag right = next).
8. **Mobile first at 375px.** No page-level horizontal scroll (use `overflow-x-clip` around anything that animates sideways). Long lists use one row per item. Secondary table columns use `hidden sm:table-cell`.
9. **Server Components by default.** Add `"use client"` only for interactivity, and keep client components focused (see `PredictionsForm`, `SandPitch`, `RoundDeck`, `MainMenu`).
10. **Feedback:** buttons shrink on press (built into the button classes). Links that navigate can show a pending state with `useLinkStatus` (see `NavLinks`, `MainMenu`). Animations respect `prefers-reduced-motion`.
11. **Navigation:** pages are listed once in `NAV_ITEMS` in `src/lib/nav.ts` (`href`, `label`, `icon` = a `lucide-react` component). A new page goes there, and it shows up in both the big menu and the shortcuts row.
12. **Loading skeleton.** A new page (or a page whose layout changes a lot) gets a `loading.tsx` next to its `page.tsx`, in the shape of the page, built from `components/Skeleton.tsx` (`Bone`, `BrandCardSkeleton`, `TableSkeleton`, `MatchCardSkeleton`). Keep it a Server Component without data fetching. Data queries in pages should run in parallel (`Promise.all`), because each one is a network round trip.
13. **Sponsor visibility.** Any new page related to prizes or rankings should include `<SponsorPrizes season={season} />` or at least the "בחסות" logo line.
14. **Sign-in:** every page requires sign-in automatically (`src/lib/supabase/proxy.ts`). Only `/login`, `/auth` and `/terms` are public. A new page that must be public goes into `PUBLIC_PATHS` and has to work for a visitor who is not signed in (no `requireUser`; the header shows only the login button).

## Checking the result
Follow the `local-preview` skill: check it yourself at 375px (mock data on a temporary `dev-preview` route if needed, then delete it), then open it for the owner on `localhost:3002` and wait for "מאשר". Then use the `ship` skill, which includes updating `DESIGN.md` and the changelog.
