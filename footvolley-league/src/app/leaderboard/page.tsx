import { LeaderboardTable } from "@/components/LeaderboardTable";
import { NoSeason } from "@/components/NoSeason";
import { getActiveSeason, getSessionUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { LeaderboardRow } from "@/lib/types";

export default async function LeaderboardPage() {
  const season = await getActiveSeason();
  if (!season) return <NoSeason />;
  const user = await getSessionUser();
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_leaderboard", { p_season_id: season.id });

  return (
    <div>
      <h1 className="page-title">הדירוג הכללי – {season.name}</h1>
      <div className="card mb-4 border-sand text-sm">
        🏆 פרסים לשלושת המקומות הראשונים בדירוג הכללי בסוף העונה!
      </div>
      <LeaderboardTable rows={(data ?? []) as LeaderboardRow[]} meId={user?.id} />
    </div>
  );
}
