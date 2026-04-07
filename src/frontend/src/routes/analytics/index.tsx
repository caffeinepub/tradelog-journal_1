import { createActor } from "@/backend";
import type { PairStats } from "@/backend.d";
import { MetricsCards } from "@/components/analytics/MetricsCards";
import { PairBreakdown } from "@/components/analytics/PairBreakdown";
import {
  PnlBarChart,
  SAMPLE_MONTHLY,
  SAMPLE_WEEKLY,
} from "@/components/analytics/PnlBarChart";
import { SessionBreakdown } from "@/components/analytics/SessionBreakdown";
import { BlurredTeaser } from "@/components/ui/BlurredTeaser";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { useUserTier } from "@/hooks/use-user-tier";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import { BarChart3, Calendar, Lock, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Route as RootRoute } from "../__root";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/analytics",
  component: AnalyticsPage,
});

type DateRange = "week" | "month" | "lastMonth" | "all";

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "Last Month", value: "lastMonth" },
  { label: "All Time", value: "all" },
];

const TOOLTIP_STYLE = {
  background: "oklch(0.14 0 0)",
  border: "1px solid oklch(0.22 0.04 258)",
  borderRadius: "8px",
  color: "#e5e7eb",
  fontSize: "12px",
};

const AXIS_TICK = { fill: "#6b7280", fontSize: 11 };

// Win/loss per pair sample data for free users
const SAMPLE_WIN_LOSS: Array<{ pair: string; wins: number; losses: number }> = [
  { pair: "EUR/USD", wins: 8, losses: 4 },
  { pair: "NQ", wins: 5, losses: 3 },
  { pair: "XAU/USD", wins: 7, losses: 3 },
  { pair: "GBP/JPY", wins: 4, losses: 3 },
  { pair: "BTC/USDT", wins: 2, losses: 3 },
];

function WinLossChart({
  pairStats,
  isFree,
  onUpgrade,
}: {
  pairStats: PairStats[] | undefined;
  isFree: boolean;
  onUpgrade: () => void;
}) {
  const data =
    pairStats && pairStats.length > 0
      ? pairStats.map((p) => ({
          pair: p.pair,
          wins: Math.round(Number(p.tradeCount) * p.winRate),
          losses: Math.round(Number(p.tradeCount) * (1 - p.winRate)),
        }))
      : SAMPLE_WIN_LOSS;

  const chart = (
    <GlassCard>
      <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest mb-4">
        Win / Loss per Pair
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={isFree ? SAMPLE_WIN_LOSS : data}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
        >
          <XAxis
            dataKey="pair"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "oklch(0.2 0 0 / 0.5)" }}
          />
          <Legend wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }} />
          <Bar
            dataKey="wins"
            name="Wins"
            fill="#00ff41"
            fillOpacity={0.8}
            radius={[3, 3, 0, 0]}
            maxBarSize={24}
          />
          <Bar
            dataKey="losses"
            name="Losses"
            fill="#f87171"
            fillOpacity={0.8}
            radius={[3, 3, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );

  if (isFree) {
    return (
      <BlurredTeaser
        teaserText="See exactly where you win and where you leak money — unlock win/loss breakdown per pair"
        onUpgrade={onUpgrade}
      >
        {chart}
      </BlurredTeaser>
    );
  }

  return chart;
}

