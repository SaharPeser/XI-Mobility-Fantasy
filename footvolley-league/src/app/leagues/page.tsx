import Link from "next/link";
import { requireUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { LeagueForms } from "./LeagueForms";

export default async function LeaguesPage() {
  const user = await requireUser("/leagues");
  const supabase = await createClient();
  const { data: leagues } = await supabase
    .from("leagues")
    .select("id, name, owner_id, league_members(count)")
    .order("created_at");

  return (
    <div className="space-y-6">
      <h1 className="page-title">ליגות חברים</h1>
      <LeagueForms />
      <section>
        <h2 className="mb-2 text-lg font-bold">הליגות שלי</h2>
        {!leagues?.length ? (
          <div className="card text-muted">עוד לא הצטרפתם לאף ליגה. צרו ליגה ושתפו את הקוד עם החברים!</div>
        ) : (
          <ul className="space-y-2">
            {leagues.map((l) => (
              <li key={l.id}>
                <Link href={`/leagues/${l.id}`} className="card flex items-center justify-between hover:border-accent">
                  <span className="font-bold">{l.name}</span>
                  <span className="text-sm text-muted">
                    {(l.league_members as unknown as { count: number }[])[0]?.count ?? 0} משתתפים
                    {l.owner_id === user.id && " · מנהל/ת"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
