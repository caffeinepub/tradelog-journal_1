import type { PerformanceMetrics } from "@/backend.d";
import { BlurredTeaser } from "@/components/ui/BlurredTeaser";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Award,
  BarChart3,
  DollarSign,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";

interface MetricsCardsProps {
  metrics: PerformanceMetrics | null | undefined;
  isFree: boolean;
  onUpgrade: () => void;
}

interface MetricConfig {
  label: string;
  getValue: (m: PerformanceMetrics) => string;
  color: string;
  icon: React.ElementType;
  isPositive?: (m: PerformanceMetrics) => boolean;
}

const METRIC_CONFIGS: MetricConfig[] = [
  {
    label: "Win Rate",
    getValue: (m) => `${(m.winRate * 100).toFixed(1)}%`,
    color: "#00ff41",
    icon: Target,
  },
  {
    label: "Total P&L",
    getValue: (m) => `${m.totalPnl >= 0 ? "+" : ""}$${m.totalPnl.toFixed(2)}`,
    color: "#00ff41",
    icon: DollarSign,
    isPositive: (m) => m.totalPnl >= 0,
  },
  {
    label: "Max Drawdown",
    getValue: (m) => `-$${Math.abs(m.maxDrawdown).toFixed(2)}`,
    color: "#f87171",
    icon: TrendingDown,
  },
  {
    label: "Avg R:R",
    getValue: (m) => `${m.avgRiskReward.toFixed(2)}R`,
    color: "#00ffff",
    icon: BarChart3,
  },
  {
    label: "Best Pair",
    getValue: (m) => m.bestPair ?? "—",
    color: "#00ff41",
    icon: TrendingUp,
  },
  {
    label: "Worst Pair",
    getValue: (m) => m.worstPair ?? "—",
    color: "#f87171",
    icon: Award,
  },
];

// Sample fallback for skeleton/blur effect
const SAMPLE_METRICS: PerformanceMetrics = {
  winRate: 0.685,
  totalPnl: 2920,
  maxDrawdown: 205,
  bestPair: "EUR/USD",
  worstPair: "GBP/USD",
  avgRiskReward: 2.3,
  pnlByPair: [],
  pnlByStrategy: [],
  pnlBySession: [],
  weeklyPnl: [],
  monthlyPnl: [],
  computedAt: BigInt(0),
  userId: {} as PerformanceMetrics["userId"],
};

function MetricCard({
  config,
  metrics,
  index,
}: {
  config: MetricConfig;
  metrics: PerformanceMetrics;
  index: number;
}) {
  const value = config.getValue(metrics);
  const isPnl = config.label === "Total P&L";
  const color = isPnl
    ? metrics.totalPnl >= 0
      ? "#00ff41"
      : "#f87171"
    : config.color;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
    >
      <GlassCard
        className="p-4 space-y-2"
        glow="none"
        data-ocid={`metric-${config.label.toLowerCase().replace(/[^a-z]/g, "-")}`}
        style={{
          borderColor: `${color}22`,
          boxShadow: `0 0 12px ${color}18`,
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {config.label}
          </p>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p
          className="font-display text-xl font-bold leading-none"
          style={{ color }}
        >
          {value}
        </p>
      </GlassCard>
    </motion.div>
  );
}

export function MetricsCards({
  metrics,
  isFree,
  onUpgrade,
}: MetricsCardsProps) {
  const data = metrics ?? SAMPLE_METRICS;

  const grid = (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {METRIC_CONFIGS.map((config, i) => (
        <MetricCard
          key={config.label}
          config={config}
          metrics={data}
          index={i}
        />
      ))}
    </div>
  );

  if (isFree) {
    return (
      <BlurredTeaser
        teaserText="Your metrics are locked — see win rate, P&L, drawdown and more with Pro"
        ctaText="Unlock Metrics"
        onUpgrade={onUpgrade}
      >
        {grid}
      </BlurredTeaser>
    );
  }

  return grid;
}
