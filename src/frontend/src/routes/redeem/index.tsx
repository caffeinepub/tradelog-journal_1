import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Input } from "@/components/ui/input";
import { useCouponRedemption } from "@/hooks/use-coupon-redemption";
import type { CouponRedemptionResult } from "@/types";
import { createRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Tag,
  Ticket,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Route as RootRoute } from "../__root";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/redeem",
  component: RedeemPage,
});

function PerkDisplay({ perkApplied }: { perkApplied: string }) {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl"
      style={{
        background: "rgba(0,255,65,0.08)",
        border: "1px solid rgba(0,255,65,0.3)",
      }}
    >
      <Tag className="h-4 w-4 text-[#00ff41] shrink-0 mt-0.5" />
      <p className="text-sm text-foreground leading-snug">{perkApplied}</p>
    </div>
  );
}

function SuccessCard({
  result,
  onReset,
}: {
  result: CouponRedemptionResult;
  onReset: () => void;
}) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="text-center space-y-6"
      data-ocid="redeem-success"
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
        style={{
          background:
            "radial-gradient(circle, rgba(0,255,65,0.2) 0%, transparent 70%)",
          border: "2px solid rgba(0,255,65,0.5)",
          boxShadow: "0 0 40px rgba(0,255,65,0.35)",
        }}
      >
        <CheckCircle2 className="h-9 w-9 text-[#00ff41]" />
      </div>

      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Code Redeemed! 🎉
        </h2>
        <p className="text-muted-foreground text-sm">
          Your coupon{" "}
          <span className="font-mono font-bold text-foreground">
            {result.coupon.code}
          </span>{" "}
          has been applied successfully.
        </p>
      </div>

      <PerkDisplay perkApplied={result.perkApplied} />

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <NeonButton
          variant="green"
          size="lg"
          onClick={() => navigate({ to: "/" })}
          data-ocid="redeem-go-dashboard"
        >
          <Sparkles className="h-4 w-4" />
          Go to Dashboard
        </NeonButton>
        <NeonButton
          variant="outline"
          size="lg"
          onClick={onReset}
          data-ocid="redeem-another"
        >
          <Ticket className="h-4 w-4" />
          Redeem Another
        </NeonButton>
      </div>
    </motion.div>
  );
}

function RedeemPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [success, setSuccess] = useState<CouponRedemptionResult | null>(null);
  const redemption = useCouponRedemption();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    try {
      const result = await redemption.mutateAsync(code.trim().toUpperCase());
      setSuccess(result);
    } catch {
      // error shown via mutation error state
    }
  };

  return (
    <div
      className="min-h-[80vh] flex items-center justify-center py-10"
      data-ocid="redeem-page"
    >
      <div className="w-full max-w-md space-y-6">
        {/* Back link */}
        <motion.button
          type="button"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate({ to: "/pricing" })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          data-ocid="redeem-back-link"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Pricing
        </motion.button>

        <AnimatePresence mode="wait">
          {success ? (
            <GlassCard
              key="success"
              style={{
                border: "1px solid rgba(0,255,65,0.3)",
                boxShadow: "0 0 50px rgba(0,255,65,0.1)",
              }}
            >
              <SuccessCard
                result={success}
                onReset={() => {
                  setSuccess(null);
                  setCode("");
                  redemption.reset();
                }}
              />
            </GlassCard>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
            >
              {/* Glassmorphism card */}
              <div
                className="relative overflow-hidden rounded-2xl p-7"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,255,255,0.04) 0%, rgba(185,0,255,0.04) 100%)",
                  border: "1px solid rgba(0,255,255,0.25)",
                  boxShadow:
                    "0 0 60px rgba(0,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
                  backdropFilter: "blur(20px)",
                }}
                data-ocid="redeem-glass-card"
              >
                {/* Decorative glow */}
                <div
                  className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(185,0,255,0.18) 0%, transparent 70%)",
                  }}
                  aria-hidden="true"
                />
                <div
                  className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(0,255,255,0.12) 0%, transparent 70%)",
                  }}
                  aria-hidden="true"
                />

                <div className="relative z-10 space-y-6">
                  {/* Header */}
                  <div className="text-center space-y-3">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto"
                      style={{
                        background: "rgba(0,255,255,0.1)",
                        border: "1px solid rgba(0,255,255,0.3)",
                        boxShadow: "0 0 20px rgba(0,255,255,0.2)",
                      }}
                    >
                      <Ticket className="h-7 w-7 text-[#00ffff]" />
                    </div>
                    <div>
                      <h1 className="font-display text-2xl font-bold text-foreground">
                        Redeem a Code
                      </h1>
                      <p className="text-muted-foreground text-sm mt-1">
                        Enter your coupon code below to unlock perks
                      </p>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE HERE"
                        className="font-mono text-center text-lg tracking-widest uppercase h-12 border-[rgba(0,255,255,0.3)] focus:border-[rgba(0,255,255,0.6)] focus:ring-[rgba(0,255,255,0.15)]"
                        style={{ letterSpacing: "0.15em" }}
                        aria-label="Coupon code"
                        data-ocid="redeem-code-input"
                        autoFocus
                        autoComplete="off"
                        spellCheck={false}
                      />
                      {/* Error */}
                      <AnimatePresence>
                        {redemption.isError && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-red-400 text-center flex items-center justify-center gap-1.5"
                            data-ocid="redeem-error"
                          >
                            <span className="text-red-400">✗</span>
                            {redemption.error?.message ??
                              "Invalid or expired coupon code"}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <NeonButton
                      variant="cyan"
                      size="lg"
                      type="submit"
                      className="w-full"
                      disabled={!code.trim() || redemption.isPending}
                      data-ocid="redeem-submit-btn"
                      style={{ boxShadow: "0 0 24px rgba(0,255,255,0.25)" }}
                    >
                      <Zap className="h-4 w-4" />
                      {redemption.isPending ? "Redeeming…" : "Redeem Code"}
                    </NeonButton>
                  </form>

                  <p className="text-xs text-muted-foreground text-center">
                    Got a Pro coupon from a promotion or friend? Enter it here
                    to activate your perks instantly.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
