import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // מרענן את הטוקן במידת הצורך
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  // כל האתר רק למשתמשים מחוברים. פתוחים בלי התחברות: כניסה/הרשמה, אימות מייל, והתקנון (כדי לקרוא אותו לפני ההרשמה)
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
  if (!isLoggedIn && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    // חוזרים בדיוק לאותו עמוד אחרי ההתחברות (למשל קישור הזמנה לליגה)
    if (path !== "/") url.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // משתמש מחובר שנכנס לעמוד ההתחברות עובר ישר לאתר
  if (isLoggedIn && path === "/login") {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get("next");
    url.pathname = next && next.startsWith("/") && !next.startsWith("//") ? next.split("?")[0] : "/";
    url.search = next?.includes("?") ? `?${next.split("?")[1]}` : "";
    return NextResponse.redirect(url);
  }

  return response;
}

const PUBLIC_PATHS = ["/login", "/auth", "/terms"];
