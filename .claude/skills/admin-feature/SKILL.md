---
name: admin-feature
description: Add or change a screen or action in the footvolley admin area (/admin), following the existing server-action + return_to + notice pattern. Use for anything the league manager needs to create, edit or enter (teams, rounds, results, prizes, new data types).
---

# Admin feature

The admin area is `footvolley-league/src/app/admin/`. `layout.tsx` calls `requireAdmin()` for the whole tree and renders the sub-nav (`LINKS`) and `<AdminNotice />`. RLS independently blocks non-admins from writing.

## Pattern (copy it exactly)

**Server action** in `src/app/admin/actions.ts`:
```ts
export async function saveThing(fd: FormData) {
  const supabase = await admin();            // requireAdmin + client
  const name = str(fd, "name");              // helpers: str(), num()
  if (!name) return done(fd, "יש להזין שם"); // Hebrew validation message
  const { error } = await supabase.from("things").insert({ name });
  done(fd, error);                           // revalidates, redirects to return_to with ?ok=1 or ?error=
}
```
- Dates from `<input type="datetime-local">` go through `fromLocalInput()`. Prefill with `toLocalInput()`. Both use Israel time.
- Map known DB errors to Hebrew (e.g. `error?.code === "23505"` means a duplicate).
- Scores must pass `isValidSetScore` (see `scoreFields`).

**Page** (Server Component):
```tsx
const R = <input type="hidden" name="return_to" value="/admin/things" />;
<form action={saveThing} className="card space-y-3">
  {R}
  <label><span className="label">שם</span><input className="input" name="name" required /></label>
  <button className="btn">שמירה</button>
  <ConfirmButton formAction={deleteThing} className="btn-danger" message="למחוק? ...">מחיקה</ConfirmButton>
</form>
```
- One `<form>` per row for editable lists (see `admin/rounds/page.tsx`).
- Bulk grids post many fields with a prefix, e.g. `p_<playerId>` (see `savePlayerPoints`).
- Every delete uses `ConfirmButton` and says what cascades.
- Work on the active season via `getActiveSeason()`. Render `<NoSeason />` when there is none.
- Page files may only have a default export plus Next's allowed exports.

## New admin page
1. `src/app/admin/<name>/page.tsx`
2. Add it to `LINKS` in `src/app/admin/layout.tsx`
3. Test at 375px width. Admin tables must not overflow the page.

## Verify
- Run the flow in the browser as the admin (local dev on port 3002 uses the production DB; clean up test rows).
- Check the notice banner shows "נשמר ✓" and that invalid input shows a Hebrew error.
- Update `docs/ADMIN-GUIDE.md` (Hebrew, for the owner) with the new steps, then use the `ship` skill.
