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

const mockFreeUser = {
  id: EMPTY_PRINCIPAL,
  createdAt: now,
  tier: Tier.FREE,
  stripeCustomerId: undefined,
  isAdmin: false,
  unlockedFeatures: [] as Array<string>,
};

const mockPaidUser = {
  id: EMPTY_PRINCIPAL,
  createdAt: now,
  tier: Tier.PAID,
  stripeCustomerId: undefined,
  isAdmin: false,
  unlockedFeatures: [] as Array<string>,
};

const mockCoupon = {
  id: BigInt(1),
  code: "MOCK10",
  description: "Mock coupon",
  createdAt: now,
  usedCount: BigInt(0),
  isActive: true,
  maxUses: undefined,
  expiresAt: undefined,
  perkType: { __kind__: "upgradeToPhaid" as const, upgradeToPhaid: null },
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

  createCoupon: async () => mockCoupon,

  createTrade: async () => ({
    __kind__: "limitReached" as const,
    limitReached: "Mock backend — no data",
  }),

  deactivateCoupon: async () => ({
    __kind__: "ok" as const,
    ok: null,
  }),

  deleteTrade: async () => true,

  getCouponStats: async () => ({
    __kind__: "ok" as const,
    ok: { coupon: mockCoupon, totalRedemptions: BigInt(0) },
  }),

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

  getOrCreateUser: async () => mockFreeUser,

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

  isAdmin: async () => false,

  listCoupons: async () => [mockCoupon],

  redeemCoupon: async () => ({
    __kind__: "err" as const,
    err: "Mock backend — coupon redemption not available",
  }),

  saveChartAnnotation: async () => null,

  setAdmin: async () => ({
    __kind__: "ok" as const,
    ok: null,
  }),

  updateTrade: async () => null,

  upgradeToPaid: async () => mockPaidUser,
};
