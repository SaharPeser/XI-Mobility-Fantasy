import { createClient } from "@/lib/supabase/server";
import { toLocalInput } from "@/lib/format";
import type { Season } from "@/lib/types";
import { activateSeason, createSeason, updateSeason } from "./actions";

const R = <input type="hidden" name="return_to" value="/admin" />;

export default async function AdminSeasonPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("seasons").select("*").order("created_at", { ascending: false });
  const seasons = (data ?? []) as Season[];

  return (
    <div className="space-y-6">
      <h1 className="page-title mb-0">עונה והגדרות ניקוד</h1>

      {seasons.map((s) => (
        <form key={s.id} action={updateSeason} className={`card space-y-3 ${s.is_active ? "border-accent" : ""}`}>
          {R}
          <input type="hidden" name="id" value={s.id} />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{s.name}</h2>
            {s.is_active ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">עונה פעילה</span>
            ) : (
              <button formAction={activateSeason} className="btn-secondary py-1 text-sm">
                הפוך לפעילה
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="label">שם העונה</span>
              <input className="input" name="name" defaultValue={s.name} required />
            </label>
            <label>
              <span className="label">נעילת ניחוש הטבלה (שעון ישראל)</span>
              <input className="input" type="datetime-local" name="table_deadline" defaultValue={toLocalInput(s.table_deadline)} />
            </label>
          </div>
          <h3 className="pt-2 font-bold">ניקוד</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <label>
              <span className="label">ניחוש מנצחת</span>
              <input className="input" type="number" name="pts_winner" defaultValue={s.pts_winner} min={0} />
            </label>
            <label>
              <span className="label">תוצאה מדויקת</span>
              <input className="input" type="number" name="pts_exact" defaultValue={s.pts_exact} min={0} />
            </label>
            <label>
              <span className="label">מיקום נכון בטבלה</span>
              <input className="input" type="number" name="pts_table_position" defaultValue={s.pts_table_position} min={0} />
            </label>
            <label>
              <span className="label">מכפיל רביעייה</span>
              <input className="input" type="number" step="0.5" name="quad_multiplier" defaultValue={s.quad_multiplier} min={0} />
            </label>
            <label>
              <span className="label">מכפיל קפטן</span>
              <input className="input" type="number" step="0.5" name="captain_multiplier" defaultValue={s.captain_multiplier} min={0} />
            </label>
          </div>
          <h3 className="pt-2 font-bold">פרסי XIMOBILITY</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {([1, 2, 3] as const).map((n) => (
              <label key={n}>
                <span className="label">{["🥇 מקום ראשון", "🥈 מקום שני", "🥉 מקום שלישי"][n - 1]}</span>
                <input
                  className="input"
                  name={`prize_${n}`}
                  defaultValue={s[`prize_${n}`] ?? ""}
                  placeholder="למשל: קורקינט חשמלי"
                />
              </label>
            ))}
          </div>
          <p className="text-xs text-muted">
            &quot;תוצאה מדויקת&quot; הוא הניקוד הכולל למשחק כשהתוצאה מדויקת (לא מתווסף לניקוד המנצחת). שינוי ניקוד
            מחשב מחדש את כל הדירוג.
          </p>
          <button className="btn">שמירה</button>
        </form>
      ))}

      <form action={createSeason} className="card flex flex-wrap items-end gap-3">
        {R}
        <label className="flex-1">
          <span className="label">עונה חדשה</span>
          <input className="input" name="name" placeholder="למשל: עונת 2026/27" required />
        </label>
        <button className="btn-secondary">יצירת עונה</button>
      </form>
    </div>
  );
}
