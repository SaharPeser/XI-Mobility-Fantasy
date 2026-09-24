import { ZONES } from "@/lib/scoring";

export function ZoneLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {ZONES.map(({ range, zone }) => (
        <span key={range} className="inline-flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${zone.className}`} />
          {range}: {zone.label}
        </span>
      ))}
    </div>
  );
}
