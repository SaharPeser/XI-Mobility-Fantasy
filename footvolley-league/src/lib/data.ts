import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Season } from "./types";

export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  // getClaims מאמת את הטוקן מקומית (מפתחות ES256 של הפרויקט), בלי קריאה נוספת לשרת ההתחברות
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, is_admin")
    .eq("id", claims.sub)
    .single();
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    displayName: profile?.display_name ?? "",
    isAdmin: !!profile?.is_admin,
  };
});

export async function requireUser(next = "/") {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (!user.isAdmin) redirect("/");
  return user;
}

export const getActiveSeason = cache(async (): Promise<Season | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("seasons").select("*").eq("is_active", true).maybeSingle();
  return data as Season | null;
});
