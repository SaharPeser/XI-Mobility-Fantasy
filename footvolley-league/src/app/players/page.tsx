import Link from "next/link";
import { NoSeason } from "@/components/NoSeason";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { TeamBadge } from "@/components/TeamBadge";
import { getActiveSeason } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Player, Round, Team } from "@/lib/types";

export default async function PlayersPage({ searchParams }: PageProps<"/players">) {
  const { round: roundParam } = await searchParams;
  const season = await getActiveSeason();
  if (!season) return <NoSeason />;
  const supabase = await createClient();

  const [{ data: teamsData }, { data: playersData }, { data: roundsData }, { data: scoresData }] = await Promise.all([
    supabase.from("teams").select("*").eq("season_id", season.id),
    supabase.from("players").select("*, teams!inner(season_id)").eq("teams.season_id", season.id),
    supabase.from("rounds").select("*").eq("season_id", season.id).order("number"),
    supabase.from("player_round_scores").select("player_id, round_id, points").eq("season_id", season.id),
  ]);
  const teams = new Map(((teamsData ?? []) as Team[]).map((t) => [t.id, t]));
  const players = (playersData ?? []) as Player[];
  const rounds = (roundsData ?? []) as Round[];
  const scores = scoresData ?? [];

  const roundsWithScores = rounds.filter((r) => scores.some((s) => s.round_id === r.id));
  const selected = rounds.find((r) => String(r.number) === roundParam);

  const seasonTotal = new Map<string, number>();
  const roundTotal = new Map<string, number>();
  for (const s of scores) {
    seasonTotal.set(s.player_id, (seasonTotal.get(s.player_id) ?? 0) + Number(s.points));
    if (selected && s.round_id === selected.id) roundTotal.set(s.player_id, Number(s.points));
  }
  const shown = selected ? roundTotal : seasonTotal;

  const rows = players
    .filter((p) => shown.has(p.id) || (!selected && p.is_active))
    .map((p) => ({ player: p, points: shown.get(p.id) ?? 0, total: seasonTotal.get(p.id) ?? 0 }))
    .sort((a, b) => b.points - a.points || a.player.name.localeCompare(b.player.name, "he"));

  const mvpIds = new Set(
    (selected ? [selected] : rounds).map((r) => r.mvp_player_id).filter(Boolean) as string[],
  );

  return (
    <div className="space-y-4">
      <h1 className="page-title mb-0">שחקנים – ניקוד אישי</h1>
      <p className="text-sm text-muted">
        הניקוד של כל שחקן, שממנו מחושבת שישיית המחזור.{" "}
        <Link href="/rules#players" className="text-accent">
          איך מחושב הניקוד?
        </Link>
      </p>

      <nav className="flex gap-2 overflow-x-auto pb-1 text-sm">
        <Chip href="/players" active={!selected}>
          כל העונה
        </Chip>
        {roundsWithScores.map((r) => (
          <Chip key={r.id} href={`/players?round=${r.number}`} active={selected?.id === r.id}>
            {r.name || `מחזור ${r.number}`}
          </Chip>
        ))}
      </nav>

      {!rows.length ? (
        <div className="card text-muted">עוד אין ניקוד לשחקנים{selected ? " במחזור הזה" : ""}.</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="p-3 text-right">#</th>
                <th className="p-3 text-right">שחקן</th>
                <th className="hidden p-3 text-right sm:table-cell">קבוצה</th>
                <th className="p-3">{selected ? "במחזור" : 'סה"כ'}</th>
                {selected && <th className="hidden p-3 sm:table-cell">בעונה</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.player.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-bold tabular-nums">{i + 1}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <PlayerAvatar player={r.player} className="h-9 w-9 text-xs" />
                      <div className="min-w-0">
                        <div className="font-medium">
                          {r.player.name}
                          {mvpIds.has(r.player.id) && (
                            <span className="mr-1" title="מצטיין המחזור">
                              🏅
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted sm:hidden">{teams.get(r.player.team_id)?.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden p-3 sm:table-cell">
                    <TeamBadge team={teams.get(r.player.team_id)} />
                  </td>
                  <td
                    className={`p-3 text-center text-base font-bold tabular-nums ${r.points < 0 ? "text-rose-600" : ""}`}
                    dir="ltr"
                  >
                    {r.points}
                  </td>
                  {selected && (
                    <td className="hidden p-3 text-center tabular-nums sm:table-cell" dir="ltr">
                      {r.total}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted">🏅 = מצטיין מחזור</p>
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-full border px-3 py-1 ${
        active ? "border-accent bg-accent text-accent-contrast" : "border-border bg-card hover:border-accent"
      }`}
    >
      {children}
    </Link>
  );
}
