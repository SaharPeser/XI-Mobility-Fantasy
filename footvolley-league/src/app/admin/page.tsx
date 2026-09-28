import { createClient } from "@/lib/supabase/server";
import { toLocalInput } from "@/lib/format";
import { DEFAULT_CRUSHING_MARGIN, PLAYER_RULES, playerRuleValue } from "@/lib/scoring";
import type { Season } from "@/lib/types";
import { activateSeason, createSeason, updateSeason, updatePlayerScoring } from "./actions";

const R = <input type="hidden" name="return_to" value="/admin" />;

export default async function AdminSeasonPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("seasons").select("*").order("created_at", { ascending: false });
  const seasons = (data ?? []) as Season[];

  return (
    <div className="space-y-6">
      <h1 className="page-title mb-0">עונה והגדרות ניקוד</h1>

      {seasons.map((s) => (
        <div key={s.id} className="space-y-4">
          <form action={updateSeason} className={`card space-y-3 ${s.is_active ? "border-accent" : ""}`}>
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
                <span className="label">מכפיל שחקן בשישייה</span>
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
          {s.is_active && <PlayerScoringForm season={s} />}
        </div>
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

function PlayerScoringForm({ season }: { season: Season }) {
  const ready = season.ppts_win !== undefined;
  return (
    <form action={updatePlayerScoring} className="card space-y-3">
      {R}
      <input type="hidden" name="id" value={season.id} />
      <h2 className="text-lg font-bold">ניקוד אישי לשחקנים ושישיית המחזור</h2>
      {!ready && (
        <p className="rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-900">
          כדי להפעיל את הניקוד האישי יש להריץ ב-Supabase את קובץ ה-SQL של הניקוד האישי.
        </p>
      )}
      <p className="text-xs text-muted">
        ניקוד המחזור של שחקן הוא סכום הנקודות שלו מכל המשחקים במחזור, ועוד בונוס מצטיין המחזור. בשישייה הוא מוכפל
        במכפיל השחקן בשישייה, ולקפטן במכפיל הקפטן. בעונשין מזינים מספר חיובי, והוא יורד מהניקוד.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PLAYER_RULES.map((rule) => (
          <label key={rule.key}>
            <span className={`label ${rule.penalty ? "text-rose-600" : ""}`}>
              {rule.penalty ? "− " : "+ "}
              {rule.label}
            </span>
            <input
              className="input"
              type="number"
              step="0.5"
              min={0}
              name={rule.key}
              defaultValue={playerRuleValue(season, rule)}
            />
          </label>
        ))}
        <label>
          <span className="label">הפרש לניצחון מוחץ</span>
          <input
            className="input"
            type="number"
            min={1}
            name="crushing_margin"
            defaultValue={season.crushing_margin ?? DEFAULT_CRUSHING_MARGIN}
          />
        </label>
      </div>
      <h3 className="pt-2 font-bold">שישיית המחזור</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label>
          <span className="label">מספר שחקנים בהרכב</span>
          <input className="input" type="number" min={1} max={12} name="squad_size" defaultValue={season.squad_size ?? 6} />
        </label>
        <label>
          <span className="label">מקסימום ברזילאים</span>
          <input
            className="input"
            type="number"
            min={0}
            max={12}
            name="max_brazilians"
            defaultValue={season.max_brazilians ?? 3}
          />
        </label>
      </div>
      <p className="text-xs text-muted">
        מכפיל השחקן ומכפיל הקפטן נמצאים בהגדרות העונה למעלה. כדי שהקפטן יקבל בדיוק פי 2 משחקן רגיל, קובעים למשל
        מכפיל שחקן 1 ומכפיל קפטן 2, או 2 ו-4.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="quad_multiply_negative" defaultChecked={season.quad_multiply_negative ?? true} />
        להכפיל גם ניקוד שלילי בשישייה (למשל קפטן עם כרטיס אדום)
      </label>
      <button className="btn" disabled={!ready}>
        שמירת ניקוד שחקנים
      </button>
    </form>
  );
}
