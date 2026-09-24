"use client";

import { useState, useTransition } from "react";
import { TeamBadge } from "@/components/TeamBadge";
import { zoneForPosition } from "@/lib/scoring";
import type { Team } from "@/lib/types";
import { saveTablePrediction } from "./actions";

export function TableOrderForm({
  seasonId,
  initialOrder,
  locked,
  finalPositions,
  pointsPerHit,
}: {
  seasonId: string;
  initialOrder: Team[];
  locked: boolean;
  finalPositions: Record<string, number | null>;
  pointsPerHit: number;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [status, setStatus] = useState<{ ok?: boolean; error?: string }>({});
  const [pending, startTransition] = useTransition();
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || from === to) return;
    setStatus({});
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrder(next);
  };

  const submit = () =>
    startTransition(async () => {
      setStatus(await saveTablePrediction(seasonId, order.map((t) => t.id)));
    });

  const hasFinal = Object.values(finalPositions).some((p) => p != null);

  return (
    <div className="space-y-3">
      <ol className="space-y-1.5">
        {order.map((team, i) => {
          const pos = i + 1;
          const zone = zoneForPosition(pos);
          const hit = hasFinal && finalPositions[team.id] === pos;
          return (
            <li
              key={team.id}
              draggable={!locked}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex != null) move(dragIndex, i);
                setDragIndex(null);
              }}
              className={`flex items-center gap-3 rounded-xl border bg-card px-3 py-2 ${
                hit ? "border-emerald-500" : "border-border"
              } ${!locked ? "cursor-grab" : ""}`}
            >
              <span className={`h-8 w-1.5 shrink-0 rounded-full ${zone?.className ?? "bg-transparent"}`} />
              <span className="w-6 text-center font-bold tabular-nums">{pos}</span>
              <TeamBadge team={team} className="flex-1" />
              {hasFinal && (
                <span className={`text-xs ${hit ? "font-bold text-emerald-600" : "text-muted"}`}>
                  {hit ? `+${pointsPerHit}` : `בפועל: ${finalPositions[team.id] ?? "—"}`}
                </span>
              )}
              {!locked && (
                <span className="flex gap-1">
                  <button
                    type="button"
                    className="btn-secondary h-8 w-8 p-0"
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    aria-label="למעלה"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="btn-secondary h-8 w-8 p-0"
                    onClick={() => move(i, i + 1)}
                    disabled={i === order.length - 1}
                    aria-label="למטה"
                  >
                    ▼
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {!locked && (
        <div className="sticky bottom-3 flex items-center gap-3">
          <button className="btn flex-1 shadow-lg" onClick={submit} disabled={pending}>
            {pending ? "שומר..." : "שמירת הטבלה"}
          </button>
          {status.ok && <span className="text-sm text-emerald-600">נשמר ✓</span>}
          {status.error && <span className="text-sm text-rose-600">{status.error}</span>}
        </div>
      )}
    </div>
  );
}
