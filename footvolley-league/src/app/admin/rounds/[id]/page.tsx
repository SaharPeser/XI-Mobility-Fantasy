import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/ConfirmButton";
import { formatDateTime, toLocalInput } from "@/lib/format";
import { SCORE_RULE_TEXT } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";
import type { Match, MatchPlayerStat, Player, Round, Team } from "@/lib/types";
import { createMatch, deleteMatch, savePlayerPoints, setRoundMvp, updateMatch } from "../../actions";
import { MatchStatsForm } from "./MatchStatsForm";

function TeamSelect({ name, teams, value }: { name: string; teams: Team[]; value?: string }) {
  return (
    <select className="input" name={name} defaultValue={value ?? ""} required>
      <option value="" disabled>
        בחירת קבוצה
      </option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}

export default async function AdminRoundPage({ params }: PageProps<"/admin/rounds/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: round } = await supabase.from("rounds").select("*").eq("id", id).maybeSingle<Round>();
  if (!round) notFound();

  const [{ data: matchesData }, { data: teamsData }, { data: playersData }, { data: pointsData }] = await Promise.all([
    supabase.from("matches").select("*").eq("round_id", id).order("sort_order").order("starts_at"),
    supabase.from("teams").select("*").eq("season_id", round.season_id).order("name"),
    supabase
      .from("players")
      .select("*, teams!inner(season_id)")
      .eq("teams.season_id", round.season_id)
      .order("name"),
    supabase.from("player_round_points").select("player_id, points").eq("round_id", id),
  ]);
  const matchIds = (matchesData ?? []).map((m) => m.id);
  const [statsRes, matchPointsRes] = await Promise.all([
    supabase.from("match_player_stats").select("*").in("match_id", matchIds),
    supabase.from("player_match_points").select("match_id, player_id, points").in("match_id", matchIds),
  ]);
  // לפני הרצת ה-SQL של הניקוד האישי הטבלה לא קיימת
  const statsReady = !statsRes.error;
  const matches = (matchesData ?? []) as Match[];
  const teams = (teamsData ?? []) as Team[];
  const players = (playersData ?? []) as Player[];
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const adjustments = new Map((pointsData ?? []).map((p) => [p.player_id, p.points]));
  const statsByMatch = new Map<string, Map<string, MatchPlayerStat>>();
  for (const st of (statsRes.data ?? []) as MatchPlayerStat[]) {
    if (!statsByMatch.has(st.match_id)) statsByMatch.set(st.match_id, new Map());
    statsByMatch.get(st.match_id)!.set(st.player_id, st);
  }
  const pointsByMatch = new Map<string, Map<string, number>>();
  for (const mp of matchPointsRes.data ?? []) {
    if (!pointsByMatch.has(mp.match_id)) pointsByMatch.set(mp.match_id, new Map());
    pointsByMatch.get(mp.match_id)!.set(mp.player_id, Number(mp.points));
  }
  const back = `/admin/rounds/${id}`;
  const R = <input type="hidden" name="return_to" value={back} />;

  // קבוצות שעוד לא שובצו במחזור
  const used = new Set(matches.flatMap((m) => [m.home_team_id, m.away_team_id]));
  const free = teams.filter((t) => !used.has(t.id));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/rounds" className="text-sm text-accent">
          → כל המחזורים
        </Link>
        <h1 className="page-title mb-0 mt-1">{round.name || `מחזור ${round.number}`}</h1>
        <p className="text-sm text-muted">נעילה: {formatDateTime(round.deadline)}</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">משחקים ותוצאות</h2>
        <p className="text-xs text-muted">{SCORE_RULE_TEXT}. השאירו תוצאה ריקה עד שהמשחק מסתיים.</p>
        {matches.map((m) => (
          <form key={m.id} action={updateMatch} className="card space-y-2">
            {R}
            <input type="hidden" name="id" value={m.id} />
            <div className="grid grid-cols-[1fr_4rem] gap-2 sm:grid-cols-[1fr_4rem_4rem_1fr]">
              <TeamSelect name="home_team_id" teams={teams} value={m.home_team_id} />
              <input
                className="input text-center"
                name="home_score"
                inputMode="numeric"
                defaultValue={m.home_score ?? ""}
                aria-label="תוצאה בית"
              />
              <input
                className="input text-center"
                name="away_score"
                inputMode="numeric"
                defaultValue={m.away_score ?? ""}
                aria-label="תוצאה חוץ"
              />
              <TeamSelect name="away_team_id" teams={teams} value={m.away_team_id} />
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex-1">
                <span className="label">מועד המשחק</span>
                <input className="input" type="datetime-local" name="starts_at" defaultValue={toLocalInput(m.starts_at)} />
              </label>
              <label className="w-20">
                <span className="label">סדר</span>
                <input className="input" type="number" name="sort_order" defaultValue={m.sort_order} />
              </label>
              <button className="btn">שמירה</button>
              <ConfirmButton formAction={deleteMatch} className="btn-danger" message="למחוק את המשחק וכל הניחושים עליו?">
                מחיקה
              </ConfirmButton>
            </div>
          </form>
        ))}

        <form action={createMatch} className="card space-y-2 border-dashed">
          {R}
          <input type="hidden" name="round_id" value={id} />
          <h3 className="font-bold">הוספת משחק</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <TeamSelect name="home_team_id" teams={free.length >= 2 ? free : teams} />
            <TeamSelect name="away_team_id" teams={free.length >= 2 ? free : teams} />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex-1">
              <span className="label">מועד המשחק</span>
              <input className="input" type="datetime-local" name="starts_at" />
            </label>
            <label className="w-20">
              <span className="label">סדר</span>
              <input className="input" type="number" name="sort_order" defaultValue={matches.length + 1} />
            </label>
            <button className="btn">הוספה</button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">ניקוד אישי לשחקנים (לשישייה)</h2>
        {!statsReady ? (
          <div className="card text-sm text-amber-700">
            כדי להזין נתוני שחקנים יש להריץ ב-Supabase את קובץ ה-SQL של הניקוד האישי.
          </div>
        ) : (
          <>
            <p className="text-xs text-muted">
              מסמנים מי שיחק בכל משחק וממלאים את הנתונים. ניצחון, ניצחון מוחץ והארכה מחושבים לבד מהתוצאה. אחרי
              השמירה יופיע ליד כל שחקן הניקוד שלו במשחק.
            </p>
            {matches.map((m) => (
              <MatchStatsForm
                key={m.id}
                match={m}
                home={teamById.get(m.home_team_id)}
                away={teamById.get(m.away_team_id)}
                players={players.filter(
                  (p) =>
                    (p.team_id === m.home_team_id || p.team_id === m.away_team_id) &&
                    (p.is_active || statsByMatch.get(m.id)?.has(p.id)),
                )}
                stats={statsByMatch.get(m.id) ?? new Map()}
                points={pointsByMatch.get(m.id) ?? new Map()}
                returnTo={R}
              />
            ))}

            <form action={setRoundMvp} className="card flex flex-wrap items-end gap-3">
              {R}
              <input type="hidden" name="round_id" value={id} />
              <label className="flex-1">
                <span className="label">🏅 מצטיין המחזור (בונוס נוסף)</span>
                <select className="input" name="mvp_player_id" defaultValue={round.mvp_player_id ?? ""}>
                  <option value="">— לא נבחר —</option>
                  {teams.map((t) => (
                    <optgroup key={t.id} label={t.name}>
                      {players
                        .filter((p) => p.team_id === t.id && (p.is_active || p.id === round.mvp_player_id))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <button className="btn">שמירה</button>
            </form>
          </>
        )}

        {players.length > 0 && (
          <details className="card">
            <summary className="cursor-pointer font-bold">תיקון ידני לניקוד המחזור (לא חובה)</summary>
            <p className="mt-2 text-xs text-muted">
              מספר שמתווסף לניקוד המחזור של השחקן, למשל לתיקון טעות. אפשר גם מספר שלילי. השאירו ריק אם אין צורך.
            </p>
            <form action={savePlayerPoints} className="mt-3 space-y-4">
              {R}
              <input type="hidden" name="round_id" value={id} />
              {teams.map((t) => {
                const list = players.filter((p) => p.team_id === t.id && p.is_active);
                if (!list.length) return null;
                return (
                  <div key={t.id}>
                    <div className="mb-1 text-sm font-bold">{t.name}</div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {list.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 text-sm">
                          <input
                            className="input w-20 py-1 text-center"
                            name={`p_${p.id}`}
                            inputMode="decimal"
                            defaultValue={adjustments.get(p.id) ?? ""}
                          />
                          <span className="truncate">{p.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
              <button className="btn-secondary">שמירת תיקונים</button>
            </form>
          </details>
        )}
      </section>
    </div>
  );
}
