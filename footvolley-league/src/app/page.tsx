import Link from "next/link";
import { NoSeason } from "@/components/NoSeason";
import { getActiveSeason, getSessionUser } from "@/lib/data";
import { formatDateTime, isPast } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { LeaderboardRow, Round } from "@/lib/types";

export default async function Home() {
  const season = await getActiveSeason();
  if (!season) return <NoSeason />;
  const user = await getSessionUser();
  const supabase = await createClient();

  const [{ data: openRound }, { data: board }, tableCount] = await Promise.all([
    supabase
      .from("rounds")
      .select("*")
      .eq("season_id", season.id)
      .gt("deadline", new Date().toISOString())
      .order("deadline")
      .limit(1)
      .maybeSingle<Round>(),
    supabase.rpc("get_leaderboard", { p_season_id: season.id }),
    user
      ? supabase
          .from("table_predictions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("season_id", season.id)
          .then((r) => r.count ?? 0)
      : Promise.resolve(0),
  ]);

  const rows = (board ?? []) as LeaderboardRow[];
  const me = user ? rows.find((r) => r.user_id === user.id) : undefined;
  const tableOpen = !isPast(season.table_deadline);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-gradient-to-l from-accent to-cyan-900 p-6 text-white shadow">
        <p className="text-sm opacity-80">{season.name}</p>
        <h1 className="mt-1 text-3xl font-bold">משחק הניחושים של ליגת הפוצ&apos;יוולי</h1>
        {user ? (
          me && (
            <p className="mt-3 text-lg">
              {user.displayName}, את/ה במקום <b>{me.rank}</b> עם <b>{Number(me.total)}</b> נקודות
            </p>
          )
        ) : (
          <Link href="/login" className="mt-4 inline-block rounded-xl bg-white px-5 py-2 font-bold text-cyan-900">
            הצטרפו למשחק
          </Link>
        )}
      </section>

      {openRound && (
        <Link href={`/rounds/${openRound.number}`} className="card block hover:border-accent">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted">המחזור הפתוח הבא</div>
              <div className="text-xl font-bold">{openRound.name || `מחזור ${openRound.number}`}</div>
              <div className="text-sm text-muted">נועל ב-{formatDateTime(openRound.deadline)}</div>
            </div>
            <span className="btn">לניחושים ←</span>
          </div>
        </Link>
      )}

      {user && tableOpen && (
        <Link href="/predict-table" className="card block border-sand hover:border-accent">
          <div className="font-bold">ניחוש הטבלה {tableCount ? "✓ נשמר" : "– עוד לא מילאתם!"}</div>
          <div className="text-sm text-muted">
            {season.table_deadline ? `אפשר לשנות עד ${formatDateTime(season.table_deadline)}` : "סדרו את הטבלה הצפויה"}
          </div>
        </Link>
      )}

      <section className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">🏆 המובילים</h2>
          <Link href="/leaderboard" className="text-sm text-accent">
            לדירוג המלא
          </Link>
        </div>
        {rows.length ? (
          <ol className="space-y-1">
            {rows.slice(0, 3).map((r) => (
              <li key={r.user_id} className="flex justify-between">
                <span>
                  {["🥇", "🥈", "🥉"][r.rank - 1] ?? r.rank} {r.display_name}
                </span>
                <b className="tabular-nums">{Number(r.total)}</b>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted">עוד אין משתתפים.</p>
        )}
        <p className="mt-3 text-xs text-muted">פרסים לשלושת המקומות הראשונים בדירוג הכללי!</p>
      </section>

      <section className="card text-sm">
        <h2 className="mb-2 text-lg font-bold">איך צוברים נקודות?</h2>
        <ul className="list-inside list-disc space-y-1">
          <li>
            ניחוש המנצחת במשחק: <b>{season.pts_winner}</b> נק&apos;
          </li>
          <li>
            תוצאה מדויקת: <b>{season.pts_exact}</b> נק&apos;
          </li>
          <li>
            כל קבוצה במיקום הנכון בטבלת סוף העונה הסדירה: <b>{season.pts_table_position}</b> נק&apos;
          </li>
          <li>
            רביעיית המחזור: ניקוד השחקן × <b>{season.quad_multiplier}</b>, והקפטן × <b>{season.captain_multiplier}</b>
          </li>
        </ul>
      </section>
    </div>
  );
}
