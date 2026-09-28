"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { Flag } from "@/components/Flag";
import type { Player, Team } from "@/lib/types";
import { saveSquad } from "../actions";

type Props = {
  roundId: string;
  players: Player[];
  teams: Record<string, Team>;
  initialIds: string[];
  initialCaptain: string | null;
  size: number;
  maxBrazilians: number;
  playerMultiplier: number;
  captainMultiplier: number;
  /** תצוגה בלבד (אחרי הנעילה) */
  readOnly?: boolean;
  /** ניקוד המחזור של כל שחקן (בתצוגה אחרי הנעילה) */
  points?: Record<string, number>;
};

/** מיקומי העמדות על המגרש, באחוזים. חצי עליון וחצי תחתון, עם הרשת באמצע */
function slotPositions(n: number): { x: number; y: number }[] {
  const half = (count: number, top: boolean) => {
    const rows: number[] = count <= 3 ? (count === 3 ? [2, 1] : [count]) : [Math.ceil(count / 2), Math.floor(count / 2)];
    const out: { x: number; y: number }[] = [];
    // השורה הראשונה רחוקה מהרשת, השנייה קרובה אליה
    const ys = rows.length === 1 ? [top ? 25 : 75] : top ? [17, 37] : [83, 63];
    rows.forEach((inRow, r) => {
      for (let i = 0; i < inRow; i++) out.push({ x: ((i + 1) * 100) / (inRow + 1), y: ys[r] });
    });
    return out;
  };
  const top = Math.ceil(n / 2);
  return [...half(top, true), ...half(n - top, false)];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
}

