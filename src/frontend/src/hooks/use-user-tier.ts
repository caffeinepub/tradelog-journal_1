import { createActor } from "@/backend";
import { Tier } from "@/backend";
import type { UserTier } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export function useUserTier() {
  const { actor, isFetching } = useActor(createActor);

  const query = useQuery<{ tier: UserTier; paidUntil?: bigint }>({
    queryKey: ["userTier"],
    queryFn: async () => {
      if (!actor) return { tier: "FREE" as UserTier };
      try {
        // Try to get full user info first (includes paidUntil)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = await (actor as any).getOrCreateUser?.().catch(() => null);
        const paidUntil: bigint | undefined = user?.paidUntil
          ? BigInt(user.paidUntil)
          : undefined;

        const rawTier = await actor.getUserTier();
        let tier: UserTier = rawTier === Tier.PAID ? "PAID" : "FREE";

        // If paidUntil is set, check if it's still in the future
        if (paidUntil !== undefined) {
          const nowMs = BigInt(Date.now()) * 1_000_000n; // nanoseconds
          if (paidUntil > nowMs) {
            tier = "PAID";
          } else if (rawTier !== Tier.PAID) {
            // paidUntil expired and not otherwise PAID
            tier = "FREE";
          }
        }

        return { tier, paidUntil };
      } catch {
        return { tier: "FREE" as UserTier };
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });

  const data = query.data ?? { tier: "FREE" as UserTier };

  return {
    tier: data.tier,
    isPaid: data.tier === "PAID",
    isFree: data.tier === "FREE",
    paidUntil: data.paidUntil,
    isLoading: query.isLoading,
  };
}
