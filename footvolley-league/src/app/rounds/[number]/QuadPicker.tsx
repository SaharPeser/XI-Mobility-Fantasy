"use client";

import { useMemo, useState, useTransition } from "react";
import type { Player, Team } from "@/lib/types";
import { saveQuad } from "../actions";

export function QuadPicker({
  roundId,
  players,
  teams,
  initialIds,
  initialCaptain,
  quadMultiplier,
  captainMultiplier,
}: {
  roundId: string;
  players: Player[];
  teams: Record<string, Team>;
  initialIds: string[];
  initialCaptain: string | null;
  quadMultiplier: number;
  captainMultiplier: number;
}) {
  const [selected, setSelected] = useState<string[]>(initialIds);
  const [captain, setCaptain] = useState<string | null>(initialCaptain);
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState<{ ok?: boolean; error?: string }>({});
  const [pending, startTransition] = useTransition();

  const byId = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);
  const grouped = useMemo(() => {
    const q = filter.trim();
    const groups = new Map<string, Player[]>();
    for (const p of players) {
      if (q && !p.name.includes(q) && !teams[p.team_id]?.name.includes(q)) continue;
      groups.set(p.team_id, [...(groups.get(p.team_id) ?? []), p]);
    }
    return [...groups.entries()].sort((a, b) =>
      (teams[a[0]]?.name ?? "").localeCompare(teams[b[0]]?.name ?? "", "he"),
    );
  }, [players, teams, filter]);

  const toggle = (id: string) => {
    setStatus({});
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
      if (captain === id) setCaptain(null);
    } else if (selected.length < 4) {
      setSelected([...selected, id]);
      if (!captain) setCaptain(id);
    }
  };

  const submit = () =>
    startTransition(async () => {
      if (!captain) return;
      setStatus(await saveQuad(roundId, selected, captain));
    });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        בחרו 4 שחקנים שלדעתכם יקבלו את הניקוד הגבוה במחזור. כל שחקן ברביעייה מקבל פי {quadMultiplier} מהניקוד שלו,
        והקפטן – פי {captainMultiplier}.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => {
          const p = byId[selected[i]];
          return (
            <div
              key={i}
              className={`flex min-h-20 flex-col items-center justify-center rounded-xl border-2 border-dashed p-2 text-center text-sm ${
                p ? "border-accent bg-accent-soft" : "border-border text-muted"
              }`}
            >
              {p ? (
                <>
                  <span className="font-bold">{p.name}</span>
                  <span className="text-xs text-muted">{teams[p.team_id]?.name}</span>
                  <button
                    type="button"
                    onClick={() => setCaptain(p.id)}
                    className={`mt-1 rounded-full px-2 py-0.5 text-xs ${
                      captain === p.id ? "bg-brand font-bold text-brand-dark" : "bg-card text-muted"
                    }`}
                  >
                    {captain === p.id ? "קפטן ©" : "הפוך לקפטן"}
                  </button>
                </>
              ) : (
                `שחקן ${i + 1}`
              )}
            </div>
          );
        })}
      </div>

      <input
        className="input"
        placeholder="חיפוש שחקן או קבוצה"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="max-h-96 space-y-3 overflow-y-auto">
        {grouped.map(([teamId, list]) => (
          <div key={teamId}>
            <div className="mb-1 text-xs font-bold text-muted">{teams[teamId]?.name}</div>
            <div className="flex flex-wrap gap-2">
              {list.map((p) => {
                const on = selected.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    disabled={!on && selected.length >= 4}
                    className={`rounded-full border px-3 py-1 text-sm transition disabled:opacity-40 ${
                      on ? "border-accent bg-accent text-accent-contrast" : "border-border bg-card hover:border-accent"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {!grouped.length && <p className="text-sm text-muted">לא נמצאו שחקנים.</p>}
      </div>

      <div className="flex items-center gap-3">
        <button className="btn flex-1" onClick={submit} disabled={pending || selected.length !== 4 || !captain}>
          {pending ? "שומר..." : "שמירת רביעייה"}
        </button>
        {status.ok && <span className="text-sm text-emerald-600">נשמר ✓</span>}
        {status.error && <span className="text-sm text-rose-600">{status.error}</span>}
      </div>
    </div>
  );
}
