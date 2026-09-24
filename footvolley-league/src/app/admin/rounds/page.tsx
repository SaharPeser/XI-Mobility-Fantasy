import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { NoSeason } from "@/components/NoSeason";
import { getActiveSeason } from "@/lib/data";
import { toLocalInput } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Round } from "@/lib/types";
import { createRegularRounds, createRound, deleteRound, updateRound } from "../actions";

const R = <input type="hidden" name="return_to" value="/admin/rounds" />;

const STAGES: Record<Round["stage"], string> = {
  regular: "עונה סדירה",
  playoff: "פלייאוף (3-6, 4-5)",
  final_four: "פיינל פור",
  relegation: "הצלבות / ירידה",
};

function StageSelect({ value }: { value?: string }) {
  return (
    <select className="input" name="stage" defaultValue={value ?? "regular"}>
      {Object.entries(STAGES).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </select>
  );
}

export default async function AdminRoundsPage() {
  const season = await getActiveSeason();
  if (!season) return <NoSeason />;
  const supabase = await createClient();
  const { data } = await supabase
    .from("rounds")
    .select("*, matches(count)")
    .eq("season_id", season.id)
    .order("number");
  const rounds = (data ?? []) as (Round & { matches: { count: number }[] })[];
  const nextNumber = (rounds.at(-1)?.number ?? 0) + 1;

  return (
    <div className="space-y-6">
      <h1 className="page-title mb-0">מחזורים ומשחקים</h1>
      <p className="text-sm text-muted">כל השעות לפי שעון ישראל. &quot;נעילה&quot; = המועד האחרון לשינוי ניחושים ורביעייה.</p>

      {!rounds.length && (
        <form action={createRegularRounds} className="card space-y-3">
          {R}
          <input type="hidden" name="season_id" value={season.id} />
          <h2 className="font-bold">יצירה מהירה של מחזורי העונה הסדירה</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label>
              <span className="label">מספר מחזורים</span>
              <input className="input" type="number" name="count" defaultValue={11} min={1} max={40} />
            </label>
            <label>
              <span className="label">נעילת מחזור 1</span>
              <input className="input" type="datetime-local" name="first_deadline" required />
            </label>
            <label>
              <span className="label">כל כמה ימים</span>
              <input className="input" type="number" name="every_days" defaultValue={7} min={1} />
            </label>
          </div>
          <button className="btn">יצירת מחזורים</button>
          <p className="text-xs text-muted">אפשר לערוך כל מועד בנפרד אחרי היצירה.</p>
        </form>
      )}

      <div className="space-y-2">
        {rounds.map((r) => (
          <form key={r.id} action={updateRound} className="card grid gap-2 sm:grid-cols-[4rem_1fr_1fr_1fr_auto] sm:items-end">
            {R}
            <input type="hidden" name="id" value={r.id} />
            <label>
              <span className="label">מס&apos;</span>
              <input className="input" type="number" name="number" defaultValue={r.number} required />
            </label>
            <label>
              <span className="label">שם (לא חובה)</span>
              <input className="input" name="name" defaultValue={r.name ?? ""} placeholder={`מחזור ${r.number}`} />
            </label>
            <label>
              <span className="label">שלב</span>
              <StageSelect value={r.stage} />
            </label>
            <label>
              <span className="label">נעילה</span>
              <input className="input" type="datetime-local" name="deadline" defaultValue={toLocalInput(r.deadline)} required />
            </label>
            <div className="flex gap-1">
              <button className="btn-secondary">שמירה</button>
              <Link href={`/admin/rounds/${r.id}`} className="btn whitespace-nowrap">
                משחקים ({r.matches[0]?.count ?? 0})
              </Link>
              <ConfirmButton
                formAction={deleteRound}
                className="btn-danger"
                message="למחוק את המחזור? כל המשחקים והניחושים שלו יימחקו."
              >
                ✕
              </ConfirmButton>
            </div>
          </form>
        ))}
      </div>

      <form action={createRound} className="card grid gap-2 sm:grid-cols-[4rem_1fr_1fr_1fr_auto] sm:items-end">
        {R}
        <input type="hidden" name="season_id" value={season.id} />
        <label>
          <span className="label">מס&apos;</span>
          <input className="input" type="number" name="number" defaultValue={nextNumber} required />
        </label>
        <label>
          <span className="label">שם (לא חובה)</span>
          <input className="input" name="name" />
        </label>
        <label>
          <span className="label">שלב</span>
          <StageSelect />
        </label>
        <label>
          <span className="label">נעילה</span>
          <input className="input" type="datetime-local" name="deadline" required />
        </label>
        <button className="btn">הוספת מחזור</button>
      </form>
    </div>
  );
}
