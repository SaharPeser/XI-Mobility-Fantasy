import type { LeaderboardRow } from "@/lib/types";

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardTable({ rows, meId }: { rows: LeaderboardRow[]; meId?: string }) {
  if (!rows.length) return <div className="card text-muted">עוד אין משתתפים.</div>;
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-muted">
          <tr>
            <th className="p-3 text-right">#</th>
            <th className="p-3 text-right">משתתף</th>
            <th className="hidden p-3 sm:table-cell">משחקים</th>
            <th className="hidden p-3 sm:table-cell">טבלה</th>
            <th className="hidden p-3 sm:table-cell">רביעייה</th>
            <th className="p-3">סה&quot;כ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.user_id}
              className={`border-b border-border last:border-0 ${r.user_id === meId ? "bg-accent-soft" : ""}`}
            >
              <td className="p-3 font-bold tabular-nums">{MEDALS[r.rank - 1] ?? r.rank}</td>
              <td className="p-3 font-medium">{r.display_name}</td>
              <td className="hidden p-3 text-center tabular-nums sm:table-cell">{Number(r.match_points)}</td>
              <td className="hidden p-3 text-center tabular-nums sm:table-cell">{Number(r.table_points)}</td>
              <td className="hidden p-3 text-center tabular-nums sm:table-cell">{Number(r.quad_points)}</td>
              <td className="p-3 text-center text-base font-bold tabular-nums">{Number(r.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
