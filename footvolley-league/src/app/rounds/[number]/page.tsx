import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag } from "@/components/Flag";
import { SponsorLogo } from "@/components/Sponsor";
import { VsDivider } from "@/components/VsDivider";
import { NoSeason } from "@/components/NoSeason";
import { TeamBadge } from "@/components/TeamBadge";
import { getActiveSeason, getSessionUser } from "@/lib/data";
import { formatDateTime, isPast } from "@/lib/format";
import { predictionPoints, quadMultiplier } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";
import type { Match, Player, Round, Team } from "@/lib/types";
import { PredictionsForm } from "./PredictionsForm";
import { SandPitch } from "./SandPitch";

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
        .select("*, teams!inner(season_id)")
        .eq("teams.season_id", season.id)
        .order("name"),
      supabase.from("player_round_scores").select("player_id, points").eq("round_id", round.id),
      supabase.from("rounds").select("number").eq("season_id", season.id).eq("number", round.number + 1).maybeSingle(),
    ]);
  const matches = (matchesData ?? []) as Match[];
  const teams: Record<string, Team> = Object.fromEntries((teamsData ?? []).map((t) => [t.id, t]));
  const allPlayers: Player[] = (playersData ?? []).map((p) => ({
    id: p.id,
    team_id: p.team_id,
    name: p.name,
    is_active: p.is_active,
    nationality: p.nationality ?? "IL",
    photo_url: p.photo_url ?? null,
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
  // לבחירה: שחקנים פעילים, ועוד מי שכבר נבחר (גם אם הפך ללא פעיל)
  const chosenIds = new Set(myQuad.map((q) => q.player_id));
  const players = allPlayers.filter((p) => p.is_active || chosenIds.has(p.id));
  const squadSize = season.squad_size ?? 6;
  const maxBrazilians = season.max_brazilians ?? 3;
  const title = round.name || `מחזור ${round.number}`;

  const matchTotal = matches.reduce((sum, m) => sum + (predictionPoints(season, m, myPreds[m.id]) ?? 0), 0);
  const quadTotal = myQuad.reduce(
    (sum, q) =>
      sum +
      (playerPoints.get(q.player_id) ?? 0) * quadMultiplier(season, playerPoints.get(q.player_id) ?? 0, q.is_captain),
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
                הניקוד שלך במשחקים: <b className="text-accent">{matchTotal}</b>
              </p>
            )}
            {matches.map((m) => {
              const pred = myPreds[m.id];
              const pts = predictionPoints(season, m, pred);
              return (
                <div key={m.id} className="brand-card brand-stripes">
                  <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                    <span>{formatDateTime(m.starts_at)}</span>
                    <span className="flex gap-3">
                      <span className="w-10 text-center">תוצאה</span>
                      {user && <span className="w-10 text-center">ניחוש</span>}
                    </span>
                  </div>
                  <div>
                    {(["home", "away"] as const).map((side) => {
                      const score = m[`${side}_score`];
                      const other = m[side === "home" ? "away_score" : "home_score"];
                      const won = score != null && other != null && score > other;
                      return (
                        <div key={side}>
                          {side === "away" && <VsDivider />}
                          <div className="flex items-center gap-3">
                            <TeamBadge
                              team={teams[side === "home" ? m.home_team_id : m.away_team_id]}
                              className={`min-w-0 flex-1 ${won ? "font-extrabold text-white" : "font-medium text-white/75"}`}
                            />
                            <span
                              className={`w-10 text-center text-xl font-extrabold tabular-nums ${won ? "text-brand" : "text-white"}`}
                            >
                              {score ?? "–"}
                            </span>
                            {user && (
                              <span className="w-10 rounded-md bg-white/10 py-0.5 text-center tabular-nums text-white/70">
                                {pred?.[`${side}_score`] ?? "—"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {user && pts != null && (
                    <div className="mt-3 flex justify-end">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${
                          pts === season.pts_exact
                            ? "bg-brand text-brand-dark"
                            : pts
                              ? "bg-brand/20 text-brand"
                              : "bg-white/10 text-white/60"
                        }`}
                      >
                        {pts === season.pts_exact ? "תוצאה מדויקת! " : ""}+{pts}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">שישיית המחזור</h2>
        <div className="brand-card brand-stripes p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-xl font-extrabold">
                שישיית <span className="text-brand">{round.name || `מחזור ${round.number}`}</span>
              </div>
              <div className="text-xs text-white/60">
                {squadSize} שחקנים · עד {maxBrazilians} ברזילאים · קפטן ×{Number(season.captain_multiplier)}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <span>בחסות</span>
              <SponsorLogo className="h-3.5" />
            </div>
          </div>
          {!players.length ? (
            <p className="text-white/70">עוד לא הוזנו שחקנים.</p>
          ) : user && !locked ? (
            <SandPitch
              roundId={round.id}
              players={players}
              teams={teams}
              initialIds={myQuad.map((q) => q.player_id)}
              initialCaptain={myQuad.find((q) => q.is_captain)?.player_id ?? null}
              size={squadSize}
              maxBrazilians={maxBrazilians}
              playerMultiplier={Number(season.quad_multiplier)}
              captainMultiplier={Number(season.captain_multiplier)}
            />
          ) : user ? (
            myQuad.length ? (
              <div className="space-y-4">
                <SandPitch
                  roundId={round.id}
                  players={players}
                  teams={teams}
                  initialIds={myQuad.map((q) => q.player_id)}
                  initialCaptain={myQuad.find((q) => q.is_captain)?.player_id ?? null}
                  size={Math.max(squadSize, myQuad.length)}
                  maxBrazilians={maxBrazilians}
                  playerMultiplier={Number(season.quad_multiplier)}
                  captainMultiplier={Number(season.captain_multiplier)}
                  readOnly
                  points={Object.fromEntries(myQuad.map((q) => [q.player_id, playerPoints.get(q.player_id) ?? 0]))}
                />
                <div className="space-y-2 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                  {myQuad.map((q) => {
                    const p = players.find((pl) => pl.id === q.player_id);
                    const base = playerPoints.get(q.player_id);
                    const mult = quadMultiplier(season, base ?? 0, q.is_captain);
                    return (
                      <div key={q.player_id} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                          <Flag code={p?.nationality} />
                          {q.is_captain && (
                            <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-yellow-200 to-amber-500 text-[10px] font-black text-amber-950">
                              C
                            </span>
                          )}
                          {p?.name ?? "שחקן"} <span className="text-xs text-white/50">{p && teams[p.team_id]?.name}</span>
                        </span>
                        <span className="tabular-nums text-white/60">
                          {base == null ? (
                            "ממתין לניקוד"
                          ) : (
                            <>
                              {base} × {mult} = <b className="text-brand">{base * mult}</b>
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="text-sm text-white/70">סה&quot;כ שישייה</span>
                    <b className="text-2xl text-brand tabular-nums">{quadTotal}</b>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-white/70">לא נבחרה שישייה במחזור זה.</p>
            )
          ) : (
            <p className="text-white/70">התחברו כדי לבחור שישייה.</p>
          )}
        </div>
      </section>
    </div>
  );
}
