import { createActor } from "@/backend";
import type { PerformanceMetrics as BackendMetrics } from "@/backend.d";
import { BlurredTeaser } from "@/components/ui/BlurredTeaser";
import { GlassCard } from "@/components/ui/GlassCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { NeonButton } from "@/components/ui/NeonButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { useAuth } from "@/hooks/use-auth";
import { useTradeLimits } from "@/hooks/use-trade-limits";
import { useUserTier } from "@/hooks/use-user-tier";
import type { Trade } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { createRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Crown,
  FileUp,
  LogIn,
  Percent,
  PlusCircle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Route as RootRoute } from "./__root";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/",
  component: DashboardPage,
});

// ─── Data hooks ────────────────────────────────────────────────────────────

function useRecentTrades() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Trade[]>({
    queryKey: ["recentTrades"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const raw = await actor.getTrades({});
        return raw.slice(0, 5).map((t) => ({
          id: String(t.id),
          pair: t.pair,
          direction: t.direction === "LONG" ? "LONG" : "SHORT",
          entryPrice: t.entryPrice,
          exitPrice: t.exitPrice,
          pnl: t.pnl,
          riskReward: t.riskReward,
          strategyTag: t.strategyTag,
          mistakeTag: t.mistakeTag,
          sessionTime: t.sessionTime as Trade["sessionTime"],
          marketCondition: t.marketCondition as Trade["marketCondition"],
          notes: t.notes,
          chartImageUrl: t.chartImageUrl,
          entryDate: t.entryDate,
          exitDate: t.exitDate,
          createdAt: t.createdAt,
        }));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

function useDashboardMetrics() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<BackendMetrics | null>({
    queryKey: ["dashboardMetrics"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return (await actor.getMetrics()) ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 120_000,
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatPnl(v: number) {
  const abs = Math.abs(v).toFixed(2);
  return v >= 0 ? `+$${abs}` : `-$${abs}`;
}

function relativeDate(ts: bigint) {
  const ms = Number(ts);
  const diff = Date.now() - ms;
  if (diff < 86_400_000) return "Today";
  if (diff < 172_800_000) return "Yesterday";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ─── Sub-components ────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: "FREE" | "PAID" }) {
  return tier === "PAID" ? (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{
        background: "rgba(185,0,255,0.15)",
        border: "1px solid rgba(185,0,255,0.5)",
        color: "#b900ff",
        boxShadow: "0 0 10px rgba(185,0,255,0.2)",
      }}
      data-ocid="tier-badge-paid"
    >
      <Crown className="h-3 w-3" />
      PRO
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: "rgba(0,255,65,0.08)",
        border: "1px solid rgba(0,255,65,0.3)",
        color: "#00ff41",
      }}
      data-ocid="tier-badge-free"
    >
      FREE
    </span>
  );
}

function DailyChip({
  count,
  limit,
}: {
  count: number;
  limit: number;
}) {
  const over = count >= limit;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold"
      style={{
        background: over ? "rgba(248,113,113,0.12)" : "rgba(0,255,255,0.08)",
        border: `1px solid ${over ? "rgba(248,113,113,0.4)" : "rgba(0,255,255,0.3)"}`,
        color: over ? "#f87171" : "#00ffff",
      }}
      data-ocid="daily-trade-chip"
    >
      <Activity className="h-3 w-3" />
      {count}/{limit} today
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  index: number;
  locked?: boolean;
  onUnlock?: () => void;
}

function MetricCard({
  label,
  value,
  sub,
  icon,
  color,
  index,
  locked,
  onUnlock,
}: MetricCardProps) {
  const glowMap: Record<string, "green" | "purple" | "cyan"> = {
    "#00ff41": "green",
    "#b900ff": "purple",
    "#00ffff": "cyan",
  };

  const card = (
    <GlassCard
      hover
      glow={glowMap[color] ?? "none"}
      className="h-full"
      data-ocid={`metric-card-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{
            background: `${color}1a`,
            border: `1px solid ${color}40`,
          }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        {locked && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
            style={{
              background: "rgba(185,0,255,0.12)",
              color: "#b900ff",
              border: "1px solid rgba(185,0,255,0.3)",
            }}
          >
            PRO
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
      <p className="font-display text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </GlassCard>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="h-full"
    >
      {locked ? (
        <BlurredTeaser
          teaserText="Unlock Pro to see your full metrics breakdown"
          ctaText="Unlock Now"
          onUpgrade={onUnlock}
        >
          {card}
        </BlurredTeaser>
      ) : (
        card
      )}
    </motion.div>
  );
}

// ─── Unauthenticated Landing Hero ──────────────────────────────────────────

function LandingHero() {
  const { login, isLoading } = useAuth();

  const features = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      color: "#00ff41",
      label: "Performance Analytics",
    },
    {
      icon: <Activity className="h-5 w-5" />,
      color: "#00ffff",
      label: "Live P&L Tracking",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      color: "#b900ff",
      label: "Win Rate Insights",
    },
  ];

  return (
    <div
      className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
      data-ocid="landing-hero"
    >
      {/* Background glow blobs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(0,255,65,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(185,0,255,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(0,255,255,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-2xl mx-auto"
      >
        {/* Logo mark */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center mb-6"
        >
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl"
            style={{
              background: "rgba(0,255,65,0.1)",
              border: "1px solid rgba(0,255,65,0.4)",
              boxShadow: "0 0 32px rgba(0,255,65,0.2)",
            }}
          >
            <TrendingUp className="h-8 w-8 text-[#00ff41]" />
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-xs font-mono font-bold tracking-[0.3em] uppercase mb-3"
          style={{ color: "#00ff41" }}
        >
          TradeLog Journal
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-4xl md:text-6xl font-black text-foreground leading-tight mb-4"
        >
          Trade smarter.
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #00ff41, #00ffff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Journal better.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-base md:text-lg mb-10 max-w-md mx-auto leading-relaxed"
        >
          Log every trade, track your performance, and unlock insights that make
          you a better trader.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-wrap items-center justify-center gap-2.5 mb-10"
        >
          {features.map(({ icon, color, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: `${color}12`,
                border: `1px solid ${color}30`,
                color,
              }}
            >
              <span style={{ color }}>{icon}</span>
              {label}
            </span>
          ))}
        </motion.div>

        {/* Glassmorphism CTA card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div
            className="relative inline-flex flex-col items-center gap-4 px-8 py-7 rounded-2xl mx-auto"
            style={{
              background: "rgba(0,255,65,0.04)",
              border: "1px solid rgba(0,255,65,0.3)",
              backdropFilter: "blur(12px)",
              boxShadow:
                "0 0 40px rgba(0,255,65,0.08), inset 0 1px 0 rgba(0,255,65,0.1)",
            }}
          >
            {/* Corner accent */}
            <div
              className="absolute -top-px -left-px w-12 h-12 rounded-tl-2xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,255,65,0.2) 0%, transparent 60%)",
              }}
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={() => login()}
              disabled={isLoading}
              className="flex items-center gap-3 px-8 py-3.5 rounded-xl font-display font-bold text-base transition-smooth disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,255,65,0.2) 0%, rgba(0,255,65,0.12) 100%)",
                border: "1px solid rgba(0,255,65,0.6)",
                color: "#00ff41",
                boxShadow:
                  "0 0 24px rgba(0,255,65,0.25), inset 0 1px 0 rgba(0,255,65,0.2)",
              }}
              data-ocid="landing-hero-login-btn"
              aria-label="Connect with Internet Identity to get started"
            >
              <LogIn className="h-5 w-5" />
              {isLoading ? "Connecting..." : "Get Started — It's Free"}
            </button>

            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: "#00ff41" }}
              />
              No password needed · Secured by Internet Identity
            </p>
          </div>
        </motion.div>

        {/* Bottom trust row */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-xs text-muted-foreground/50 mt-8"
        >
          Free tier · 5 trades/day · No credit card required
        </motion.p>
      </motion.div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

function DashboardPage() {
  const navigate = useNavigate();
  const { shortPrincipal, isAuthenticated } = useAuth();
  const { tier, isFree } = useUserTier();
  const limits = useTradeLimits();
  const { data: trades, isLoading: tradesLoading } = useRecentTrades();
  const { data: metrics } = useDashboardMetrics();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Show landing page for unauthenticated visitors
  if (!isAuthenticated) {
    return <LandingHero />;
  }

  const displayTrades = trades ?? [];

  // Metric values — real if available, zero/empty otherwise
  const winRate = metrics ? `${metrics.winRate.toFixed(1)}%` : "0.0%";
  const totalPnl = metrics ? formatPnl(metrics.totalPnl) : "$0.00";
  const totalTrades = String(limits.totalCount || displayTrades.length);
  const avgRR = metrics ? `${metrics.avgRiskReward.toFixed(2)}R` : "0.00R";
  const bestPair = metrics?.bestPair ?? "—";

  const metricCards: Omit<MetricCardProps, "index" | "locked" | "onUnlock">[] =
    [
      {
        label: "Win Rate",
        value: winRate,
        sub: "All-time",
        icon: <Percent className="h-4 w-4" />,
        color: "#00ff41",
      },
      {
        label: "Total P&L",
        value: totalPnl,
        sub: "Cumulative",
        icon: <TrendingUp className="h-4 w-4" />,
        color: metrics && metrics.totalPnl < 0 ? "#f87171" : "#00ff41",
      },
      {
        label: "Trades Logged",
        value: totalTrades,
        sub: `${limits.dailyCount} today`,
        icon: <Activity className="h-4 w-4" />,
        color: "#00ffff",
      },
      {
        label: "Avg Risk:Reward",
        value: avgRR,
        sub: "Per trade",
        icon: <BarChart3 className="h-4 w-4" />,
        color: "#b900ff",
      },
    ];

  return (
    <div className="space-y-7 fade-in" data-ocid="dashboard-page">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {shortPrincipal ? "Welcome back, Trader" : "TradeLog Dashboard"}
              </h1>
              <TierBadge tier={tier} />
              {isFree && (
                <DailyChip
                  count={limits.dailyCount}
                  limit={limits.dailyLimit}
                />
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              Your trading performance at a glance
              {shortPrincipal && (
                <span className="text-muted-foreground/50 ml-1 font-mono text-xs">
                  · {shortPrincipal}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div
          className="flex items-center gap-2 shrink-0"
          data-ocid="quick-actions"
        >
          <NeonButton
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/import" })}
            data-ocid="quick-action-import-csv"
          >
            <FileUp className="h-3.5 w-3.5" />
            Import CSV
          </NeonButton>
          <NeonButton
            variant="cyan"
            size="sm"
            onClick={() => navigate({ to: "/analytics" })}
            data-ocid="quick-action-view-analytics"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics
          </NeonButton>
          <NeonButton
            variant="green"
            size="md"
            onClick={() => navigate({ to: "/trades/new" })}
            data-ocid="quick-action-log-trade"
          >
            <PlusCircle className="h-4 w-4" />
            Log Trade
          </NeonButton>
        </div>
      </motion.div>

      {/* ── Free tier usage bar ──────────────────────────────────────── */}
      {isFree && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0.95 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard
            className="border border-border/60"
            data-ocid="free-tier-usage-bar"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">
                {limits.totalLimitReached
                  ? "🚫 Free tier limit reached!"
                  : "Free tier usage"}
              </p>
              <span className="font-mono text-xs font-bold text-muted-foreground">
                {limits.totalCount}/{limits.totalLimit} trades used
              </span>
            </div>
            <ProgressBar value={limits.totalPct} showPercent={false} />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-muted-foreground">
                {limits.totalLimit - limits.totalCount > 0
                  ? `${limits.totalLimit - limits.totalCount} trades remaining`
                  : "Upgrade to unlock unlimited trades"}
              </span>
              <span
                className="text-xs font-semibold font-mono"
                style={{
                  color:
                    limits.totalPct >= 80
                      ? "#f87171"
                      : limits.totalPct >= 50
                        ? "#facc15"
                        : "#00ff41",
                }}
              >
                {limits.totalPct}%
              </span>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* ── Metrics Grid ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-semibold text-foreground">
            Performance Overview
          </h2>
          {isFree && (
            <button
              type="button"
              onClick={() => setUpgradeOpen(true)}
              className="text-xs text-[#b900ff] hover:text-[#b900ff]/80 transition-colors flex items-center gap-1"
              data-ocid="metrics-unlock-prompt"
            >
              <Sparkles className="h-3 w-3" />
              Unlock full metrics
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card, i) => (
            <MetricCard
              key={card.label}
              {...card}
              index={i}
              locked={
                isFree &&
                (card.label === "Total P&L" || card.label === "Avg Risk:Reward")
              }
              onUnlock={() => setUpgradeOpen(true)}
            />
          ))}
        </div>
      </div>

      {/* ── Recent Trades + Insights ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Trades */}
        <motion.div
          className="lg:col-span-2 space-y-3"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-foreground">
              Recent Trades
            </h2>
            <button
              type="button"
              onClick={() => navigate({ to: "/trades" })}
              className="text-xs text-[#00ffff] hover:text-[#00ffff]/80 transition-colors"
              data-ocid="view-all-trades-link"
            >
              View all →
            </button>
          </div>

          <GlassCard className="p-0 overflow-hidden">
            {tradesLoading ? (
              <div className="flex items-center justify-center py-10">
                <LoadingSpinner size="sm" label="Loading trades..." />
              </div>
            ) : displayTrades.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-14 gap-3 text-center"
                data-ocid="recent-trades-empty"
              >
                <Zap
                  className="h-8 w-8 text-muted-foreground/40"
                  style={{ filter: "drop-shadow(0 0 4px rgba(0,255,65,0.2))" }}
                />
                <p className="text-sm text-muted-foreground">
                  No trades yet.{" "}
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/trades/new" })}
                    className="text-[#00ff41] hover:underline"
                    data-ocid="recent-trades-empty-cta"
                  >
                    Log your first trade
                  </button>{" "}
                  to get started.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{ borderBottom: "1px solid oklch(var(--border))" }}
                  >
                    {["Pair", "Dir", "P&L", "R:R", "Date"].map((h, idx) => (
                      <th
                        key={h}
                        className={`py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide ${idx === 0 ? "text-left px-4" : idx < 2 ? "text-left px-3" : "text-right px-4"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayTrades.slice(0, 5).map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => navigate({ to: "/trades" })}
                      onKeyUp={(e) =>
                        e.key === "Enter" && navigate({ to: "/trades" })
                      }
                      tabIndex={0}
                      data-ocid={`recent-trade-row-${t.pair}`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-foreground">
                        {t.pair}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background:
                              t.direction === "LONG"
                                ? "rgba(0,255,65,0.12)"
                                : "rgba(248,113,113,0.12)",
                            color:
                              t.direction === "LONG" ? "#00ff41" : "#f87171",
                            border: `1px solid ${t.direction === "LONG" ? "rgba(0,255,65,0.3)" : "rgba(248,113,113,0.3)"}`,
                          }}
                        >
                          {t.direction === "LONG" ? "↑ LONG" : "↓ SHORT"}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-bold ${t.pnl >= 0 ? "text-[#00ff41]" : "text-red-400"}`}
                      >
                        {t.pnl >= 0 ? "+" : "-"}${Math.abs(t.pnl).toFixed(2)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono text-xs font-semibold ${t.riskReward >= 0 ? "text-[#00ffff]" : "text-red-400"}`}
                      >
                        {t.riskReward >= 0 ? "+" : ""}
                        {t.riskReward.toFixed(1)}R
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {relativeDate(t.entryDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </GlassCard>
        </motion.div>

        {/* Insights Panel */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="font-display text-base font-semibold text-foreground">
            Insights
          </h2>

          {isFree ? (
            <BlurredTeaser
              teaserText="Log trades to unlock your best performing pair and session insights"
              ctaText="Unlock Pro"
              onUpgrade={() => setUpgradeOpen(true)}
              className="min-h-[200px]"
            >
              <GlassCard className="space-y-4 min-h-[200px]">
                <div className="space-y-3">
                  <InsightRow
                    icon={<TrendingUp className="h-4 w-4" />}
                    color="#00ff41"
                    label="Best pair"
                    value="—"
                  />
                  <InsightRow
                    icon={<TrendingDown className="h-4 w-4" />}
                    color="#f87171"
                    label="Worst session"
                    value="—"
                  />
                  <InsightRow
                    icon={<Activity className="h-4 w-4" />}
                    color="#00ffff"
                    label="Win streak"
                    value="—"
                  />
                </div>
              </GlassCard>
            </BlurredTeaser>
          ) : (
            <GlassCard glow="cyan" className="space-y-4">
              <InsightRow
                icon={<TrendingUp className="h-4 w-4" />}
                color="#00ff41"
                label="Best pair"
                value={bestPair}
              />
              <InsightRow
                icon={<TrendingDown className="h-4 w-4" />}
                color="#f87171"
                label="Worst pair"
                value={metrics?.worstPair ?? "—"}
              />
              <InsightRow
                icon={<Activity className="h-4 w-4" />}
                color="#00ffff"
                label="Best session"
                value={getBestSession(metrics)}
              />
            </GlassCard>
          )}

          {/* Strategy teaser */}
          {isFree && (
            <GlassCard className="p-4">
              <p className="text-xs text-muted-foreground leading-snug">
                <span className="text-[#b900ff] font-semibold">Pro tip:</span>{" "}
                Upgrade to Pro to see which sessions and pairs you perform best
                in —{" "}
                <button
                  type="button"
                  onClick={() => setUpgradeOpen(true)}
                  className="text-[#b900ff] hover:underline"
                  data-ocid="insight-unlock-btn"
                >
                  unlock to see more
                </button>
              </p>
            </GlassCard>
          )}
        </motion.div>
      </div>

      {/* ── Upgrade CTA Banner (free users) ─────────────────────────── */}
      {isFree && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div
            className="relative overflow-hidden rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,255,65,0.06) 0%, rgba(0,255,255,0.04) 50%, rgba(185,0,255,0.06) 100%)",
              border: "1px solid rgba(0,255,65,0.25)",
              boxShadow: "0 0 32px rgba(0,255,65,0.08)",
            }}
            data-ocid="upgrade-cta-banner"
          >
            {/* Decorative corner glow */}
            <div
              className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(185,0,255,0.15) 0%, transparent 70%)",
              }}
              aria-hidden="true"
            />

            <div className="relative z-10 min-w-0">
              <p className="font-display font-bold text-foreground text-base md:text-lg leading-tight">
                Unlock advanced chart patterns &amp; analysis tools!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Unlimited entries · Full analytics · All annotation tools ·
                Priority support
              </p>
            </div>

            <NeonButton
              variant="green"
              size="lg"
              className="relative z-10 shrink-0"
              onClick={() => setUpgradeOpen(true)}
              data-ocid="upgrade-banner-cta"
            >
              <Zap className="h-4 w-4" />
              Go Pro Now!
            </NeonButton>
            <button
              type="button"
              onClick={() => navigate({ to: "/redeem" })}
              className="relative z-10 text-sm font-semibold transition-colors hover:opacity-80 shrink-0"
              style={{ color: "#00ffff" }}
              data-ocid="upgrade-banner-redeem-link"
            >
              Have a code? Redeem →
            </button>
          </div>
        </motion.div>
      )}

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        triggerReason={
          limits.totalLimitReached
            ? "You've hit your free tier limit of 25 trades. Upgrade to keep journaling."
            : limits.dailyLimitReached
              ? "You've logged 5 trades today — the daily free limit. Upgrade for unlimited."
              : undefined
        }
      />
    </div>
  );
}

// ─── Insight Row ────────────────────────────────────────────────────────────

function InsightRow({
  icon,
  color,
  label,
  value,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-xs font-mono font-bold text-foreground">
        {value}
      </span>
    </div>
  );
}

function getBestSession(metrics: BackendMetrics | null | undefined): string {
  if (!metrics?.pnlBySession?.length) return "—";
  const best = [...metrics.pnlBySession].sort(
    (a, b) => b.totalPnl - a.totalPnl,
  )[0];
  const map: Record<string, string> = {
    LONDON: "London Open",
    NY: "NY Open",
    ASIAN: "Asian Session",
    OTHER: "Off-hours",
  };
  return map[best.session] ?? best.session;
}
