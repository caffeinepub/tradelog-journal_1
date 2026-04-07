import type { backendInterface } from "../backend";
import {
  Direction,
  ImportStatus,
  MarketCondition,
  SessionTime,
  Tier,
} from "../backend";

const now = BigInt(Date.now()) * BigInt(1_000_000);
const dayAgo = now - BigInt(86_400_000_000_000);
const twoDaysAgo = now - BigInt(2 * 86_400_000_000_000);

const sampleTrades = [
  {
    id: BigInt(1),
    pnl: 320.5,
    exitDate: now,
    direction: Direction.LONG,
    entryDate: dayAgo,
    chartImageUrl: undefined,
    sessionTime: SessionTime.LONDON,
    userId: { _arr: new Uint8Array(29), _isPrincipal: true } as any,
    createdAt: dayAgo,
    pair: "EUR/USD",
    marketCondition: MarketCondition.TRENDING,
    riskReward: 2.1,
    strategyTag: "Breakout",
    updatedAt: now,
    mistakeTag: undefined,
    notes: "Clean breakout above resistance. Held position through retest.",
    entryPrice: 1.082,
    exitPrice: 1.0963,
  },
  {
    id: BigInt(2),
    pnl: -125.3,
    exitDate: dayAgo,
    direction: Direction.SHORT,
    entryDate: twoDaysAgo,
    chartImageUrl: undefined,
    sessionTime: SessionTime.NY,
    userId: { _arr: new Uint8Array(29), _isPrincipal: true } as any,
    createdAt: twoDaysAgo,
    pair: "GBP/JPY",
    marketCondition: MarketCondition.VOLATILE,
    riskReward: 0.8,
    strategyTag: "Mean Reversion",
    updatedAt: dayAgo,
    mistakeTag: "Moved stop loss",
    notes: "Entered too early, moved stop which led to bigger loss.",
    entryPrice: 192.45,
    exitPrice: 193.02,
  },
  {
    id: BigInt(3),
    pnl: 540.0,
    exitDate: twoDaysAgo,
    direction: Direction.LONG,
    entryDate: twoDaysAgo,
    chartImageUrl: undefined,
    sessionTime: SessionTime.NY,
    userId: { _arr: new Uint8Array(29), _isPrincipal: true } as any,
    createdAt: twoDaysAgo,
    pair: "BTC/USD",
    marketCondition: MarketCondition.TRENDING,
    riskReward: 3.2,
    strategyTag: "Trend Follow",
    updatedAt: twoDaysAgo,
    mistakeTag: undefined,
    notes: "Perfect execution. Rode momentum into resistance zone.",
    entryPrice: 68200,
    exitPrice: 69800,
  },
];

const sampleMetrics = {
  avgRiskReward: 2.03,
  pnlBySession: [
    { session: SessionTime.LONDON, totalPnl: 320.5, tradeCount: BigInt(1), winRate: 100 },
    { session: SessionTime.NY, totalPnl: 414.7, tradeCount: BigInt(2), winRate: 50 },
    { session: SessionTime.ASIAN, totalPnl: 0, tradeCount: BigInt(0), winRate: 0 },
  ],
  computedAt: now,
  userId: { _arr: new Uint8Array(29), _isPrincipal: true } as any,
  bestPair: "BTC/USD",
  weeklyPnl: [
    { periodLabel: "Mon", pnl: 320.5, tradeCount: BigInt(1) },
    { periodLabel: "Tue", pnl: -125.3, tradeCount: BigInt(1) },
    { periodLabel: "Wed", pnl: 540.0, tradeCount: BigInt(1) },
    { periodLabel: "Thu", pnl: 0, tradeCount: BigInt(0) },
    { periodLabel: "Fri", pnl: 0, tradeCount: BigInt(0) },
  ],
  worstPair: "GBP/JPY",
  totalPnl: 735.2,
  pnlByStrategy: [
    { tag: "Breakout", totalPnl: 320.5, tradeCount: BigInt(1), winRate: 100 },
    { tag: "Trend Follow", totalPnl: 540.0, tradeCount: BigInt(1), winRate: 100 },
    { tag: "Mean Reversion", totalPnl: -125.3, tradeCount: BigInt(1), winRate: 0 },
  ],
  pnlByPair: [
    { pair: "EUR/USD", totalPnl: 320.5, tradeCount: BigInt(1), winRate: 100 },
    { pair: "BTC/USD", totalPnl: 540.0, tradeCount: BigInt(1), winRate: 100 },
    { pair: "GBP/JPY", totalPnl: -125.3, tradeCount: BigInt(1), winRate: 0 },
  ],
  monthlyPnl: [
    { periodLabel: "Jan", pnl: 1200, tradeCount: BigInt(8) },
    { periodLabel: "Feb", pnl: -320, tradeCount: BigInt(6) },
    { periodLabel: "Mar", pnl: 2100, tradeCount: BigInt(12) },
    { periodLabel: "Apr", pnl: 735.2, tradeCount: BigInt(3) },
  ],
  winRate: 66.67,
  maxDrawdown: -125.3,
};

export const mockBackend: backendInterface = {
  bulkImportTrades: async () => ({
    id: BigInt(1),
    status: ImportStatus.COMPLETE,
    completedAt: now,
    userId: { _arr: new Uint8Array(29), _isPrincipal: true } as any,
    createdAt: now,
    errors: [],
    importedCount: BigInt(3),
  }),

  computeMetrics: async () => sampleMetrics,

  createTrade: async () => ({
    __kind__: "ok",
    ok: sampleTrades[0],
  }),

  deleteTrade: async () => true,

  getImportJob: async () => ({
    id: BigInt(1),
    status: ImportStatus.COMPLETE,
    completedAt: now,
    userId: { _arr: new Uint8Array(29), _isPrincipal: true } as any,
    createdAt: now,
    errors: [],
    importedCount: BigInt(3),
  }),

  getMetrics: async () => sampleMetrics,

  getOrCreateUser: async () => ({
    id: { _arr: new Uint8Array(29), _isPrincipal: true } as any,
    createdAt: twoDaysAgo,
    tier: Tier.FREE,
    stripeCustomerId: undefined,
  }),

  getTrade: async () => sampleTrades[0],

  getTradeLimitStatus: async () => ({
    dailyCount: BigInt(3),
    tier: Tier.FREE,
    totalCount: BigInt(18),
    dailyLimitReached: false,
    dailyLimit: BigInt(5),
    totalLimit: BigInt(25),
    totalLimitReached: false,
  }),

  getTrades: async () => sampleTrades,

  getUserTier: async () => Tier.FREE,

  saveChartAnnotation: async () => sampleTrades[0],

  updateTrade: async () => sampleTrades[0],

  upgradeToPaid: async () => ({
    id: { _arr: new Uint8Array(29), _isPrincipal: true } as any,
    createdAt: twoDaysAgo,
    tier: Tier.PAID,
    stripeCustomerId: "cus_mock123",
  }),
};
