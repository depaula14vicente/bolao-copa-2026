
export interface Match {
  id: string;
  teamA: string;
  teamB: string;
  date: string;
  group: string;
  isBrazil: boolean;
  isFinal: boolean;
  location?: string;
  // userScoreA/B mantidos para compatibilidade visual rápida, mas a lógica principal usará 'bets'
  userScoreA?: number; 
  userScoreB?: number;
  officialScoreA?: number;
  officialScoreB?: number;
  // Novo campo: Dicionário de apostas { "username": { scoreA: 1, scoreB: 2 } }
  bets?: Record<string, { scoreA: number, scoreB: number }>;
}

export interface ExtraBet {
  brazilFirstScorer1: string;
  brazilFirstScorer2: string;
  brazilFirstScorer3: string;
  topScorer: string;
  champion: string;
  viceChampion: string;
  thirdPlace: string;
}

export interface PlayerHistory {
  round: string;
  points: number;
  position: number;
}

export interface Player {
  id: string;
  name: string;
  points: number;
  exactScores: number;
  brazilPoints: number;
  position: number;
  trend: 'up' | 'down' | 'same';
  history: PlayerHistory[];
  avatar?: string; // Adicionado para exibir no ranking
}

export interface User {
  username: string;
  name: string;
  role: 'admin' | 'user';
  password?: string;
  paid?: boolean;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'info' | 'alert' | 'success';
  read: boolean;
}

export interface ScoringRule {
  id: string;
  criteria: string;
  points: number;
}

export interface PrizeConfig {
  first: number;
  second: number;
  third: number;
}

export interface AppConfig {
  // bettingLockHours removido conforme solicitação
  scoringRules: ScoringRule[];
  ticketPrice: number;
  prizeDistribution: PrizeConfig;
  specialTeams: string[];
  specialPhases: string[];
}

export enum ViewState {
  RULES = 'RULES',
  BETTING = 'BETTING',
  GROUPS = 'GROUPS',
  RANKING = 'RANKING',
  ADMIN = 'ADMIN',
  RESULTS = 'RESULTS',
  PROFILE = 'PROFILE'
}