"use server";

import { revalidatePath } from "next/cache";
import { isValidSetScore } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";

export type SaveResult = { ok?: boolean; error?: string };

export async function saveMatchPredictions(
  entries: { matchId: string; home: number | null; away: number | null }[],
): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר" };

  const toUpsert = [];
  const toDelete: string[] = [];
  for (const e of entries) {
    if (e.home == null && e.away == null) {
      toDelete.push(e.matchId);
      continue;
    }
    if (e.home == null || e.away == null || !isValidSetScore(e.home, e.away)) {
      return { error: `תוצאה לא חוקית: ${e.home ?? "?"}:${e.away ?? "?"}` };
    }
    toUpsert.push({ user_id: user.id, match_id: e.matchId, home_score: e.home, away_score: e.away, updated_at: new Date().toISOString() });
  }

  if (toUpsert.length) {
    const { error } = await supabase.from("match_predictions").upsert(toUpsert);
    if (error) return { error: "השמירה נכשלה – ייתכן שהמחזור כבר נעול" };
  }
  if (toDelete.length) {
    await supabase.from("match_predictions").delete().eq("user_id", user.id).in("match_id", toDelete);
  }
  revalidatePath("/rounds", "layout");
  return { ok: true };
}

export async function saveQuad(roundId: string, playerIds: string[], captainId: string): Promise<SaveResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_quad", {
    p_round_id: roundId,
    p_player_ids: playerIds,
    p_captain_id: captainId,
  });
  if (error) return { error: error.message };
  revalidatePath("/rounds", "layout");
  return { ok: true };
}