export function SandPitch({
  roundId,
  players,
  teams,
  initialIds,
  initialCaptain,
  size,
  maxBrazilians,
  playerMultiplier,
  captainMultiplier,
  readOnly = false,
  points,
}: Props) {
  // מערך באורך size: לכל עמדה שחקן או null
  const [slots, setSlots] = useState<(string | null)[]>(() =>
    Array.from({ length: size }, (_, i) => initialIds[i] ?? null),
  );
  const [captain, setCaptain] = useState<string | null>(initialCaptain);
  const [picking, setPicking] = useState<number | null>(null);
  const [acting, setActing] = useState<number | null>(null);
  const [status, setStatus] = useState<{ ok?: boolean; error?: string }>({});
  const [pending, startTransition] = useTransition();

  const byId = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);
  const positions = useMemo(() => slotPositions(size), [size]);
  const chosen = slots.filter(Boolean) as string[];
  const brazilians = chosen.filter((id) => byId[id]?.nationality === "BR").length;
  const full = chosen.length === size;

  const change = (next: (string | null)[], nextCaptain = captain) => {
    setStatus({});
    setSlots(next);
    setCaptain(nextCaptain);
  };

  const pick = (playerId: string) => {
    if (picking == null) return;
    const next = [...slots];
    next[picking] = playerId;
    change(next, captain ?? playerId);
    setPicking(null);
  };

  const remove = (index: number) => {
    const id = slots[index];
    const next = [...slots];
    next[index] = null;
    const rest = next.filter(Boolean) as string[];
    change(next, captain === id ? (rest[0] ?? null) : captain);
    setActing(null);
  };

  const makeCaptain = (index: number) => {
    change(slots, slots[index]);
    setActing(null);
  };

  const submit = () =>
    startTransition(async () => {
      if (!captain) return;
      setStatus(await saveSquad(roundId, chosen, captain));
    });

  return (
    <div className="space-y-3">
      {!readOnly && (
        <p className="text-sm text-muted">
          בחרו {size} שחקנים (עד {maxBrazilians} ברזילאים) וקפטן. כל שחקן מקבל את הניקוד האישי שלו במחזור ×{" "}
          {playerMultiplier}, והקפטן × {captainMultiplier}. לחצו על <b>+</b> כדי להוסיף שחקן, ועל שחקן כדי להסיר
          אותו או למנות אותו לקפטן.
        </p>
      )}

      {!readOnly && (
        <div className="flex flex-wrap gap-2 text-sm">
          <Pill ok={full}>
            שחקנים {chosen.length}/{size}
          </Pill>
          <Pill ok={brazilians <= maxBrazilians} warn={brazilians === maxBrazilians}>
            <Flag code="BR" className="h-3 w-4" /> ברזילאים {brazilians}/{maxBrazilians}
          </Pill>
          <Pill ok={!!captain}>קפטן {captain ? "✓" : "חסר"}</Pill>
        </div>
      )}

      {/* המגרש */}
      <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl shadow-inner ring-1 ring-black/10 select-none">
        <div className="sand absolute inset-0" />
        {/* קווי המגרש */}
        <div className="absolute inset-[6%] rounded-sm border-[3px] border-white/90" />
        {/* הרשת */}
        <div className="absolute top-1/2 right-[2%] left-[2%] h-4 -translate-y-1/2">
          <div className="net h-full w-full" />
          <div className="absolute inset-x-0 top-0 h-1 rounded bg-white shadow" />
          <span className="absolute top-1/2 -right-1 h-5 w-2.5 -translate-y-1/2 rounded bg-brand-dark" />
          <span className="absolute top-1/2 -left-1 h-5 w-2.5 -translate-y-1/2 rounded bg-brand-dark" />
        </div>

        {positions.map((pos, i) => {
          const id = slots[i];
          const p = id ? byId[id] : undefined;
          const isCaptain = !!id && id === captain;
          const pts = id && points ? points[id] : undefined;
          return (
            <div
              key={i}
              className="absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <button
                type="button"
                disabled={readOnly && !p}
                onClick={() => (readOnly ? undefined : p ? setActing(i) : setPicking(i))}
                aria-label={p ? `${p.name}${isCaptain ? ", קפטן" : ""}` : "הוספת שחקן"}
                className={`relative grid h-14 w-14 place-items-center rounded-full text-lg font-extrabold shadow-lg transition sm:h-16 sm:w-16 ${
                  p
                    ? "bg-brand-dark text-white ring-[3px] ring-white"
                    : "border-2 border-dashed border-brand-dark/50 bg-white/60 text-3xl text-brand-dark/70 hover:bg-white/80"
                } ${readOnly ? "cursor-default" : "active:scale-95"}`}
              >
                {p ? initials(p.name) : "+"}
                {p && (
                  <span className="absolute -bottom-1 -left-1 rounded-sm ring-2 ring-white">
                    <Flag code={p.nationality} className="h-3.5 w-5" />
                  </span>
                )}
                {isCaptain && (
                  <span
                    className="absolute -top-2 -right-2 grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-yellow-200 via-amber-400 to-amber-600 text-sm font-black text-amber-950 shadow-md ring-2 ring-white"
                    title="קפטן"
                  >
                    C
                  </span>
                )}
              </button>
              {p && (
                <div className="mt-1 max-w-full rounded-md bg-brand-dark/85 px-1.5 py-0.5 text-center leading-tight text-white shadow">
                  <div className="truncate text-xs font-bold">{p.name}</div>
                  <div className="truncate text-[10px] text-white/70">{teams[p.team_id]?.name}</div>
                </div>
              )}
              {pts !== undefined && (
                <div
                  className={`mt-0.5 rounded-full px-1.5 text-xs font-bold tabular-nums shadow ${
                    pts < 0 ? "bg-rose-600 text-white" : "bg-brand text-brand-dark"
                  }`}
                  dir="ltr"
                >
                  {pts > 0 ? `+${pts}` : pts}
                  {isCaptain ? ` ×${captainMultiplier}` : ` ×${playerMultiplier}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <div className="flex items-center gap-3">
          <button className="btn flex-1" onClick={submit} disabled={pending || !full || !captain}>
            {pending ? "שומר..." : "שמירת השישייה"}
          </button>
          {status.ok && <span className="text-sm text-emerald-600">נשמר ✓</span>}
          {status.error && <span className="text-sm text-rose-600">{status.error}</span>}
        </div>
      )}

      {picking != null && (
        <PlayerPicker
          players={players}
          teams={teams}
          chosen={chosen}
          brazilianLimitReached={brazilians >= maxBrazilians}
          maxBrazilians={maxBrazilians}
          onPick={pick}
          onClose={() => setPicking(null)}
        />
      )}

      {acting != null && slots[acting] && (
        <Sheet title={byId[slots[acting]!]?.name ?? ""} onClose={() => setActing(null)}>
          <div className="space-y-2 p-4">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Flag code={byId[slots[acting]!]?.nationality} />
              {teams[byId[slots[acting]!]?.team_id ?? ""]?.name}
            </div>
            {slots[acting] === captain ? (
              <div className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-medium text-amber-900">
                השחקן הזה הוא הקפטן שלכם
              </div>
            ) : (
              <button type="button" className="btn w-full" onClick={() => makeCaptain(acting)}>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-yellow-200 to-amber-500 text-xs font-black text-amber-950">
                  C
                </span>
                מינוי לקפטן (× {captainMultiplier})
              </button>
            )}
            <button
              type="button"
              className="btn-secondary w-full text-rose-600"
              onClick={() => remove(acting)}
            >
              הסרה מהשישייה
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function Pill({ ok, warn, children }: { ok: boolean; warn?: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${
        !ok
          ? "bg-rose-100 text-rose-800"
          : warn
            ? "bg-amber-100 text-amber-900"
            : "bg-accent-soft text-accent"
      }`}
    >
      {children}
    </span>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-bold">{title}</h3>
          <button type="button" onClick={onClose} aria-label="סגירה" className="text-xl text-muted hover:text-foreground">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PlayerPicker({
  players,
  teams,
  chosen,
  brazilianLimitReached,
  maxBrazilians,
  onPick,
  onClose,
}: {
  players: Player[];
  teams: Record<string, Team>;
  chosen: string[];
  brazilianLimitReached: boolean;
  maxBrazilians: number;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState<string | null>(null);

  const teamList = useMemo(
    () => Object.values(teams).sort((a, b) => a.name.localeCompare(b.name, "he")),
    [teams],
  );
  const groups = useMemo(() => {
    const q = query.trim();
    return teamList
      .filter((t) => !teamFilter || t.id === teamFilter)
      .map((t) => ({
        team: t,
        list: players.filter((p) => p.team_id === t.id && (!q || p.name.includes(q) || t.name.includes(q))),
      }))
      .filter((g) => g.list.length);
  }, [players, teamList, teamFilter, query]);

  return (
    <Sheet title="בחירת שחקן" onClose={onClose}>
      <div className="space-y-2 border-b border-border p-3">
        <input
          className="input"
          placeholder="חיפוש שחקן או קבוצה"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          <FilterChip active={!teamFilter} onClick={() => setTeamFilter(null)}>
            כל הקבוצות
          </FilterChip>
          {teamList.map((t) => (
            <FilterChip key={t.id} active={teamFilter === t.id} onClick={() => setTeamFilter(t.id)}>
              {t.name}
            </FilterChip>
          ))}
        </div>
        {brazilianLimitReached && (
          <p className="text-xs text-amber-700">כבר בחרתם {maxBrazilians} ברזילאים, אז אפשר להוסיף רק ישראלים.</p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {groups.map(({ team, list }) => (
          <div key={team.id} className="mb-2">
            <div className="sticky top-0 bg-card px-2 py-1 text-xs font-bold text-muted">{team.name}</div>
            {list.map((p) => {
              const inSquad = chosen.includes(p.id);
              const blocked = !inSquad && p.nationality === "BR" && brazilianLimitReached;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={inSquad || blocked}
                  onClick={() => onPick(p.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right hover:bg-accent-soft disabled:opacity-45 disabled:hover:bg-transparent"
                >
                  <Flag code={p.nationality} />
                  <span className="flex-1 font-medium">{p.name}</span>
                  {inSquad && <span className="text-xs text-muted">בהרכב</span>}
                  {blocked && <span className="text-xs text-amber-700">מכסה מלאה</span>}
                </button>
              );
            })}
          </div>
        ))}
        {!groups.length && <p className="p-4 text-center text-sm text-muted">לא נמצאו שחקנים.</p>}
      </div>
    </Sheet>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-2.5 py-1 ${
        active ? "border-accent bg-accent text-accent-contrast" : "border-border bg-card"
      }`}
    >
      {children}
    </button>
  );
}
