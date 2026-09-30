"use client";

import { useState, useTransition } from "react";
import { SponsorLogo } from "@/components/Sponsor";
import { TeamBadge } from "@/components/TeamBadge";
import { VsDivider } from "@/components/VsDivider";
import { formatDateTime } from "@/lib/format";
import { isValidSetScore, SCORE_RULE_TEXT } from "@/lib/scoring";
import type { Match, Team } from "@/lib/types";
import { saveMatchPredictions } from "../actions";

type Row = { home: string; away: string };

export function PredictionsForm({
  matches,
  teams,
  initial,
}: {
  matches: Match[];
  teams: Record<string, Team>;
  initial: Record<string, { home_score: number; away_score: number }>;
}) {
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(
      matches.map((m) => [
        m.id,
        {
          home: initial[m.id]?.home_score?.toString() ?? "",
          away: initial[m.id]?.away_score?.toString() ?? "",
        },
      ]),
    ),
  );
  const [status, setStatus] = useState<{ ok?: boolean; error?: string }>({});
  const [pending, startTransition] = useTransition();

  const set = (id: string, side: keyof Row, value: string) => {
    setStatus({});
    setRows((r) => ({
      ...r,
      [id]: { ...r[id], [side]: value.replace(/\D/g, "").slice(0, 2) },
    }));
  };

  /** מילוי מהיר: לחיצה על קבוצה = ניצחון 21:x */
  const quickWin = (id: string, side: keyof Row) => {
    const other = side === "home" ? "away" : "home";
    const current = rows[id];
    const loser = Number(current[other]);
    const loserScore =
      current[other] !== "" && loser <= 19 ? current[other] : "15";
    setRows((r) => ({
      ...r,
      [id]: { ...r[id], [side]: "21", [other]: loserScore },
    }));
  };

  const problem = (row: Row) => {
    if (row.home === "" && row.away === "") return null;
    if (row.home === "" || row.away === "") return "חסרה תוצאה";
    return isValidSetScore(Number(row.home), Number(row.away))
      ? null
      : "תוצאה לא חוקית";
  };

  const hasErrors = matches.some((m) => problem(rows[m.id]));

  const submit = () =>
    startTransition(async () => {
      const res = await saveMatchPredictions(
        matches.map((m) => ({
          matchId: m.id,
          home: rows[m.id].home === "" ? null : Number(rows[m.id].home),
          away: rows[m.id].away === "" ? null : Number(rows[m.id].away),
        })),
      );
      setStatus(res);
    });

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        {SCORE_RULE_TEXT}. לחיצה על שם קבוצה ממלאת ניצחון מהיר.
      </p>
      {matches.map((m) => {
        const err = problem(rows[m.id]);
        return (
          <div key={m.id} className="brand-card brand-stripes">
            <div className="mb-3 flex items-center justify-between gap-2 text-xs text-white/60">
              <span>{formatDateTime(m.starts_at)}</span>
              <SponsorLogo className="h-3 opacity-80" />
            </div>
            <div className="space-y-2">
              {(["home", "away"] as const).map((side) => {
                const team =
                  teams[side === "home" ? m.home_team_id : m.away_team_id];
                return (
                  <div key={side}>
                    {side === "away" && <VsDivider />}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => quickWin(m.id, side)}
                        className="min-w-0 flex-1 text-right"
                        title="ניצחון מהיר"
                      >
                        <TeamBadge
                          team={team}
                          className="font-bold text-white"
                        />
                      </button>
                      <input
                        aria-label={`נקודות ${team?.name ?? ""}`}
                        className="score-input-dark"
                        inputMode="numeric"
                        value={rows[m.id][side]}
                        onChange={(e) => set(m.id, side, e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {err && (
              <p className="mt-2 text-center text-xs font-medium text-rose-300">
                {err}
              </p>
            )}
          </div>
        );
      })}
      <div className="sticky bottom-3 flex items-center gap-3">
        <button
          className="btn-brand flex-1 py-2.5 shadow-lg ring-2 ring-brand-dark disabled:opacity-50"
          onClick={submit}
          disabled={pending || hasErrors}
        >
          {pending ? "שומר..." : "שמירת ניחושים"}
        </button>
        {status.ok && <span className="text-sm text-emerald-600">נשמר ✓</span>}
        {status.error && (
          <span className="text-sm text-rose-600">{status.error}</span>
        )}
      </div>
    </div>
  );
}

