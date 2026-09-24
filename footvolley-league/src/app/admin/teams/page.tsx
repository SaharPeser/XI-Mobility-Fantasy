import { ConfirmButton } from "@/components/ConfirmButton";
import { NoSeason } from "@/components/NoSeason";
import { TeamBadge } from "@/components/TeamBadge";
import { getActiveSeason } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Player, Team } from "@/lib/types";
import { addPlayers, createTeam, deletePlayer, deleteTeam, updatePlayer, updateTeam } from "../actions";

const R = <input type="hidden" name="return_to" value="/admin/teams" />;

export default async function AdminTeamsPage() {
  const season = await getActiveSeason();
  if (!season) return <NoSeason />;
  const supabase = await createClient();
  const [{ data: teamsData }, { data: playersData }] = await Promise.all([
    supabase.from("teams").select("*").eq("season_id", season.id).order("name"),
    supabase.from("players").select("*, teams!inner(season_id)").eq("teams.season_id", season.id).order("name"),
  ]);
  const teams = (teamsData ?? []) as Team[];
  const players = (playersData ?? []) as Player[];

  return (
    <div className="space-y-6">
      <h1 className="page-title mb-0">
        קבוצות ושחקנים <span className="text-base font-normal text-muted">({teams.length} קבוצות)</span>
      </h1>

      <form action={createTeam} className="card grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        {R}
        <input type="hidden" name="season_id" value={season.id} />
        <label>
          <span className="label">שם קבוצה</span>
          <input className="input" name="name" required />
        </label>
        <label>
          <span className="label">קישור ללוגו (לא חובה)</span>
          <input className="input" name="logo_url" dir="ltr" placeholder="https://..." />
        </label>
        <button className="btn">הוספת קבוצה</button>
      </form>

      {teams.map((team) => {
        const teamPlayers = players.filter((p) => p.team_id === team.id);
        return (
          <details key={team.id} className="card">
            <summary className="flex cursor-pointer items-center justify-between">
              <TeamBadge team={team} className="font-bold" />
              <span className="text-sm text-muted">{teamPlayers.length} שחקנים</span>
            </summary>

            <div className="mt-4 space-y-4">
              <form action={updateTeam} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
                {R}
                <input type="hidden" name="id" value={team.id} />
                <label>
                  <span className="label">שם</span>
                  <input className="input" name="name" defaultValue={team.name} required />
                </label>
                <label>
                  <span className="label">לוגו</span>
                  <input className="input" name="logo_url" dir="ltr" defaultValue={team.logo_url ?? ""} />
                </label>
                <button className="btn-secondary">עדכון</button>
                <ConfirmButton formAction={deleteTeam} className="btn-danger" message="למחוק את הקבוצה? כל המשחקים, השחקנים והניחושים הקשורים אליה יימחקו.">
                  מחיקת קבוצה
                </ConfirmButton>
              </form>

              <div className="space-y-1">
                {teamPlayers.map((p) => (
                  <form key={p.id} action={updatePlayer} className="flex items-center gap-2">
                    {R}
                    <input type="hidden" name="id" value={p.id} />
                    <input className="input py-1" name="name" defaultValue={p.name} required />
                    <label className="flex items-center gap-1 whitespace-nowrap text-sm">
                      <input type="checkbox" name="is_active" defaultChecked={p.is_active} /> פעיל
                    </label>
                    <button className="btn-secondary py-1 text-sm">שמירה</button>
                    <ConfirmButton formAction={deletePlayer} className="btn-danger" message="למחוק את השחקן?">
                      ✕
                    </ConfirmButton>
                  </form>
                ))}
              </div>

              <form action={addPlayers} className="space-y-2">
                {R}
                <input type="hidden" name="team_id" value={team.id} />
                <label>
                  <span className="label">הוספת שחקנים (שם בכל שורה)</span>
                  <textarea className="input" name="names" rows={3} />
                </label>
                <button className="btn-secondary text-sm">הוספה</button>
              </form>
            </div>
          </details>
        );
      })}
    </div>
  );
}
