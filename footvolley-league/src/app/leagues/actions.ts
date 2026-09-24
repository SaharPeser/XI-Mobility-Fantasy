"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LeagueState = { error?: string };

export async function createLeague(_: LeagueState, formData: FormData): Promise<LeagueState> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 40) return { error: "שם הליגה צריך להיות 2–40 תווים" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר" };
  const { data, error } = await supabase.from("leagues").insert({ name, owner_id: user.id }).select("id").single();
  if (error) return { error: "יצירת הליגה נכשלה" };
  revalidatePath("/leagues");
  redirect(`/leagues/${data.id}`);
}

export async function joinLeague(_: LeagueState, formData: FormData): Promise<LeagueState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "הזינו קוד" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_league", { p_code: code });
  if (error) return { error: error.message };
  revalidatePath("/leagues");
  redirect(`/leagues/${data}`);
}

export async function leaveLeague(leagueId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("league_members").delete().eq("league_id", leagueId).eq("user_id", user.id);
  revalidatePath("/leagues");
  redirect("/leagues");
}

export async function deleteLeague(leagueId: string) {
  const supabase = await createClient();
  await supabase.from("leagues").delete().eq("id", leagueId);
  revalidatePath("/leagues");
  redirect("/leagues");
}
