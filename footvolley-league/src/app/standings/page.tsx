import { NoSeason } from "@/components/NoSeason";
import { TeamBadge } from "@/components/TeamBadge";
import { ZoneLegend } from "@/components/ZoneLegend";
import { getActiveSeason } from "@/lib/data";
import { computeStandings, zoneForPosition } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";
import type { Match, Team } from "@/lib/types";

export default async function StandingsPage() {
  const season = await getActiveSeason();
  if (!season) return <NoSeason />;
  const supabase = await createClient();

  const [{ data: teams }, { data: matches }] = await Promise.all([
    supabase.from("teams").select("*").eq("season_id", season.id),
    supabase
      .from("matches")
      .select("*, rounds!inner(season_id, stage)")
      .eq("rounds.season_id", season.id)
      .eq("rounds.stage", "regular"),
  ]);

  const rows = computeStandings((teams ?? []) as Team[], (matches ?? []) as Match[]);

  return (
    <div>
      <h1 className="page-title">טבלת הליגה – {season.name}</h1>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="p-3 text-right">#</th>
              <th className="p-3 text-right">קבוצה</th>
              <th className="p-3">מש&apos;</th>
              <th className="p-3">נצ&apos;</th>
              <th className="p-3">הפ&apos;</th>
              <th className="hidden p-3 sm:table-cell">נק&apos;</th>
              <th className="p-3">הפרש</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const zone = zoneForPosition(i + 1);
              return (
                <tr key={r.team.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <span className="flex items-center gap-2">
                      <span className={`h-5 w-1 rounded-full ${zone?.className ?? ""}`} />
                      <b className="tabular-nums">{i + 1}</b>
                    </span>
                  </td>
                  <td className="p-3">
                    <TeamBadge team={r.team} />
                  </td>
                  <td className="p-3 text-center tabular-nums">{r.played}</td>
                  <td className="p-3 text-center font-bold tabular-nums">{r.wins}</td>
                  <td className="p-3 text-center tabular-nums">{r.losses}</td>
                  <td className="hidden p-3 text-center tabular-nums sm:table-cell" dir="ltr">
                    {r.pointsFor}:{r.pointsAgainst}
                  </td>
                  <td className="p-3 text-center tabular-nums" dir="ltr">
                    {r.diff > 0 ? `+${r.diff}` : r.diff}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3">
        <ZoneLegend />
      </div>
      <p className="mt-2 text-xs text-muted">
        הטבלה מחושבת אוטומטית לפי ניצחונות ואז הפרש נקודות. הדירוג הרשמי לניקוד נקבע ע&quot;י המנהל בסוף העונה.
      </p>
    </div>
  );
}
