---
name: local-preview
description: Show a change to the footvolley app's owner on the local dev server (desktop and phone) before anything is committed, and check it yourself first with mock data when needed. Use for every visible change; the owner approves before the `ship` skill runs.
---

# Local preview for the owner

The owner reviews every visible change before it is committed ("תן לי לראות את השינויים לפני שאתה עושה קומיט"). Nothing goes to GitHub until they say "מאשר".

## 1. Make sure the dev server runs from the right folder
```bash
curl -s -o /dev/null -m 30 -w "%{http_code}\n" http://localhost:3002/
```
If it is not 200, start it **with Bash in the background** (not the preview pane, which once started a server from an old scratch folder without `.env.local`):
```bash
cd /c/Users/sahar/Desktop/footvolley-league/footvolley-league && npx next dev -p 3002
```
Port 3000 is taken by another app on this machine. The local server uses the **production** Supabase database, so anything the owner does locally is real.

## 2. If the change needs a migration
Keep it **additive** (new columns, tables, functions or buckets; never change what the live code relies on), so the live site keeps working. Hand the SQL to the owner with the `db-migration` skill **before** asking them to preview.

## 3. Check it yourself first
- Open the page in the Claude browser pane at the **mobile** preset (375×812) and look at it. The pane is not signed in as the owner.
- For screens that need a signed-in user or data you can't create safely, add a temporary route `src/app/dev-preview/page.tsx` that renders the component with mock props (use `/icon.png` as a fake photo).
- To test file inputs, build a `File` from a canvas in `javascript_tool` and dispatch `change` on the `<input type="file">` (see the crop-dialog tests in the conversation history).
- The pane's screenshots are often cropped or tiled. Confirm layout with `javascript_tool` (bounding rects, `scrollWidth === clientWidth`, computed colors) instead of trusting the image.
- **Delete `dev-preview` afterwards**, then `rm -rf .next/types .next/dev/types && npx next typegen` before `tsc`.
- Run `npx tsc --noEmit`, `npx eslint src`, and `npm run test:db` if SQL changed.

## 4. Open it for the owner
```powershell
Start-Process "http://localhost:3002/<page>"
```
They are signed in there as admin. In the Hebrew message, tell them:
- What changed, in plain words, grouped by screen.
- Which URL(s) to open: desktop `http://localhost:3002/...`, phone on the same Wi-Fi `http://10.20.0.16:3002/...` (re-check the Wi-Fi IP with `Get-NetIPAddress`; ignore VMware/169.254 adapters), or Chrome device mode (F12 → Ctrl+Shift+M).
- That nothing was committed, and that they can ask for changes or say "מאשר".
- Offer one or two concrete tweak options when a design choice was yours (direction, colors, texts).

## 5. After "מאשר"
Use the `ship` skill. It includes updating the docs and the changelog.
