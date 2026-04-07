import type { backendInterface } from "../backend";
import { ImportStatus, Tier } from "../backend";

const now = BigInt(Date.now()) * BigInt(1_000_000);
const EMPTY_PRINCIPAL = { _arr: new Uint8Array(29), _isPrincipal: true } as ReturnType<typeof Object.create>;

const emptyMetrics = {
  avgRiskReward: 0,
  pnlBySession: [],
  computedAt: now,
  userId: EMPTY_PRINCIPAL,
  bestPair: undefined,
  weeklyPnl: [],
  worstPair: undefined,
  totalPnl: 0,
  pnlByStrategy: [],
  pnlByPair: [],
  monthlyPnl: [],
  winRate: 0,
  maxDrawdown: 0,
};

export const mockBackend: backendInterface = {
  bulkImportTrades: async () => ({
    id: BigInt(1),
    status: ImportStatus.COMPLETE,
    completedAt: now,
    userId: EMPTY_PRINCIPAL,
    createdAt: now,
    errors: [],
    importedCount: BigInt(0),
  }),

  computeMetrics: async () => emptyMetrics,

  createTrade: async () => ({
    __kind__: "limitReached" as const,
    limitReached: "Mock backend — no data",
  }),

  deleteTrade: async () => true,

  getImportJob: async () => ({
    id: BigInt(1),
    status: ImportStatus.COMPLETE,
    completedAt: now,
    userId: EMPTY_PRINCIPAL,
    createdAt: now,
    errors: [],
    importedCount: BigInt(0),
  }),

  getMetrics: async () => emptyMetrics,

  getOrCreateUser: async () => ({
    id: EMPTY_PRINCIPAL,
    createdAt: now,
    tier: Tier.FREE,
    stripeCustomerId: undefined,
  }),

  getTrade: async () => null,

  getTradeLimitStatus: async () => ({
    dailyCount: BigInt(0),
    tier: Tier.FREE,
    totalCount: BigInt(0),
    dailyLimitReached: false,
    dailyLimit: BigInt(5),
    totalLimit: BigInt(25),
    totalLimitReached: false,
  }),

  getTrades: async () => [],

  getUserTier: async () => Tier.FREE,

  saveChartAnnotation: async () => null,

  updateTrade: async () => null,

  upgradeToPaid: async () => ({
    id: EMPTY_PRINCIPAL,
    createdAt: now,
    tier: Tier.PAID,
    stripeCustomerId: undefined,
  }),
};
