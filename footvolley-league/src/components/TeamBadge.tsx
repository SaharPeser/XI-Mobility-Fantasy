/* eslint-disable @next/next/no-img-element */
import type { Team } from "@/lib/types";

export function TeamBadge({ team, className = "" }: { team?: Pick<Team, "name" | "logo_url">; className?: string }) {
  if (!team) return <span className={className}>?</span>;
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      {team.logo_url ? (
        <img src={team.logo_url} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">
          {team.name.slice(0, 1)}
        </span>
      )}
      <span className="truncate">{team.name}</span>
    </span>
  );
}
