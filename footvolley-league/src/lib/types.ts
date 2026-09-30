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
  // ניקוד אישי לשחקנים (עונשין נשמרים כמספר חיובי ומופחתים)
  ppts_played?: number;
  ppts_win?: number;
  ppts_crushing_win?: number;
  crushing_margin?: number;
  ppts_block?: number;
  ppts_great_defense?: number;
  ppts_match_mvp?: number;
  ppts_round_mvp?: number;
  ppts_scored_8?: number;
  ppts_scored_14?: number;
  ppts_overtime?: number;
  ppts_yellow?: number;
  ppts_red?: number;
  ppts_unforced_error?: number;
  quad_multiply_negative?: boolean;
  // שישיית המחזור
  squad_size?: number;
  max_brazilians?: number;
};

export type Team = {
  id: string;
  season_id: string;
  name: string;
  logo_url: string | null;
  final_position: number | null;
};

export type Nationality = "IL" | "BR";

export type Player = {
  id: string;
  team_id: string;
  name: string;
  is_active: boolean;
  nationality?: Nationality;
  photo_url?: string | null;
};

export type Round = {
  id: string;
  season_id: string;
  number: number;
  name: string | null;
  stage: "regular" | "playoff" | "final_four" | "relegation";
  deadline: string;
  mvp_player_id?: string | null;
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

export type MatchPlayerStat = {
  match_id: string;
  player_id: string;
  blocks: number;
  great_defense: number;
  unforced_errors: number;
  /** 0 = פחות מ-8, 1 = 8 ומעלה, 2 = 14 ומעלה */
  scored_tier: 0 | 1 | 2;
  is_mvp: boolean;
  yellow_card: boolean;
  red_card: boolean;
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
