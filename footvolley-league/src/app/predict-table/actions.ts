"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveTablePrediction(seasonId: string, teamIds: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_table_prediction", { p_season_id: seasonId, p_team_ids: teamIds });
  if (error) return { error: error.message };
  revalidatePath("/predict-table");
  return { ok: true };
}
