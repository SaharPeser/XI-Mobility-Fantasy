import { NoSeason } from "@/components/NoSeason";
import { getActiveSeason, getSessionUser } from "@/lib/data";
import { formatDateTime, isPast } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Round } from "@/lib/types";
import { RoundDeck, type RoundCard } from "./RoundDeck";

export default async function RoundsPage() {
  const season = await getActiveSeason();
  if (!season) return <NoSeason />;
  const user = await getSessionUser();
  const supabase = await createClient();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*, matches(id, home_score)")
    .eq("season_id", season.id)
    .order("number");

  const predicted = new Map<string, number>();
  const squad = new Map<string, number>();
  if (user) {
    const [{ data: preds }, { data: picks }] = await Promise.all([
      supabase.from("match_predictions").select("match_id, matches!inner(round_id)").eq("user_id", user.id),
      supabase.from("quad_picks").select("round_id").eq("user_id", user.id),
    ]);
    for (const p of preds ?? []) {
      const rid = (p.matches as unknown as { round_id: string }).round_id;
      predicted.set(rid, (predicted.get(rid) ?? 0) + 1);
    }
    for (const q of picks ?? []) squad.set(q.round_id, (squad.get(q.round_id) ?? 0) + 1);
  }

  const cards: RoundCard[] = ((rounds ?? []) as (Round & { matches: { id: string; home_score: number | null }[] })[]).map(
    (r) => ({
      id: r.id,
      number: r.number,
      name: r.name,
      deadlineText: formatDateTime(r.deadline),
      locked: isPast(r.deadline),
      matchCount: r.matches.length,
      playedCount: r.matches.filter((m) => m.home_score != null).length,
      predicted: user ? (predicted.get(r.id) ?? 0) : null,
      squadPicked: user ? (squad.get(r.id) ?? 0) : null,
      squadSize: season.squad_size ?? 6,
    }),
  );

  return (
    <div>
      <h1 className="page-title">מחזורים</h1>
      <RoundDeck rounds={cards} seasonName={season.name} />
    </div>
  );
}
