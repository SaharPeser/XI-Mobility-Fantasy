import { NoSeason } from "@/components/NoSeason";
import { ZoneLegend } from "@/components/ZoneLegend";
import { getActiveSeason, requireUser } from "@/lib/data";
import { formatDateTime, isPast } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Team } from "@/lib/types";
import { TableOrderForm } from "./TableOrderForm";

export default async function PredictTablePage() {
  const user = await requireUser("/predict-table");
  const season = await getActiveSeason();
  if (!season) return <NoSeason />;
  const supabase = await createClient();

  const [{ data: teamsData }, { data: preds }] = await Promise.all([
    supabase.from("teams").select("*").eq("season_id", season.id).order("name"),
    supabase
      .from("table_predictions")
      .select("team_id, position")
      .eq("user_id", user.id)
      .eq("season_id", season.id)
      .order("position"),
  ]);
  const teams = (teamsData ?? []) as Team[];
  const locked = isPast(season.table_deadline);

  const byId = new Map(teams.map((t) => [t.id, t]));
  const predicted = (preds ?? []).map((p) => byId.get(p.team_id)).filter(Boolean) as Team[];
  const initialOrder = predicted.length === teams.length ? predicted : teams;

  return (
    <div>
      <h1 className="page-title">ניחוש הטבלה בסוף העונה הסדירה</h1>
      <div className="card mb-4 space-y-2 text-sm">
        <p>
          סדרו את 12 הקבוצות לפי המיקום שלדעתכם יהיה להן בסוף העונה הסדירה (גררו או השתמשו בחצים). על כל קבוצה
          שתמקמו נכון תקבלו <b>{season.pts_table_position}</b> נקודות.
        </p>
        <p className={locked ? "font-medium text-rose-600" : "text-muted"}>
          {season.table_deadline
            ? locked
              ? "הניחוש נעול."
              : `אפשר לשנות עד ${formatDateTime(season.table_deadline)}`
            : "המנהל עוד לא קבע מועד נעילה."}
        </p>
        {!preds?.length && !locked && <p className="font-medium text-amber-600">עוד לא שמרתם ניחוש טבלה.</p>}
        <ZoneLegend />
      </div>
      {teams.length ? (
        <TableOrderForm
          seasonId={season.id}
          initialOrder={initialOrder}
          locked={locked}
          finalPositions={Object.fromEntries(teams.map((t) => [t.id, t.final_position]))}
          pointsPerHit={season.pts_table_position}
        />
      ) : (
        <div className="card text-muted">עוד לא הוזנו קבוצות.</div>
      )}
    </div>
  );
}
