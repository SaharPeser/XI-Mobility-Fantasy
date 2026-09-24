/* eslint-disable @next/next/no-img-element */
import type { Season } from "@/lib/types";

export const SPONSOR_URL = "https://xi-mobility.co.il/";

/** הלוגו של XIMOBILITY – טקסט לבן, מיועד לרקע כהה */
export function SponsorLogo({ className = "h-6" }: { className?: string }) {
  return <img src="/xi-logo.png" alt="XIMOBILITY" className={`w-auto ${className}`} />;
}

const PLACES = [
  { medal: "🥇", label: "מקום ראשון" },
  { medal: "🥈", label: "מקום שני" },
  { medal: "🥉", label: "מקום שלישי" },
];

/** כרטיס הפרסים לשלושת המקומות הראשונים בדירוג הכללי */
export function SponsorPrizes({ season }: { season: Pick<Season, "prize_1" | "prize_2" | "prize_3"> }) {
  const prizes = [season.prize_1, season.prize_2, season.prize_3];
  return (
    <section className="brand-stripes overflow-hidden rounded-2xl bg-brand-dark p-5 text-white shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium tracking-wide text-brand">הפרסים בחסות</div>
          <SponsorLogo className="mt-1 h-7" />
        </div>
        <a href={SPONSOR_URL} target="_blank" rel="noopener" className="btn-brand py-1.5 text-sm">
          לאתר XIMOBILITY ←
        </a>
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-3">
        {PLACES.map((p, i) => (
          <li key={p.label} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <div className="text-sm text-white/70">
              {p.medal} {p.label}
            </div>
            <div className="mt-1 font-bold">{prizes[i]?.trim() || "פרס מבית XIMOBILITY"}</div>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-white/60">הפרסים לשלושת המקומות הראשונים בדירוג הכללי בסוף העונה.</p>
    </section>
  );
}
