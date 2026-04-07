import { Tier, createActor } from "@/backend";
import type { UserTier } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export function useUserTier() {
  const { actor, isFetching } = useActor(createActor);

  const query = useQuery<UserTier>({
    queryKey: ["userTier"],
    queryFn: async () => {
      if (!actor) return "FREE";
      try {
        const tier = await actor.getUserTier();
        return tier === Tier.PAID ? "PAID" : "FREE";
      } catch {
        return "FREE";
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });

  return {
    tier: query.data ?? "FREE",
    isPaid: query.data === "PAID",
    isFree: (query.data ?? "FREE") === "FREE",
    isLoading: query.isLoading,
  };
}
