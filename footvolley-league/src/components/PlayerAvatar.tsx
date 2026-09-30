/* eslint-disable @next/next/no-img-element */
import type { Player } from "@/lib/types";

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
}

/**
 * תמונת שחקן בעיגול. אם אין תמונה, מוצג עיגול עם ראשי התיבות.
 * הגודל והמסגרת נקבעים מבחוץ דרך className (למשל "h-10 w-10 text-sm").
 */
export function PlayerAvatar({
  player,
  className = "h-10 w-10 text-sm",
}: {
  player: Pick<Player, "name" | "photo_url">;
  className?: string;
}) {
  if (player.photo_url) {
    return (
      <img
        src={player.photo_url}
        alt={player.name}
        className={`shrink-0 rounded-full bg-brand-dark object-cover ${className}`}
        loading="lazy"
        draggable={false}
      />
    );
  }
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-brand-dark font-extrabold text-white ${className}`}
      aria-label={player.name}
    >
      {initials(player.name)}
    </span>
  );
}
