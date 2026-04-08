import { createActor } from "@/backend";
import type { CouponRedemptionResult } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function parsePerkApplied(raw: unknown): string {
  if (typeof raw === "string") return raw;
  return "Perk applied successfully";
}

function parseCouponResult(raw: unknown): CouponRedemptionResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = raw as any;
  return {
    coupon: {
      id: Number(r?.coupon?.id ?? 0),
      code: String(r?.coupon?.code ?? ""),
      description: String(r?.coupon?.description ?? ""),
      perkType: {
        kind: "CUSTOM",
        description: String(r?.coupon?.perkType ?? ""),
      },
      usedCount: Number(r?.coupon?.usedCount ?? 0),
      isActive: Boolean(r?.coupon?.isActive ?? false),
      createdAt: BigInt(r?.coupon?.createdAt ?? 0),
    },
    perkApplied: parsePerkApplied(r?.perkApplied),
  };
}

export function useCouponRedemption() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation<CouponRedemptionResult, Error, string>({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).redeemCoupon(code);
      if ("err" in result || "notFound" in result) {
        throw new Error(
          result?.err ?? result?.notFound ?? "Invalid coupon code",
        );
      }
      return parseCouponResult("ok" in result ? result.ok : result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userTier"] });
      queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
    },
  });
}