function AnalyticsPage() {
  const { isFree } = useUserTier();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const { actor, isFetching } = useActor(createActor);

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["metrics", dateRange],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const result = await actor.getMetrics();
        return result ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });

  return (
    <div className="space-y-7 fade-in" data-ocid="analytics-page">
      {/* ── Page header ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#00ff41]" />
            Performance Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Understand your trading edge — know what works, fix what doesn't
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range filter */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{
              background: "oklch(0.14 0 0)",
              border: "1px solid oklch(0.22 0.04 258)",
            }}
            data-ocid="analytics-date-filter"
          >
            <Calendar className="h-3.5 w-3.5 text-muted-foreground ml-2" />
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDateRange(opt.value)}
                data-ocid={`date-filter-${opt.value}`}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-smooth"
                style={
                  dateRange === opt.value
                    ? {
                        background: "oklch(0.72 0.2 142 / 0.2)",
                        color: "#00ff41",
                        border: "1px solid rgba(0,255,65,0.4)",
                      }
                    : { color: "#6b7280" }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>

          {isFree && (
            <NeonButton
              variant="purple"
              size="sm"
              onClick={() => setUpgradeOpen(true)}
              data-ocid="analytics-upgrade-header-cta"
            >
              <Zap className="h-3.5 w-3.5" />
              Unlock All
            </NeonButton>
          )}
        </div>
      </motion.div>

      {/* ── Free tier progress nudge ─────────────────── */}
      {isFree && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard
            className="flex items-center gap-3 py-3 px-4"
            style={{
              borderColor: "rgba(185,0,255,0.25)",
              background: "oklch(0.12 0 0 / 0.8)",
            }}
          >
            <Lock className="h-4 w-4 text-[#b900ff] shrink-0" />
            <p className="text-sm text-muted-foreground">
              You're on the{" "}
              <span className="text-foreground font-semibold">Free tier</span> —
              analytics are blurred. Upgrade to unlock every insight.
            </p>
            <NeonButton
              variant="purple"
              size="sm"
              className="ml-auto shrink-0"
              onClick={() => setUpgradeOpen(true)}
              data-ocid="analytics-tier-nudge-cta"
            >
              Go Pro
            </NeonButton>
          </GlassCard>
        </motion.div>
      )}

      {/* ── Metrics cards ────────────────────────────── */}
      <section>
        <MetricsCards
          metrics={isLoading ? null : metrics}
          isFree={isFree}
          onUpgrade={() => setUpgradeOpen(true)}
        />
      </section>

      {/* ── Weekly + Monthly P&L bar charts ──────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <PnlBarChart
          data={metrics?.weeklyPnl}
          title="Weekly P&L"
          sampleData={SAMPLE_WEEKLY}
          isFree={isFree}
          teaserText="Your best week was 3x your worst — unlock weekly P&L to see the full picture"
          onUpgrade={() => setUpgradeOpen(true)}
          variant="weekly"
        />
        <PnlBarChart
          data={metrics?.monthlyPnl}
          title="Monthly P&L"
          sampleData={SAMPLE_MONTHLY}
          isFree={isFree}
          teaserText="Monthly P&L breakdown reveals your best months and growth trajectory — unlock to see more"
          onUpgrade={() => setUpgradeOpen(true)}
          variant="monthly"
        />
      </section>

      {/* ── Pair + Strategy breakdowns ───────────────── */}
      <section>
        <PairBreakdown
          pairStats={metrics?.pnlByPair}
          strategyStats={metrics?.pnlByStrategy}
          isFree={isFree}
          onUpgrade={() => setUpgradeOpen(true)}
        />
      </section>

      {/* ── Session breakdown ────────────────────────── */}
      <section>
        <div className="mb-2">
          <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest">
            Session Analysis
          </h2>
        </div>
        <SessionBreakdown
          sessions={metrics?.pnlBySession}
          isFree={isFree}
          onUpgrade={() => setUpgradeOpen(true)}
        />
      </section>

      {/* ── Win / Loss per pair ──────────────────────── */}
      <section>
        <WinLossChart
          pairStats={metrics?.pnlByPair}
          isFree={isFree}
          onUpgrade={() => setUpgradeOpen(true)}
        />
      </section>

      {/* ── Upgrade CTA banner (free users only) ─────── */}
      {isFree && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          data-ocid="analytics-upgrade-banner"
        >
          <div
            className="rounded-2xl p-8 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.14 0 0) 0%, oklch(0.12 0.03 280) 100%)",
              border: "1px solid rgba(185,0,255,0.35)",
              boxShadow: "0 0 40px rgba(185,0,255,0.15)",
            }}
          >
            {/* decorative glow orbs */}
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(185,0,255,0.12) 0%, transparent 70%)",
                transform: "translate(30%, -30%)",
              }}
              aria-hidden="true"
            />
            <div
              className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(0,255,65,0.08) 0%, transparent 70%)",
                transform: "translate(-30%, 30%)",
              }}
              aria-hidden="true"
            />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-3 max-w-lg">
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: "rgba(185,0,255,0.15)",
                    color: "#b900ff",
                    border: "1px solid rgba(185,0,255,0.3)",
                  }}
                >
                  <Zap className="h-3 w-3" />
                  PRO ANALYTICS
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground leading-tight">
                  Unlock Full Analytics
                  <br />
                  <span style={{ color: "#b900ff" }}>for $9/month</span>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Stop trading blind. Get session-by-session breakdown, strategy
                  win rates, pair performance deep dives, and monthly trend
                  analysis.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
                  {[
                    "Full metrics dashboard",
                    "Weekly & monthly P&L",
                    "Session performance breakdown",
                    "Strategy analytics",
                    "Win/loss per pair",
                    "Unlimited trade history",
                  ].map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-muted-foreground"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: "#00ff41" }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3 shrink-0">
                <NeonButton
                  variant="purple"
                  size="lg"
                  onClick={() => setUpgradeOpen(true)}
                  data-ocid="analytics-upgrade-banner-cta"
                  className="min-w-[180px]"
                >
                  <Zap className="h-4 w-4" />
                  Go Pro Now
                </NeonButton>
                <p className="text-xs text-muted-foreground text-center">
                  Cancel anytime · No commitment
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        triggerReason="Full analytics including session breakdown, monthly P&L, win/loss per pair, and strategy insights are Pro only."
      />
    </div>
  );
}
