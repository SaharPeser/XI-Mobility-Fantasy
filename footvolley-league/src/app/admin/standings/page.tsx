import { NoSeason } from "@/components/NoSeason";
import { getActiveSeason } from "@/lib/data";
import { computeStandings } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";
import type { Match, Team } from "@/lib/types";
import { saveFinalStandings } from "../actions";

export default async function AdminStandingsPage({ searchParams }: PageProps<"/admin/standings">) {
  const { prefill } = await searchParams;
  const season = await getActiveSeason();
  if (!season) return <NoSeason />;
  const supabase = await createClient();
  const [{ data: teamsData }, { data: matches }] = await Promise.all([
    supabase.from("teams").select("*").eq("season_id", season.id).order("name"),
    supabase
      .from("matches")
      .select("*, rounds!inner(season_id, stage)")
      .eq("rounds.season_id", season.id)
      .eq("rounds.stage", "regular"),
  ]);
  const teams = (teamsData ?? []) as Team[];
  const computed = computeStandings(teams, (matches ?? []) as Match[]);
  const computedPos = new Map(computed.map((r, i) => [r.team.id, i + 1]));
  const usePrefill = prefill === "1";

  const ordered = [...teams].sort(
    (a, b) => (a.final_position ?? computedPos.get(a.id) ?? 99) - (b.final_position ?? computedPos.get(b.id) ?? 99),
  );

  return (
    <div className="space-y-4">
      <h1 className="page-title mb-0">דירוג סופי – סוף העונה הסדירה</h1>
      <p className="text-sm text-muted">
        המיקום הסופי של כל קבוצה קובע את הניקוד על ניחושי הטבלה. מלאו אותו רק בסוף העונה הסדירה – עד אז השאירו ריק.
      </p>
      <a href="?prefill=1" className="btn-secondary text-sm">
        מילוי לפי הטבלה המחושבת
      </a>
      <form key={usePrefill ? "prefill" : "saved"} action={saveFinalStandings} className="card space-y-2">
        <input type="hidden" name="return_to" value="/admin/standings" />
        <input type="hidden" name="season_id" value={season.id} />
        {ordered.map((t) => (
          <label key={t.id} className="flex items-center gap-3">
            <select
              className="input w-24"
              name={`t_${t.id}`}
              defaultValue={(usePrefill ? computedPos.get(t.id) : t.final_position) ?? ""}
            >
              <option value="">—</option>
              {teams.map((_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <span className="flex-1">{t.name}</span>
            <span className="text-xs text-muted">מחושב: {computedPos.get(t.id)}</span>
          </label>
        ))}
        <button className="btn">שמירת דירוג סופי</button>
      </form>
    </div>
  );
}
