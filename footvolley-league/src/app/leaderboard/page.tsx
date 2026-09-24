import { LeaderboardTable } from "@/components/LeaderboardTable";
import { NoSeason } from "@/components/NoSeason";
import { SponsorPrizes } from "@/components/Sponsor";
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
      <div className="mb-4">
        <SponsorPrizes season={season} />
      </div>
      <LeaderboardTable rows={(data ?? []) as LeaderboardRow[]} meId={user?.id} />
    </div>
  );
}
