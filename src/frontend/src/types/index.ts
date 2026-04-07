// ─── Enums ─────────────────────────────────────────────────────────────────

export type UserTier = "FREE" | "PAID";

export type TradeDirection = "LONG" | "SHORT";

export type SessionTime = "ASIAN" | "LONDON" | "NY" | "OTHER";

export type MarketCondition =
  | "TRENDING"
  | "RANGING"
  | "VOLATILE"
  | "CHOPPY"
  | "OTHER";

// ─── Core Models ───────────────────────────────────────────────────────────

export interface Trade {
  id: string;
  pair: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  riskReward: number;
  strategyTag: string;
  mistakeTag?: string;
  sessionTime: SessionTime;
  marketCondition: MarketCondition;
  notes?: string;
  chartImageUrl?: string;
  entryDate: bigint;
  exitDate: bigint;
  createdAt: bigint;
}

export interface TradeInput {
  pair: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  riskReward: number;
  strategyTag: string;
  mistakeTag?: string;
  sessionTime: SessionTime;
  marketCondition: MarketCondition;
  notes?: string;
  chartImageUrl?: string;
  entryDate: bigint;
  exitDate: bigint;
}

export interface TradeFilter {
  pair?: string;
  direction?: TradeDirection;
  sessionTime?: SessionTime;
  marketCondition?: MarketCondition;
  strategyTag?: string;
  fromDate?: bigint;
  toDate?: bigint;
}

// ─── Tier & Limits ─────────────────────────────────────────────────────────

export interface TierLimitStatus {
  dailyCount: number;
  totalCount: number;
  tier: UserTier;
  dailyLimit: number;
  totalLimit: number;
  dailyLimitReached: boolean;
  totalLimitReached: boolean;
}

// ─── Performance ────────────────────────────────────────────────────────────

export interface PerformanceMetrics {
  userId: string;
  winRate: number;
  totalPnl: number;
  maxDrawdown: number;
  bestPair: string;
  worstPair: string;
  avgRiskReward: number;
  weeklyPnl: number;
  monthlyPnl: number;
  pnlByPair: Record<string, number>;
  pnlByStrategy: Record<string, number>;
  pnlBySession: Record<string, number>;
  computedAt: bigint;
}

// ─── Import ─────────────────────────────────────────────────────────────────

export interface CsvColumnMap {
  date: string;
  pair: string;
  direction: string;
  entryPrice: string;
  exitPrice: string;
  pnl: string;
  riskReward?: string;
  strategyTag?: string;
  mistakeTag?: string;
  notes?: string;
}

export interface ImportJob {
  id: string;
  status: "PENDING" | "PROCESSING" | "DONE" | "ERROR";
  totalRows: number;
  importedRows: number;
  errorRows: number;
  errorMessage?: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  tier: UserTier;
  createdAt: bigint;
  stripeCustomerId?: string;
}
