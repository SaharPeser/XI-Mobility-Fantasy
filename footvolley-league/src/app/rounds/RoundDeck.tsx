"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { SponsorLogo } from "@/components/Sponsor";

export type RoundCard = {
  id: string;
  number: number;
  name: string | null;
  deadlineText: string;
  locked: boolean;
  matchCount: number;
  playedCount: number;
  /** null = משתמש לא מחובר */
  predicted: number | null;
  squadPicked: number | null;
  squadSize: number;
};

/** כמה קלפים נראים מאחורי הקלף העליון */
const STACK = 3;
/** מרחק גרירה (בפיקסלים) שמעביר קלף */
const SWIPE = 70;

/**
 * חבילת קלפים של המחזורים. גרירה ימינה = המחזור הבא (כמו דפדוף בספר בעברית), שמאלה = הקודם.
 * הקלף הראשון בחבילה הוא מחזור 1.
 */
export function RoundDeck({ rounds, seasonName }: { rounds: RoundCard[]; seasonName: string }) {
  const [index, setIndex] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState(false);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const moved = useRef(false);

  const openIndex = rounds.findIndex((r) => !r.locked);
  const last = rounds.length - 1;

  const go = useCallback(
    (i: number) => {
      setTouched(true);
      setIndex(Math.max(0, Math.min(last, i)));
    },
    [last],
  );

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    moved.current = false;
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const x = e.clientX - s.x;
    const y = e.clientY - s.y;
    if (!dragging) {
      // מתחילים לגרור רק בתנועה אופקית ברורה, כדי לא לחסום גלילה של העמוד
      if (Math.abs(x) < 8 || Math.abs(x) < Math.abs(y)) return;
      setDragging(true);
      setTouched(true);
      moved.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    // בקצוות החבילה הגרירה "נתקעת" בהדרגה
    const atEdge = (x > 0 && index === last) || (x < 0 && index === 0);
    setDx(atEdge ? x / 4 : x);
  };

  const onPointerUp = () => {
    if (dragging) {
      if (dx > SWIPE && index < last) go(index + 1);
      else if (dx < -SWIPE && index > 0) go(index - 1);
    }
    start.current = null;
    setDragging(false);
    setDx(0);
  };

  // לחיצה על הכפתור בקלף לא תיחשב אם זו הייתה גרירה
  const onClickCapture = (e: MouseEvent) => {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // בעברית "קדימה" הוא שמאלה
    if (e.key === "ArrowLeft") go(index + 1);
    if (e.key === "ArrowRight") go(index - 1);
  };

  if (!rounds.length) return <div className="card text-muted">עוד לא הוזנו מחזורים.</div>;

  const current = rounds[index];

  return (
    <div className="space-y-4 overflow-x-clip py-1">
      <SwipeBanner />

      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted">
          מחזור <b className="text-foreground">{current.number}</b> מתוך {rounds.length}
        </span>
        {openIndex >= 0 && openIndex !== index && (
          <button type="button" className="font-medium text-accent" onClick={() => go(openIndex)}>
            למחזור הפתוח ←
          </button>
        )}
      </div>

      <div
        className="relative mx-auto mb-24 h-[23rem] w-full max-w-md touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-3xl"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="region"
        aria-roledescription="חבילת קלפים"
        aria-label={`מחזורים. מוצג ${current.name || `מחזור ${current.number}`}. חיצים במקלדת להחלפה`}
      >
        {rounds.map((r, i) => {
          const offset = i - index;
          if (offset < -1 || offset > STACK) return null;
          return (
            <div
              key={r.id}
              className="absolute inset-0"
              style={cardStyle(offset, offset === 0 ? dx : 0, dragging && offset === 0)}
              aria-hidden={offset !== 0}
            >
              <Card
                round={r}
                seasonName={seasonName}
                interactive={offset === 0}
                // רמז קטן לגרירה בפעם הראשונה שהעמוד נפתח
                hint={offset === 0 && !touched}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          className="btn-secondary h-10 w-10 p-0 text-lg"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="המחזור הקודם"
        >
          →
        </button>
        <div className="flex flex-wrap justify-center gap-1.5" role="tablist" aria-label="בחירת מחזור">
          {rounds.map((r, i) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={r.name || `מחזור ${r.number}`}
              onClick={() => go(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? "w-6 bg-accent" : r.locked ? "w-2.5 bg-border" : "w-2.5 bg-brand"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          className="btn-secondary h-10 w-10 p-0 text-lg"
          onClick={() => go(index + 1)}
          disabled={index === last}
          aria-label="המחזור הבא"
        >
          ←
        </button>
      </div>
    </div>
  );
}

/** באנר שמסביר איך מדפדפים, עם יד מונפשת */
function SwipeBanner() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-brand-dark px-4 py-3 text-white shadow ring-1 ring-brand/30">
      <span className="relative grid h-10 w-20 shrink-0 place-items-center" aria-hidden>
        <span className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between text-sm font-bold text-brand">
          <span>←</span>
          <span>→</span>
        </span>
        <span className="swipe-hand text-xl">👆</span>
      </span>
      <div className="leading-tight">
        <div className="font-bold">
          החליקו <span className="text-brand">ימינה</span> או <span className="text-brand">שמאלה</span>
        </div>
        <div className="text-xs text-white/70">ימינה למחזור הבא, שמאלה למחזור הקודם</div>
      </div>
    </div>
  );
}

/** מיקום כל קלף בחבילה: העליון בגודל מלא, והבאים מאחוריו קטנים ומוסטים מעט למטה */
function cardStyle(offset: number, dx: number, dragging: boolean): React.CSSProperties {
  const transition = dragging ? "none" : "transform 350ms cubic-bezier(.2,.8,.2,1), opacity 350ms";
  if (offset < 0) {
    // קלף שכבר דפדפנו: עף ימינה ונעלם
    return { transform: "translateX(115%) rotate(12deg)", opacity: 0, transition, zIndex: 40, pointerEvents: "none" };
  }
  if (offset === 0) {
    return {
      transform: `translateX(${dx}px) rotate(${dx / 25}deg)`,
      transition,
      zIndex: 30,
      cursor: dragging ? "grabbing" : "grab",
    };
  }
  // הקלפים שמאחור נפרשים לסירוגין לצדדים ולמטה, ובהירים יותר ככל שהם עמוקים יותר
  const depth = Math.min(offset, STACK);
  const side = depth % 2 ? -1 : 1;
  return {
    transform: `translate(${side * depth * 6}px, ${depth * 26}px) scale(${1 - depth * 0.05}) rotate(${side * depth * 1.2}deg)`,
    opacity: offset > STACK ? 0 : 1 - (depth - 1) * 0.12,
    filter: `brightness(${1 + depth * 0.35})`,
    transition: dragging ? "none" : `${transition}, filter 350ms`,
    zIndex: 30 - depth,
    pointerEvents: "none",
  };
}

function Card({
  round: r,
  seasonName,
  interactive,
  hint,
}: {
  round: RoundCard;
  seasonName: string;
  interactive: boolean;
  hint: boolean;
}) {
  const title = r.name || `מחזור ${r.number}`;
  const finished = r.matchCount > 0 && r.playedCount === r.matchCount;
  const status = !r.locked
    ? { text: "פתוח לניחושים", cls: "bg-brand text-brand-dark" }
    : finished
      ? { text: "הסתיים", cls: "bg-white/15 text-white" }
      : { text: "נעול", cls: "bg-rose-500/90 text-white" };

  return (
    <article
      className={`brand-stripes relative flex h-full flex-col overflow-hidden rounded-3xl bg-brand-dark p-6 text-white shadow-xl ${
        interactive ? "ring-1 ring-white/10" : "ring-2 ring-brand/50"
      } ${hint ? "deck-hint" : ""}`}
    >
      {!interactive && (
        // מספר המחזור מציץ בתחתית הקלף שמאחור
        <span className="absolute inset-x-0 bottom-1.5 text-center text-xs font-bold text-brand">
          {title}
        </span>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-white/70">
          <span>בחסות</span>
          <SponsorLogo className="h-4" />
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${status.cls}`}>{status.text}</span>
      </div>

      <h2 className="mt-4 text-4xl leading-tight font-extrabold">
        {r.name ? (
          <span className="text-brand">{title}</span>
        ) : (
          <>
            מחזור <span className="text-brand">{r.number}</span>
          </>
        )}
      </h2>
      <p className="mt-1 text-sm text-white/60">{seasonName}</p>

      <p className="mt-4 text-sm">
        {r.locked ? "ננעל ב-" : "ניחושים עד "}
        <b>{r.deadlineText}</b>
      </p>

      <div className="mt-auto space-y-2">
        {r.predicted != null && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Progress label="ניחושי תוצאות" value={r.predicted} total={r.matchCount} />
            <Progress label="שישיית המחזור" value={r.squadPicked ?? 0} total={r.squadSize} />
          </div>
        )}
        <Link
          href={`/rounds/${r.number}`}
          tabIndex={interactive ? 0 : -1}
          className="btn-brand w-full py-2.5 text-base"
          draggable={false}
        >
          {r.locked ? "לתוצאות ולניקוד ←" : "כניסה למחזור ←"}
        </Link>
      </div>
    </article>
  );
}

function Progress({ label, value, total }: { label: string; value: number; total: number }) {
  const done = total > 0 && value >= total;
  const pct = total ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="rounded-xl bg-white/5 p-2.5 ring-1 ring-white/10">
      <div className="flex items-center justify-between text-xs text-white/70">
        <span>{label}</span>
        <span className={`font-bold tabular-nums ${done ? "text-brand" : "text-white"}`} dir="ltr">
          {value}/{total}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${done ? "bg-brand" : "bg-white/60"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
