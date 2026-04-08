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
  BarChart2,
  BarChart3,
  Crown,
  FileUp,
  Lock,
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
  // No requireAuth — this route is publicly accessible
  component: IndexPage,
});

// ─── Data hooks ─────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Sub-components (shared) ────────────────────────────────────────────────

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

function DailyChip({ count, limit }: { count: number; limit: number }) {
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

// ─── Public Landing Page ─────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <BarChart2 className="h-5 w-5" />,
    color: "#00ff41",
    title: "Performance Dashboard",
    desc: "Win rate, P&L, drawdown, best pairs, and weekly summaries at a glance.",
  },
  {
    icon: <Activity className="h-5 w-5" />,
    color: "#00ffff",
    title: "Trade Journal",
    desc: "Log every trade with strategy tags, session, market condition, and annotated charts.",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    color: "#b900ff",
    title: "Advanced Analytics",
    desc: "Drill into your edge — by pair, session, strategy, and time-of-day patterns.",
  },
  {
    icon: <FileUp className="h-5 w-5" />,
    color: "#facc15",
    title: "CSV Import",
    desc: "Bulk-load your trade history with the column-mapping wizard. Any broker export works.",
  },
  {
    icon: <Lock className="h-5 w-5" />,
    color: "#00ffff",
    title: "Privacy-First Auth",
    desc: "Login with Internet Identity — no passwords, no email, secured by device biometrics.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    color: "#b900ff",
    title: "AI Insights (Pro)",
    desc: "Unlock pattern recognition and AI-powered coaching tailored to your trading style.",
  },
];

