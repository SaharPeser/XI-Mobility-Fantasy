import Link from "next/link";
import { notFound } from "next/navigation";
import { NoSeason } from "@/components/NoSeason";
import { TeamBadge } from "@/components/TeamBadge";
import { getActiveSeason, getSessionUser } from "@/lib/data";
import { formatDateTime, isPast } from "@/lib/format";
import { predictionPoints } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";
import type { Match, Player, Round, Team } from "@/lib/types";
import { PredictionsForm } from "./PredictionsForm";
import { QuadPicker } from "./QuadPicker";

export default async function RoundPage({ params }: PageProps<"/rounds/[number]">) {
  const { number } = await params;
  const season = await getActiveSeason();
  if (!season) return <NoSeason />;
  const user = await getSessionUser();
  const supabase = await createClient();

  const { data: round } = await supabase
    .from("rounds")
    .select("*")
    .eq("season_id", season.id)
    .eq("number", Number(number))
    .maybeSingle<Round>();
  if (!round) notFound();

  const [{ data: matchesData }, { data: teamsData }, { data: playersData }, { data: pointsData }, { data: nextRound }] =
    await Promise.all([
      supabase.from("matches").select("*").eq("round_id", round.id).order("sort_order").order("starts_at"),
      supabase.from("teams").select("*").eq("season_id", season.id),
      supabase
        .from("players")
        .select("id, team_id, name, is_active, teams!inner(season_id)")
        .eq("teams.season_id", season.id)
        .eq("is_active", true)
        .order("name"),
      supabase.from("player_round_points").select("player_id, points").eq("round_id", round.id),
      supabase.from("rounds").select("number").eq("season_id", season.id).eq("number", round.number + 1).maybeSingle(),
    ]);
  const matches = (matchesData ?? []) as Match[];
  const teams: Record<string, Team> = Object.fromEntries((teamsData ?? []).map((t) => [t.id, t]));
  const players: Player[] = (playersData ?? []).map((p) => ({
    id: p.id,
    team_id: p.team_id,
    name: p.name,
    is_active: p.is_active,
  }));
  const playerPoints = new Map((pointsData ?? []).map((p) => [p.player_id, Number(p.points)]));

  let myPreds: Record<string, { home_score: number; away_score: number }> = {};
  let myQuad: { player_id: string; is_captain: boolean }[] = [];
  if (user) {
    const [{ data: preds }, { data: quad }] = await Promise.all([
      supabase
        .from("match_predictions")
        .select("match_id, home_score, away_score")
        .eq("user_id", user.id)
        .in(
          "match_id",
          matches.map((m) => m.id),
        ),
      supabase.from("quad_picks").select("player_id, is_captain").eq("user_id", user.id).eq("round_id", round.id),
    ]);
    myPreds = Object.fromEntries((preds ?? []).map((p) => [p.match_id, p]));
    myQuad = quad ?? [];
  }

  const locked = isPast(round.deadline);
  const title = round.name || `מחזור ${round.number}`;

  const matchTotal = matches.reduce((sum, m) => sum + (predictionPoints(season, m, myPreds[m.id]) ?? 0), 0);
  const quadTotal = myQuad.reduce(
    (sum, q) =>
      sum +
      (playerPoints.get(q.player_id) ?? 0) * (q.is_captain ? season.captain_multiplier : season.quad_multiplier),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className={`text-sm ${locked ? "text-rose-600" : "text-muted"}`}>
            {locked ? "המחזור נעול לשינויים" : `אפשר לשנות עד ${formatDateTime(round.deadline)}`}
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          {round.number > 1 && (
            <Link className="btn-secondary px-3" href={`/rounds/${round.number - 1}`} aria-label="המחזור הקודם">
              →
            </Link>
          )}
          {nextRound && (
            <Link className="btn-secondary px-3" href={`/rounds/${round.number + 1}`} aria-label="המחזור הבא">
              ←
            </Link>
          )}
        </div>
      </div>

      {!user && (
        <div className="card text-center">
          <Link href={`/login?next=/rounds/${round.number}`} className="btn">
            התחברו כדי לנחש
          </Link>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">ניחוש תוצאות</h2>
        {!matches.length ? (
          <div className="card text-muted">עוד לא הוזנו משחקים למחזור.</div>
        ) : user && !locked ? (
          <PredictionsForm matches={matches} teams={teams} initial={myPreds} />
        ) : (
          <div className="space-y-2">
            {user && locked && (
              <p className="text-sm">
                הניקוד שלך במשחקים: <b>{matchTotal}</b>
              </p>
            )}
            {matches.map((m) => {
              const pred = myPreds[m.id];
              const pts = predictionPoints(season, m, pred);
              return (
                <div key={m.id} className="card">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted">
                    <span>{formatDateTime(m.starts_at)}</span>
                    <span className="flex gap-3">
                      <span className="w-10 text-center">תוצאה</span>
                      {user && <span className="w-10 text-center">ניחוש</span>}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {(["home", "away"] as const).map((side) => (
                      <div key={side} className="flex items-center gap-3">
                        <TeamBadge
                          team={teams[side === "home" ? m.home_team_id : m.away_team_id]}
                          className="min-w-0 flex-1 font-medium"
                        />
                        <span className="w-10 text-center text-lg font-bold tabular-nums">
                          {m[`${side}_score`] ?? "–"}
                        </span>
                        {user && (
                          <span className="w-10 text-center tabular-nums text-muted">
                            {pred?.[`${side}_score`] ?? "—"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {user && pts != null && (
                    <div
                      className={`mt-2 text-left text-sm ${
                        pts === season.pts_exact ? "font-bold text-emerald-600" : pts ? "text-emerald-600" : "text-muted"
                      }`}
                    >
                      {pts === season.pts_exact ? "תוצאה מדויקת! " : ""}+{pts}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">רביעיית המחזור</h2>
        <div className="card">
          {!players.length ? (
            <p className="text-muted">עוד לא הוזנו שחקנים.</p>
          ) : user && !locked ? (
            <QuadPicker
              roundId={round.id}
              players={players}
              teams={teams}
              initialIds={myQuad.map((q) => q.player_id)}
              initialCaptain={myQuad.find((q) => q.is_captain)?.player_id ?? null}
              quadMultiplier={season.quad_multiplier}
              captainMultiplier={season.captain_multiplier}
            />
          ) : user ? (
            myQuad.length ? (
              <div className="space-y-2">
                {myQuad.map((q) => {
                  const p = players.find((pl) => pl.id === q.player_id);
                  const base = playerPoints.get(q.player_id);
                  const mult = q.is_captain ? season.captain_multiplier : season.quad_multiplier;
                  return (
                    <div key={q.player_id} className="flex items-center justify-between">
                      <span>
                        {q.is_captain && (
                          <span className="ml-1 rounded-full bg-sand px-1.5 text-xs font-bold text-stone-900">C</span>
                        )}
                        {p?.name ?? "שחקן"} <span className="text-xs text-muted">{p && teams[p.team_id]?.name}</span>
                      </span>
                      <span className="tabular-nums text-muted">
                        {base == null ? (
                          "ממתין לניקוד"
                        ) : (
                          <>
                            {base} × {mult} = <b className="text-foreground">{base * mult}</b>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
                <div className="border-t border-border pt-2 text-sm">
                  סה&quot;כ רביעייה: <b>{quadTotal}</b>
                </div>
              </div>
            ) : (
              <p className="text-muted">לא נבחרה רביעייה במחזור זה.</p>
            )
          ) : (
            <p className="text-muted">התחברו כדי לבחור רביעייה.</p>
          )}
        </div>
      </section>
    </div>
  );
}
