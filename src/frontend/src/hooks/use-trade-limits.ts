import { Tier, createActor } from "@/backend";
import type { TierLimitStatus } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

const FREE_DAILY_LIMIT = 5;
const FREE_TOTAL_LIMIT = 25;

const DEFAULT_LIMITS: TierLimitStatus = {
  dailyCount: 0,
  totalCount: 0,
  tier: "FREE",
  dailyLimit: FREE_DAILY_LIMIT,
  totalLimit: FREE_TOTAL_LIMIT,
  dailyLimitReached: false,
  totalLimitReached: false,
};

export function useTradeLimits() {
  const { actor, isFetching } = useActor(createActor);

  const query = useQuery<TierLimitStatus>({
    queryKey: ["tradeLimits"],
    queryFn: async () => {
      if (!actor) return DEFAULT_LIMITS;
      try {
        const status = await actor.getTradeLimitStatus();
        return {
          dailyCount: Number(status.dailyCount),
          totalCount: Number(status.totalCount),
          tier:
            status.tier === Tier.PAID ? ("PAID" as const) : ("FREE" as const),
          dailyLimit: Number(status.dailyLimit),
          totalLimit: Number(status.totalLimit),
          dailyLimitReached: status.dailyLimitReached,
          totalLimitReached: status.totalLimitReached,
        };
      } catch {
        return DEFAULT_LIMITS;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });

  const data = query.data ?? DEFAULT_LIMITS;
  const totalPct = Math.min(
    100,
    Math.round((data.totalCount / Math.max(data.totalLimit, 1)) * 100),
  );

  return { ...data, totalPct, isLoading: query.isLoading };
}