function LandingPage() {
  const { login, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      className="dark min-h-screen bg-background text-foreground flex flex-col"
      data-ocid="landing-page"
    >
      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 border-b border-border/50 backdrop-blur-xl"
        style={{ background: "rgba(8,8,12,0.85)" }}
        data-ocid="landing-nav"
      >
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(0,255,65,0.12)",
                border: "1px solid rgba(0,255,65,0.4)",
                boxShadow: "0 0 12px rgba(0,255,65,0.2)",
              }}
            >
              <TrendingUp
                className="h-3.5 w-3.5"
                style={{ color: "#00ff41" }}
              />
            </div>
            <span className="font-display font-bold text-base tracking-tight text-foreground">
              TradeLog
            </span>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: "/pricing" })}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
              data-ocid="landing-nav-pricing"
            >
              Pricing
            </button>
            <NeonButton
              variant="green"
              size="sm"
              onClick={() => login()}
              disabled={authLoading}
              data-ocid="landing-nav-login-btn"
            >
              <LogIn className="h-3.5 w-3.5" />
              {authLoading ? "Loading…" : "Log In"}
            </NeonButton>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="flex-1 flex flex-col items-center justify-center px-5 py-20 text-center relative overflow-hidden"
        data-ocid="landing-hero"
      >
        {/* Background glow orbs */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, rgba(0,255,65,0.06) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-10 right-10 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(185,0,255,0.07) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-5"
        >
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(0,255,65,0.08)",
              border: "1px solid rgba(0,255,65,0.3)",
              color: "#00ff41",
            }}
          >
            <Zap className="h-3 w-3" />
            Built for serious traders
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight max-w-3xl"
        >
          Your trading edge,{" "}
          <span style={{ color: "#00ff41" }}>finally visible.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed"
        >
          TradeLog is a Gen Z-native trading journal. Log trades, track your
          P&amp;L, analyse your patterns, and level up your strategy — all in
          one dark, neon-lit dashboard.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-3"
        >
          <NeonButton
            variant="green"
            size="lg"
            onClick={() => login()}
            disabled={authLoading}
            data-ocid="landing-hero-login-btn"
          >
            <LogIn className="h-4 w-4" />
            {authLoading ? "Loading…" : "Get Started Free"}
          </NeonButton>
          <NeonButton
            variant="outline"
            size="lg"
            onClick={() => navigate({ to: "/pricing" })}
            data-ocid="landing-hero-pricing-btn"
          >
            View Pricing
          </NeonButton>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-4 text-xs text-muted-foreground/60"
        >
          Free plan available · No credit card required · Internet Identity
          login
        </motion.p>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────── */}
      <section
        className="py-16 px-5"
        style={{ background: "rgba(255,255,255,0.02)" }}
        data-ocid="landing-features"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Everything you need to trade smarter
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              From journaling to analytics — all your trading insights in one
              place.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <GlassCard hover className="h-full">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      background: `${f.color}14`,
                      border: `1px solid ${f.color}35`,
                    }}
                  >
                    <span style={{ color: f.color }}>{f.icon}</span>
                  </div>
                  <h3 className="font-display font-bold text-sm text-foreground mb-1">
                    {f.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ───────────────────────────────────────────── */}
      <section className="py-16 px-5" data-ocid="landing-pricing-teaser">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div
              className="relative overflow-hidden rounded-2xl p-8"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,255,65,0.05) 0%, rgba(0,255,255,0.03) 50%, rgba(185,0,255,0.05) 100%)",
                border: "1px solid rgba(0,255,65,0.2)",
                boxShadow: "0 0 40px rgba(0,255,65,0.06)",
              }}
            >
              <div
                className="absolute top-0 right-0 w-52 h-52 rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, rgba(185,0,255,0.1) 0%, transparent 70%)",
                }}
                aria-hidden="true"
              />
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground relative z-10">
                Start free.{" "}
                <span style={{ color: "#b900ff" }}>Unlock everything</span> for
                $9.99/mo.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground relative z-10 max-w-md mx-auto">
                Free plan includes 3 trade entries per day, basic journal, and
                win rate dashboard. Upgrade for unlimited entries, full
                analytics, and priority support.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
                <NeonButton
                  variant="green"
                  size="lg"
                  onClick={() => login()}
                  disabled={authLoading}
                  data-ocid="landing-pricing-cta-btn"
                >
                  <LogIn className="h-4 w-4" />
                  {authLoading ? "Loading…" : "Start for Free"}
                </NeonButton>
                <NeonButton
                  variant="outline"
                  size="lg"
                  onClick={() => navigate({ to: "/pricing" })}
                  data-ocid="landing-pricing-view-btn"
                >
                  <Crown className="h-4 w-4" />
                  See All Plans
                </NeonButton>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer
        className="border-t border-border bg-muted/20 px-5 py-4 text-center"
        data-ocid="landing-footer"
      >
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} TradeLog. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:opacity-80"
            style={{ color: "#00ff41" }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

// ─── Main Page (route-level component) ──────────────────────────────────────

function IndexPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show nothing while auth is still resolving — avoids a flash of the landing page
  // for users who are already logged in (they'll see the dashboard momentarily).
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-24"
        data-ocid="index-auth-check"
      >
        <LoadingSpinner size="sm" label="Loading…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <DashboardPage />;
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────

function DashboardPage() {
  const navigate = useNavigate();
  const { shortPrincipal } = useAuth();
  const { tier, isFree } = useUserTier();
  const limits = useTradeLimits();
  const { data: trades, isLoading: tradesLoading } = useRecentTrades();
  const { data: metrics } = useDashboardMetrics();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const displayTrades = trades ?? [];

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
      {/* ── Header ───────────────────────────────────────────────────── */}
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
            {(() => {
              const dailyPct = Math.min(
                100,
                Math.round(
                  (limits.dailyCount / Math.max(limits.dailyLimit, 1)) * 100,
                ),
              );
              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">
                      {limits.dailyLimitReached
                        ? "🚫 Daily limit reached!"
                        : "Today's entries"}
                    </p>
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      {limits.dailyCount}/{limits.dailyLimit} today
                    </span>
                  </div>
                  <ProgressBar value={dailyPct} showPercent={false} />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-muted-foreground">
                      {limits.dailyLimitReached
                        ? "Resets tomorrow — or upgrade for unlimited"
                        : `${limits.dailyLimit - limits.dailyCount} entries left today`}
                    </span>
                    <span
                      className="text-xs font-semibold font-mono"
                      style={{
                        color:
                          dailyPct >= 100
                            ? "#f87171"
                            : dailyPct >= 66
                              ? "#facc15"
                              : "#00ff41",
                      }}
                    >
                      {dailyPct}%
                    </span>
                  </div>
                </>
              );
            })()}
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
              className="text-xs transition-colors flex items-center gap-1 hover:opacity-80"
              style={{ color: "#b900ff" }}
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
              className="text-xs transition-colors hover:opacity-80"
              style={{ color: "#00ffff" }}
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
                    className="hover:underline"
                    style={{ color: "#00ff41" }}
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
                        className={`px-4 py-3 text-right font-mono font-bold ${t.pnl >= 0 ? "" : "text-red-400"}`}
                        style={t.pnl >= 0 ? { color: "#00ff41" } : undefined}
                      >
                        {t.pnl >= 0 ? "+" : "-"}${Math.abs(t.pnl).toFixed(2)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono text-xs font-semibold ${t.riskReward < 0 ? "text-red-400" : ""}`}
                        style={
                          t.riskReward >= 0 ? { color: "#00ffff" } : undefined
                        }
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

          {isFree && (
            <GlassCard className="p-4">
              <p className="text-xs text-muted-foreground leading-snug">
                <span className="font-semibold" style={{ color: "#b900ff" }}>
                  Pro tip:
                </span>{" "}
                Upgrade to Pro to see which sessions and pairs you perform best
                in —{" "}
                <button
                  type="button"
                  onClick={() => setUpgradeOpen(true)}
                  className="hover:underline"
                  style={{ color: "#b900ff" }}
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
          limits.dailyLimitReached
            ? "You've logged 3 trades today — the daily free limit. Upgrade for unlimited."
            : undefined
        }
      />
    </div>
  );
}
