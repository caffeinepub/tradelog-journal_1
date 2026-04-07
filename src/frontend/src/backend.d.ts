import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export interface UserPublic {
    id: UserId;
    createdAt: Timestamp;
    tier: Tier;
    stripeCustomerId?: string;
}
export interface TierLimitStatus {
    dailyCount: bigint;
    tier: Tier;
    totalCount: bigint;
    dailyLimitReached: boolean;
    dailyLimit: bigint;
    totalLimit: bigint;
    totalLimitReached: boolean;
}
export interface TradePublic {
    id: TradeId;
    pnl: number;
    exitDate: Timestamp;
    direction: Direction;
    entryDate: Timestamp;
    chartImageUrl?: string;
    sessionTime: SessionTime;
    userId: UserId;
    createdAt: Timestamp;
    pair: string;
    marketCondition: MarketCondition;
    riskReward: number;
    strategyTag: string;
    updatedAt: Timestamp;
    mistakeTag?: string;
    notes: string;
    entryPrice: number;
    exitPrice: number;
}
export type TradeId = bigint;
export interface PnlDataPoint {
    pnl: number;
    tradeCount: bigint;
    periodLabel: string;
}
export interface TradeFilter {
    dateTo?: Timestamp;
    sessionTime?: SessionTime;
    pair?: string;
    strategyTag?: string;
    mistakeTag?: string;
    dateFrom?: Timestamp;
}
export interface PerformanceMetrics {
    avgRiskReward: number;
    pnlBySession: Array<SessionStats>;
    computedAt: Timestamp;
    userId: UserId;
    bestPair?: string;
    weeklyPnl: Array<PnlDataPoint>;
    worstPair?: string;
    totalPnl: number;
    pnlByStrategy: Array<StrategyStats>;
    pnlByPair: Array<PairStats>;
    monthlyPnl: Array<PnlDataPoint>;
    winRate: number;
    maxDrawdown: number;
}
export interface CsvTradeRow {
    pnl?: number;
    exitDate: Timestamp;
    direction: Direction;
    entryDate: Timestamp;
    chartImageUrl?: string;
    sessionTime?: SessionTime;
    pair: string;
    marketCondition?: MarketCondition;
    riskReward?: number;
    strategyTag?: string;
    mistakeTag?: string;
    notes?: string;
    entryPrice: number;
    exitPrice: number;
}
export interface ImportJobPublic {
    id: ImportJobId;
    status: ImportStatus;
    completedAt?: Timestamp;
    userId: UserId;
    createdAt: Timestamp;
    errors: Array<ImportLineError>;
    importedCount: bigint;
}
export type UserId = Principal;
export type ImportJobId = bigint;
export interface TradeInput {
    exitDate: Timestamp;
    direction: Direction;
    entryDate: Timestamp;
    chartImageUrl?: string;
    sessionTime: SessionTime;
    takeProfit?: number;
    pair: string;
    marketCondition: MarketCondition;
    strategyTag: string;
    mistakeTag?: string;
    stopLoss?: number;
    notes: string;
    entryPrice: number;
    exitPrice: number;
}
export interface SessionStats {
    tradeCount: bigint;
    totalPnl: number;
    session: SessionTime;
    winRate: number;
}
export interface PairStats {
    tradeCount: bigint;
    pair: string;
    totalPnl: number;
    winRate: number;
}
export interface StrategyStats {
    tag: string;
    tradeCount: bigint;
    totalPnl: number;
    winRate: number;
}
export interface ImportLineError {
    lineNumber: bigint;
    reason: string;
}
export enum Direction {
    LONG = "LONG",
    SHORT = "SHORT"
}
export enum ImportStatus {
    FAILED = "FAILED",
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETE = "COMPLETE"
}
export enum MarketCondition {
    VOLATILE = "VOLATILE",
    RANGING = "RANGING",
    CHOPPY = "CHOPPY",
    OTHER = "OTHER",
    TRENDING = "TRENDING"
}
export enum SessionTime {
    NY = "NY",
    LONDON = "LONDON",
    ASIAN = "ASIAN",
    OTHER = "OTHER"
}
export enum Tier {
    FREE = "FREE",
    PAID = "PAID"
}
export interface backendInterface {
    bulkImportTrades(rows: Array<CsvTradeRow>): Promise<ImportJobPublic>;
    computeMetrics(): Promise<PerformanceMetrics>;
    createTrade(input: TradeInput): Promise<{
        __kind__: "ok";
        ok: TradePublic;
    } | {
        __kind__: "limitReached";
        limitReached: string;
    }>;
    deleteTrade(tradeId: TradeId): Promise<boolean>;
    getImportJob(jobId: ImportJobId): Promise<ImportJobPublic | null>;
    getMetrics(): Promise<PerformanceMetrics | null>;
    getOrCreateUser(): Promise<UserPublic>;
    getTrade(tradeId: TradeId): Promise<TradePublic | null>;
    getTradeLimitStatus(): Promise<TierLimitStatus>;
    getTrades(filter: TradeFilter): Promise<Array<TradePublic>>;
    getUserTier(): Promise<Tier>;
    saveChartAnnotation(tradeId: TradeId, imageUrl: string): Promise<TradePublic | null>;
    updateTrade(tradeId: TradeId, input: TradeInput): Promise<TradePublic | null>;
    upgradeToPaid(): Promise<UserPublic>;
}
