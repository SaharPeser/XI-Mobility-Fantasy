"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/data";
import { fromLocalInput } from "@/lib/format";
import { isValidSetScore } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";

// ---------- עזרים ----------

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  return v === "" ? null : Number(v);
}

async function admin() {
  await requireAdmin();
  return createClient();
}

/** מחזיר לדף ממנו נשלח הטופס, עם הודעת שגיאה אם יש */
function done(fd: FormData, error?: { message: string } | string | null): void {
  const to = str(fd, "return_to") || "/admin";
  revalidatePath("/", "layout");
  if (error) {
    const msg = typeof error === "string" ? error : error.message;
    redirect(`${to}?error=${encodeURIComponent(msg)}`);
  }
  redirect(`${to}?ok=1`);
}

// ---------- עונה ----------

export async function createSeason(fd: FormData) {
  const supabase = await admin();
  const name = str(fd, "name");
  if (!name) return done(fd, "יש להזין שם עונה");
  const { count } = await supabase.from("seasons").select("*", { count: "exact", head: true });
  const { error } = await supabase.from("seasons").insert({ name, is_active: !count });
  done(fd, error);
}

export async function updateSeason(fd: FormData) {
  const supabase = await admin();
  const id = str(fd, "id");
  const { error } = await supabase
    .from("seasons")
    .update({
      name: str(fd, "name"),
      table_deadline: fromLocalInput(str(fd, "table_deadline")),
      pts_winner: num(fd, "pts_winner") ?? 0,
      pts_exact: num(fd, "pts_exact") ?? 0,
      pts_table_position: num(fd, "pts_table_position") ?? 0,
      quad_multiplier: num(fd, "quad_multiplier") ?? 1,
      captain_multiplier: num(fd, "captain_multiplier") ?? 1,
      prize_1: str(fd, "prize_1") || null,
      prize_2: str(fd, "prize_2") || null,
      prize_3: str(fd, "prize_3") || null,
    })
    .eq("id", id);
  done(fd, error?.message.includes("prize_") ? "יש להריץ ב-Supabase את קובץ ה-SQL של הפרסים" : error);
}

export async function activateSeason(fd: FormData) {
  const supabase = await admin();
  await supabase.from("seasons").update({ is_active: false }).eq("is_active", true);
  const { error } = await supabase.from("seasons").update({ is_active: true }).eq("id", str(fd, "id"));
  done(fd, error);
}

// ---------- קבוצות ושחקנים ----------

export async function createTeam(fd: FormData) {
  const supabase = await admin();
  const name = str(fd, "name");
  if (!name) return done(fd, "יש להזין שם קבוצה");
  const { error } = await supabase
    .from("teams")
    .insert({ season_id: str(fd, "season_id"), name, logo_url: str(fd, "logo_url") || null });
  done(fd, error?.code === "23505" ? "כבר קיימת קבוצה בשם הזה" : error);
}

export async function updateTeam(fd: FormData) {
  const supabase = await admin();
  const { error } = await supabase
    .from("teams")
    .update({ name: str(fd, "name"), logo_url: str(fd, "logo_url") || null })
    .eq("id", str(fd, "id"));
  done(fd, error);
}

export async function deleteTeam(fd: FormData) {
  const supabase = await admin();
  const { error } = await supabase.from("teams").delete().eq("id", str(fd, "id"));
  done(fd, error);
}

export async function addPlayers(fd: FormData) {
  const supabase = await admin();
  const teamId = str(fd, "team_id");
  const names = str(fd, "names")
    .split(/[\n,]/)
    .map((n) => n.trim())
    .filter(Boolean);
  if (!names.length) return done(fd, "יש להזין לפחות שם אחד");
  const { error } = await supabase.from("players").insert(names.map((name) => ({ team_id: teamId, name })));
  done(fd, error);
}

export async function updatePlayer(fd: FormData) {
  const supabase = await admin();
  const { error } = await supabase
    .from("players")
    .update({ name: str(fd, "name"), is_active: fd.get("is_active") === "on" })
    .eq("id", str(fd, "id"));
  done(fd, error);
}

export async function deletePlayer(fd: FormData) {
  const supabase = await admin();
  const { error } = await supabase.from("players").delete().eq("id", str(fd, "id"));
  done(fd, error);
}

// ---------- מחזורים ----------

export async function createRound(fd: FormData) {
  const supabase = await admin();
  const deadline = fromLocalInput(str(fd, "deadline"));
  if (!deadline) return done(fd, "יש להזין מועד נעילה");
  const { error } = await supabase.from("rounds").insert({
    season_id: str(fd, "season_id"),
    number: num(fd, "number"),
    name: str(fd, "name") || null,
    stage: str(fd, "stage") || "regular",
    deadline,
  });
  done(fd, error?.code === "23505" ? "מחזור עם המספר הזה כבר קיים" : error);
}

