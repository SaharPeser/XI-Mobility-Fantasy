export type Season = {
  id: string;
  name: string;
  is_active: boolean;
  table_deadline: string | null;
  pts_winner: number;
  pts_exact: number;
  pts_table_position: number;
  quad_multiplier: number;
  captain_multiplier: number;
  // פרסי החסות – ריקים עד שהמנהל מזין אותם
  prize_1?: string | null;
  prize_2?: string | null;
  prize_3?: string | null;
};

export type Team = {
  id: string;
  season_id: string;
  name: string;
  logo_url: string | null;
  final_position: number | null;
};

export type Player = {
  id: string;
  team_id: string;
  name: string;
  is_active: boolean;
};

export type Round = {
  id: string;
  season_id: string;
  number: number;
  name: string | null;
  stage: "regular" | "playoff" | "final_four" | "relegation";
  deadline: string;
};

export type Match = {
  id: string;
  round_id: string;
  home_team_id: string;
  away_team_id: string;
  starts_at: string | null;
  sort_order: number;
  home_score: number | null;
  away_score: number | null;
};

export type MatchPrediction = {
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
};

export type LeaderboardRow = {
  user_id: string;
  display_name: string;
  match_points: number;
  table_points: number;
  quad_points: number;
  total: number;
  rank: number;
};
