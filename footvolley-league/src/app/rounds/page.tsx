import Link from "next/link";
import { NoSeason } from "@/components/NoSeason";
import { getActiveSeason, getSessionUser } from "@/lib/data";
import { formatDateTime, isPast } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Round } from "@/lib/types";

export default async function RoundsPage() {
  const season = await getActiveSeason();
  if (!season) return <NoSeason />;
  const user = await getSessionUser();
  const supabase = await createClient();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*, matches(id)")
    .eq("season_id", season.id)
    .order("number");

  let predicted = new Map<string, number>();
  let quadDone = new Set<string>();
  if (user) {
    const [{ data: preds }, { data: quads }] = await Promise.all([
      supabase.from("match_predictions").select("match_id, matches!inner(round_id)").eq("user_id", user.id),
      supabase.from("quad_picks").select("round_id").eq("user_id", user.id),
    ]);
    predicted = new Map();
    for (const p of preds ?? []) {
      const rid = (p.matches as unknown as { round_id: string }).round_id;
      predicted.set(rid, (predicted.get(rid) ?? 0) + 1);
    }
    quadDone = new Set((quads ?? []).map((q) => q.round_id));
  }

  return (
    <div>
      <h1 className="page-title">מחזורים – {season.name}</h1>
      {!rounds?.length && <div className="card text-muted">עוד לא הוזנו מחזורים.</div>}
      <ul className="space-y-2">
        {(rounds as (Round & { matches: { id: string }[] })[] | null)?.map((r) => {
          const locked = isPast(r.deadline);
          const count = predicted.get(r.id) ?? 0;
          return (
            <li key={r.id}>
              <Link href={`/rounds/${r.number}`} className="card flex items-center justify-between gap-3 hover:border-accent">
                <div>
                  <div className="font-bold">{r.name || `מחזור ${r.number}`}</div>
                  <div className="text-sm text-muted">
                    {locked ? "נעול" : "ניחושים עד"} {formatDateTime(r.deadline)}
                  </div>
                </div>
                <div className="text-left text-sm">
                  {user && (
                    <div className={count === r.matches.length && r.matches.length ? "text-emerald-600" : "text-muted"}>
                      {count}/{r.matches.length} ניחושים
                    </div>
                  )}
                  {user && <div className={quadDone.has(r.id) ? "text-emerald-600" : "text-muted"}>
                    {quadDone.has(r.id) ? "רביעייה ✓" : "ללא רביעייה"}
                  </div>}
                  {!locked && <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">פתוח</span>}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