/** יצירת מחזורי העונה הסדירה בבת אחת, אחד בכל שבוע */
export async function createRegularRounds(fd: FormData) {
  const supabase = await admin();
  const seasonId = str(fd, "season_id");
  const count = num(fd, "count") ?? 11;
  const first = fromLocalInput(str(fd, "first_deadline"));
  const everyDays = num(fd, "every_days") ?? 7;
  if (!first) return done(fd, "יש להזין מועד נעילה למחזור הראשון");
  const { data: existing } = await supabase.from("rounds").select("number").eq("season_id", seasonId);
  const taken = new Set((existing ?? []).map((r) => r.number));
  const rows = Array.from({ length: count }, (_, i) => ({
    season_id: seasonId,
    number: i + 1,
    stage: "regular",
    deadline: new Date(new Date(first).getTime() + i * everyDays * 86400000).toISOString(),
  })).filter((r) => !taken.has(r.number));
  const { error } = rows.length ? await supabase.from("rounds").insert(rows) : { error: null };
  done(fd, error);
}

export async function updateRound(fd: FormData) {
  const supabase = await admin();
  const { error } = await supabase
    .from("rounds")
    .update({
      number: num(fd, "number"),
      name: str(fd, "name") || null,
      stage: str(fd, "stage") || "regular",
      deadline: fromLocalInput(str(fd, "deadline")),
    })
    .eq("id", str(fd, "id"));
  done(fd, error);
}

export async function deleteRound(fd: FormData) {
  const supabase = await admin();
  const { error } = await supabase.from("rounds").delete().eq("id", str(fd, "id"));
  done(fd, error);
}

// ---------- משחקים ----------

function scoreFields(fd: FormData) {
  const home = num(fd, "home_score");
  const away = num(fd, "away_score");
  if (home == null && away == null) return { value: { home_score: null, away_score: null } };
  if (home == null || away == null || !isValidSetScore(home, away)) return { error: `תוצאה לא חוקית: ${home}:${away}` };
  return { value: { home_score: home, away_score: away } };
}

export async function createMatch(fd: FormData) {
  const supabase = await admin();
  const home = str(fd, "home_team_id");
  const away = str(fd, "away_team_id");
  if (!home || !away || home === away) return done(fd, "יש לבחור שתי קבוצות שונות");
  const { error } = await supabase.from("matches").insert({
    round_id: str(fd, "round_id"),
    home_team_id: home,
    away_team_id: away,
    starts_at: fromLocalInput(str(fd, "starts_at")),
    sort_order: num(fd, "sort_order") ?? 0,
  });
  done(fd, error);
}

export async function updateMatch(fd: FormData) {
  const supabase = await admin();
  const score = scoreFields(fd);
  if (score.error) return done(fd, score.error);
  const home = str(fd, "home_team_id");
  const away = str(fd, "away_team_id");
  if (home === away) return done(fd, "יש לבחור שתי קבוצות שונות");
  const { error } = await supabase
    .from("matches")
    .update({
      home_team_id: home,
      away_team_id: away,
      starts_at: fromLocalInput(str(fd, "starts_at")),
      sort_order: num(fd, "sort_order") ?? 0,
      ...score.value,
    })
    .eq("id", str(fd, "id"));
  done(fd, error);
}

export async function deleteMatch(fd: FormData) {
  const supabase = await admin();
  const { error } = await supabase.from("matches").delete().eq("id", str(fd, "id"));
  done(fd, error);
}

// ---------- ניקוד שחקנים ----------

export async function savePlayerPoints(fd: FormData) {
  const supabase = await admin();
  const roundId = str(fd, "round_id");
  const upserts: { player_id: string; round_id: string; points: number }[] = [];
  const cleared: string[] = [];
  for (const [key, value] of fd.entries()) {
    if (!key.startsWith("p_")) continue;
    const playerId = key.slice(2);
    const v = String(value).trim();
    if (v === "") cleared.push(playerId);
    else upserts.push({ player_id: playerId, round_id: roundId, points: Number(v) });
  }
  if (upserts.some((u) => Number.isNaN(u.points))) return done(fd, "ניקוד חייב להיות מספר");
  const { error } = upserts.length ? await supabase.from("player_round_points").upsert(upserts) : { error: null };
  if (error) return done(fd, error);
  if (cleared.length) {
    await supabase.from("player_round_points").delete().eq("round_id", roundId).in("player_id", cleared);
  }
  done(fd);
}

// ---------- דירוג סופי ----------

export async function saveFinalStandings(fd: FormData) {
  const supabase = await admin();
  const seasonId = str(fd, "season_id");
  const entries: { id: string; pos: number | null }[] = [];
  for (const [key, value] of fd.entries()) {
    if (!key.startsWith("t_")) continue;
    entries.push({ id: key.slice(2), pos: value === "" ? null : Number(value) });
  }
  const positions = entries.map((e) => e.pos).filter((p) => p != null);
  if (new Set(positions).size !== positions.length) return done(fd, "אותו מיקום נבחר ליותר מקבוצה אחת");

  const { error: clearError } = await supabase.from("teams").update({ final_position: null }).eq("season_id", seasonId);
  if (clearError) return done(fd, clearError);
  for (const e of entries.filter((e) => e.pos != null)) {
    const { error } = await supabase.from("teams").update({ final_position: e.pos }).eq("id", e.id);
    if (error) return done(fd, error);
  }
  done(fd);
}
