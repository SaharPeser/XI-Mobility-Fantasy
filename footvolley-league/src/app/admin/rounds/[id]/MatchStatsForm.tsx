import type { ReactNode } from "react";
import type { Match, MatchPlayerStat, Player, Team } from "@/lib/types";
import { saveMatchStats } from "../../actions";

/** טופס הניקוד האישי של משחק אחד: שורה לכל שחקן משתי הקבוצות */
export function MatchStatsForm({
  match,
  home,
  away,
  players,
  stats,
  points,
  returnTo,
}: {
  match: Match;
  home?: Team;
  away?: Team;
  players: Player[];
  stats: Map<string, MatchPlayerStat>;
  points: Map<string, number>;
  returnTo: ReactNode;
}) {
  const sides = [home, away].filter(Boolean) as Team[];
  const filled = players.filter((p) => stats.has(p.id)).length;
  const mvp = players.find((p) => stats.get(p.id)?.is_mvp)?.id ?? "";

  return (
    <details className="card" open={!filled && match.home_score != null}>
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
        <span className="font-bold">
          {home?.name} – {away?.name}
          {match.home_score != null && (
            <span className="mr-2 font-normal text-muted" dir="ltr">
              {match.home_score}:{match.away_score}
            </span>
          )}
        </span>
        <span className={`text-sm ${filled ? "text-emerald-600" : "text-muted"}`}>
          {filled ? `${filled} שחקנים הוזנו` : "טרם הוזן"}
        </span>
      </summary>

      <form action={saveMatchStats} className="mt-4 space-y-4">
        {returnTo}
        <input type="hidden" name="match_id" value={match.id} />
        <input type="hidden" name="player_ids" value={players.map((p) => p.id).join(",")} />
        {match.home_score == null && (
          <p className="text-xs text-amber-600">
            עוד לא הוזנה תוצאה. נקודות הניצחון, הניצחון המוחץ וההארכה יחושבו אחרי שתוזן.
          </p>
        )}

        {sides.map((team) => (
          <div key={team.id} className="space-y-2">
            <div className="text-sm font-bold text-accent">{team.name}</div>
            {players
              .filter((p) => p.team_id === team.id)
              .map((p) => {
                const s = stats.get(p.id);
                const pts = points.get(p.id);
                return (
                  <fieldset key={p.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 font-medium">
                        <input type="checkbox" name={`played_${p.id}`} defaultChecked={!!s} className="h-4 w-4" />
                        {p.name}
                        {!p.is_active && <span className="text-xs text-muted">(לא פעיל)</span>}
                      </label>
                      {pts != null && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-sm font-bold tabular-nums ${
                            pts < 0 ? "bg-rose-100 text-rose-700" : "bg-accent-soft text-accent"
                          }`}
                          dir="ltr"
                        >
                          {pts > 0 ? `+${pts}` : pts}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <NumberField label="חסימות" name={`blocks_${p.id}`} value={s?.blocks} />
                      <NumberField label="הגנות מדהימות" name={`defense_${p.id}`} value={s?.great_defense} />
                      <NumberField label="טעויות" name={`errors_${p.id}`} value={s?.unforced_errors} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <select className="input w-auto py-1" name={`tier_${p.id}`} defaultValue={s?.scored_tier ?? 0}>
                        <option value={0}>פחות מ-8 נק&apos;</option>
                        <option value={1}>8+ נקודות</option>
                        <option value={2}>14+ נקודות</option>
                      </select>
                      <label className="flex items-center gap-1">
                        <input type="radio" name="mvp" value={p.id} defaultChecked={mvp === p.id} /> מצטיין
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="checkbox" name={`yellow_${p.id}`} defaultChecked={s?.yellow_card} /> 🟨 צהוב
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="checkbox" name={`red_${p.id}`} defaultChecked={s?.red_card} /> 🟥 אדום
                      </label>
                    </div>
                  </fieldset>
                );
              })}
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1 text-sm text-muted">
            <input type="radio" name="mvp" value="" defaultChecked={!mvp} /> ללא מצטיין
          </label>
          <button className="btn mr-auto">שמירת נתוני המשחק</button>
        </div>
      </form>
    </details>
  );
}

function NumberField({ label, name, value }: { label: string; name: string; value?: number }) {
  return (
    <label className="text-xs text-muted">
      {label}
      <input
        className="input mt-0.5 py-1 text-center text-base text-foreground"
        type="number"
        inputMode="numeric"
        min={0}
        name={name}
        defaultValue={value || ""}
        placeholder="0"
      />
    </label>
  );
}
