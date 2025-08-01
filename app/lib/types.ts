export interface Team {
  id: number;
  name: string;
}

export interface Player {
  id: number;
  name: string;
  team_id: number;
}

export interface MatchResult {
  id: number;
  team_match_id: number;
  is_singles: boolean;
  pos: number;
  player1: number;
  player2: number | null;
  result: "win" | "loss" | "tie";
  set1score: string;
  set2score: string;
  set3score: string | null;
  incomplete_reason: string | null;
  player1_name: string;
  player2_name: string | null;
  match_date: string;
  opponent_name: string;
}

export interface PlayerStats {
  id: number;
  name: string;
  wins: number;
  losses: number;
  ties: number;
  totalMatches: number;
  winPercentage: number;
  singlesWins: number;
  singlesLosses: number;
  singlesTies: number;
  doublesWins: number;
  doublesLosses: number;
  doublesTies: number;
  pointsEarned: number;
}

export interface PairStats {
  player1Id: number;
  player2Id: number;
  player1Name: string;
  player2Name: string;
  wins: number;
  losses: number;
  ties: number;
  totalMatches: number;
  winPercentage: number;
  pointsEarned: number;
} 