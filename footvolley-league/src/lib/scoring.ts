import type { Match, Season, Team } from "./types";

/** מערכה אחת עד 21, ניצחון בהפרש 2, תקרה ב-25 (נקודת זהב ב-24:24). זהה לפונקציה במסד הנתונים. */
export function isValidSetScore(a: number, b: number): boolean {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a === b) return false;
  const w = Math.max(a, b);
  const l = Math.min(a, b);
  if (w === 21) return l <= 19;
  if (w >= 22 && w <= 24) return l === w - 2;
  if (w === 25) return l === 23 || l === 24;
  return false;
}

export const SCORE_RULE_TEXT =
  "מערכה אחת עד 21 בהפרש 2 (למשל 21:15, 23:21), מקסימום 25 (25:23 או 25:24)";

export function predictionPoints(
  season: Pick<Season, "pts_winner" | "pts_exact">,
  match: Pick<Match, "home_score" | "away_score">,
  pred: { home_score: number; away_score: number } | undefined,
): number | null {
  if (match.home_score == null || match.away_score == null) return null;
  if (!pred) return 0;
  if (pred.home_score === match.home_score && pred.away_score === match.away_score) return season.pts_exact;
  if (Math.sign(pred.home_score - pred.away_score) === Math.sign(match.home_score - match.away_score))
    return season.pts_winner;
  return 0;
}

export type StandingRow = {
  team: Team;
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  diff: number;
};

/** טבלה חיה לפי תוצאות: ניצחונות, הפרש נקודות, נקודות זכות */
export function computeStandings(teams: Team[], matches: Match[]): StandingRow[] {
  const rows = new Map<string, StandingRow>(
    teams.map((t) => [
      t.id,
      { team: t, played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, diff: 0 },
    ]),
  );
  for (const m of matches) {
    if (m.home_score == null || m.away_score == null) continue;
    const home = rows.get(m.home_team_id);
    const away = rows.get(m.away_team_id);
    if (!home || !away) continue;
    home.played++;
    away.played++;
    home.pointsFor += m.home_score;
    home.pointsAgainst += m.away_score;
    away.pointsFor += m.away_score;
    away.pointsAgainst += m.home_score;
    if (m.home_score > m.away_score) {
      home.wins++;
      away.losses++;
    } else {
      away.wins++;
      home.losses++;
    }
  }
  const list = [...rows.values()];
  list.forEach((r) => (r.diff = r.pointsFor - r.pointsAgainst));
  return list.sort(
    (a, b) =>
      b.wins - a.wins || b.diff - a.diff || b.pointsFor - a.pointsFor || a.team.name.localeCompare(b.team.name, "he"),
  );
}

export type Zone = { label: string; className: string };

/** אזורי הטבלה בסוף העונה הסדירה */
export function zoneForPosition(pos: number): Zone | null {
  if (pos <= 2) return { label: "פיינל פור", className: "bg-emerald-500" };
  if (pos <= 6) return { label: "פלייאוף לפיינל פור", className: "bg-sky-500" };
  if (pos === 9 || pos === 10) return { label: "הצלבות מול ליגה שנייה", className: "bg-amber-500" };
  if (pos >= 11) return { label: "ירידה", className: "bg-rose-500" };
  return null;
}

export const ZONES: { range: string; zone: Zone }[] = [
  { range: "1–2", zone: zoneForPosition(1)! },
  { range: "3–6", zone: zoneForPosition(3)! },
  { range: "9–10", zone: zoneForPosition(9)! },
  { range: "11–12", zone: zoneForPosition(11)! },
];
