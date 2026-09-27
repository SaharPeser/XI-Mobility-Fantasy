import { NoSeason } from "@/components/NoSeason";
import { SponsorPrizes } from "@/components/Sponsor";
import { ZoneLegend } from "@/components/ZoneLegend";
import { getActiveSeason } from "@/lib/data";
import { DEFAULT_CRUSHING_MARGIN, PLAYER_RULES, playerRuleValue, SCORE_RULE_TEXT } from "@/lib/scoring";

export const metadata = { title: "חוקי הניקוד – ליגת הפוצ'יוולי XIMOBILITY" };

function Pts({ value, penalty = false }: { value: number; penalty?: boolean }) {
  return (
    <b className={`tabular-nums ${penalty ? "text-rose-600" : "text-accent"}`} dir="ltr">
      {penalty ? `−${value}` : `+${value}`}
    </b>
  );
}

export default async function RulesPage() {
  const season = await getActiveSeason();
  if (!season) return <NoSeason />;
  const q = Number(season.quad_multiplier);
  const c = Number(season.captain_multiplier);
  const margin = season.crushing_margin ?? DEFAULT_CRUSHING_MARGIN;
  const v = (key: (typeof PLAYER_RULES)[number]["key"]) => playerRuleValue(season, PLAYER_RULES.find((r) => r.key === key)!);

  // דוגמה: שחקן שניצח, 2 חסימות, 8+ נקודות, טעות אחת
  const example = v("ppts_played") + v("ppts_win") + 2 * v("ppts_block") + v("ppts_scored_8") - v("ppts_unforced_error");

  return (
    <div className="space-y-5">
      <h1 className="page-title mb-0">חוקי הניקוד</h1>
      <p className="text-sm text-muted">
        יש שלוש דרכים לצבור נקודות: ניחוש תוצאות, ניחוש הטבלה ורביעיית המחזור. כל הנקודות מתחברות לדירוג הכללי.
      </p>

      <section className="card space-y-2">
        <h2 className="text-lg font-bold">1. ניחוש תוצאות</h2>
        <p className="text-sm">בכל מחזור מנחשים את התוצאה המדויקת של כל משחק, עד מועד הנעילה של המחזור.</p>
        <ul className="space-y-1 text-sm">
          <li>
            תוצאה מדויקת: <Pts value={season.pts_exact} />
          </li>
          <li>
            ניחוש המנצחת בלבד: <Pts value={season.pts_winner} />
          </li>
        </ul>
        <p className="text-xs text-muted">{SCORE_RULE_TEXT}.</p>
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-bold">2. ניחוש הטבלה</h2>
        <p className="text-sm">
          לפני תחילת העונה מסדרים את 12 הקבוצות לפי המיקום הצפוי בסוף העונה הסדירה. על כל קבוצה במיקום הנכון:{" "}
          <Pts value={season.pts_table_position} />
        </p>
        <ZoneLegend />
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-bold">3. רביעיית המחזור</h2>
        <p className="text-sm">
          בכל מחזור בוחרים 4 שחקנים וקפטן. כל שחקן ברביעייה מקבל את הניקוד האישי שלו במחזור × <b>{q}</b>, והקפטן ×{" "}
          <b>{c}</b>.
        </p>
        <p className="text-sm">
          {season.quad_multiply_negative === false
            ? "ניקוד שלילי לא מוכפל: שחקן שירד לו ניקוד במחזור מוריד לכם את הניקוד פעם אחת בלבד."
            : "גם ניקוד שלילי מוכפל: קפטן שקיבל כרטיס אדום יוריד לכם נקודות כפולות. בחרו בזהירות!"}
        </p>
      </section>

      <section id="players" className="card scroll-mt-28 space-y-3">
        <h2 className="text-lg font-bold">ניקוד אישי לשחקנים</h2>
        <p className="text-sm">
          ניקוד המחזור של שחקן הוא סכום הנקודות שלו מכל המשחקים במחזור, ועוד בונוס למצטיין המחזור.
        </p>
        <table className="w-full text-sm">
          <tbody>
            {PLAYER_RULES.map((rule) => (
              <tr key={rule.key} className="border-b border-border last:border-0">
                <td className="py-2">
                  <div className="font-medium">{rule.label}</div>
                  <div className="text-xs text-muted">
                    {rule.key === "ppts_crushing_win" ? `הפרש של ${margin} נקודות ומעלה, בנוסף לניצחון` : rule.how}
                  </div>
                </td>
                <td className="py-2 text-left">
                  <Pts value={playerRuleValue(season, rule)} penalty={rule.penalty} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="rounded-xl bg-accent-soft p-3 text-sm">
          <b>דוגמה:</b> שחקן שניצח, עשה 2 חסימות, קלע 8 נקודות ומעלה וטעה פעם אחת מקבל <b>{example}</b> נקודות. אם הוא
          הקפטן שלכם, תקבלו <b>{example * c}</b>.
        </div>
      </section>

      <SponsorPrizes season={season} />
    </div>
  );
}
