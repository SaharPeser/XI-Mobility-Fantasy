import { notFound } from "next/navigation";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { NoSeason } from "@/components/NoSeason";
import { getActiveSeason, requireUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { LeaderboardRow } from "@/lib/types";
import { deleteLeague, leaveLeague } from "../actions";
import { CopyInvite } from "./CopyInvite";

export default async function LeaguePage({ params }: PageProps<"/leagues/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/leagues/${id}`);
  const supabase = await createClient();
  const { data: league } = await supabase.from("leagues").select("*").eq("id", id).maybeSingle();
  if (!league) notFound();

  const season = await getActiveSeason();
  const { data } = season
    ? await supabase.rpc("get_leaderboard", { p_season_id: season.id, p_league_id: id })
    : { data: [] };
  const isOwner = league.owner_id === user.id;

  return (
    <div className="space-y-4">
      <h1 className="page-title mb-0">{league.name}</h1>
      <CopyInvite code={league.invite_code} />
      {season ? <LeaderboardTable rows={(data ?? []) as LeaderboardRow[]} meId={user.id} /> : <NoSeason />}
      <form action={isOwner ? deleteLeague.bind(null, id) : leaveLeague.bind(null, id)} className="text-left">
        <button className="btn-danger">{isOwner ? "מחיקת הליגה" : "יציאה מהליגה"}</button>
      </form>
    </div>
  );
}
