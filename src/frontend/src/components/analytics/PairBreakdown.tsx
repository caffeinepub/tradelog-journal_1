import type { PairStats, StrategyStats } from "@/backend.d";
import { BlurredTeaser } from "@/components/ui/BlurredTeaser";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TOOLTIP_STYLE = {
  background: "oklch(0.14 0 0)",
  border: "1px solid oklch(0.22 0.04 258)",
  borderRadius: "8px",
  color: "#e5e7eb",
  fontSize: "12px",
};

const AXIS_TICK = { fill: "#6b7280", fontSize: 11 };

const SAMPLE_PAIRS: PairStats[] = [
  { pair: "EUR/USD", totalPnl: 845, winRate: 0.72, tradeCount: BigInt(12) },
  { pair: "NQ", totalPnl: 720, winRate: 0.65, tradeCount: BigInt(8) },
  { pair: "XAU/USD", totalPnl: 580, winRate: 0.68, tradeCount: BigInt(10) },
  { pair: "GBP/JPY", totalPnl: 380, winRate: 0.6, tradeCount: BigInt(7) },
  { pair: "BTC/USDT", totalPnl: -125, winRate: 0.4, tradeCount: BigInt(5) },
  { pair: "GBP/USD", totalPnl: -210, winRate: 0.38, tradeCount: BigInt(6) },
];

const SAMPLE_STRATEGIES: StrategyStats[] = [
  { tag: "Breakout", totalPnl: 1240, winRate: 0.71, tradeCount: BigInt(15) },
  { tag: "Reversal", totalPnl: 620, winRate: 0.62, tradeCount: BigInt(11) },
  { tag: "Scalp", totalPnl: -180, winRate: 0.45, tradeCount: BigInt(9) },
  { tag: "Trend Follow", totalPnl: 860, winRate: 0.67, tradeCount: BigInt(13) },
];

interface PairBreakdownProps {
  pairStats: PairStats[] | undefined;
  strategyStats: StrategyStats[] | undefined;
  isFree: boolean;
  onUpgrade: () => void;
}

function PairChart({ data }: { data: PairStats[] }) {
  return (
    <GlassCard>
      <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest mb-4">
        P&L by Pair
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
        >
          <XAxis
            type="number"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${v}`}
          />
          <YAxis
            type="category"
            dataKey="pair"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(
              v: number,
              _name: string,
              props: { payload?: PairStats },
            ) => [
              `$${v.toFixed(2)} (${((props.payload?.winRate ?? 0) * 100).toFixed(0)}% WR)`,
              "P&L",
            ]}
            cursor={{ fill: "oklch(0.2 0 0 / 0.5)" }}
          />
          <Bar dataKey="totalPnl" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {data.map((d, i) => (
              <Cell
                key={`${d.pair}-${i}`}
                fill={d.totalPnl >= 0 ? "#00ff41" : "#f87171"}
                opacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

function StrategyChart({ data }: { data: StrategyStats[] }) {
  const STRATEGY_COLORS = ["#00ff41", "#00ffff", "#b900ff", "#f59e0b"];

  return (
    <GlassCard>
      <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest mb-4">
        P&L by Strategy
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="tag"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${v}`}
            width={48}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(
              v: number,
              _name: string,
              props: { payload?: StrategyStats },
            ) => [
              `$${v.toFixed(2)} (${((props.payload?.winRate ?? 0) * 100).toFixed(0)}% WR)`,
              "P&L",
            ]}
            cursor={{ fill: "oklch(0.2 0 0 / 0.5)" }}
          />
          <Bar dataKey="totalPnl" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((d, i) => (
              <Cell
                key={`${d.tag}-${i}`}
                fill={
                  d.totalPnl >= 0
                    ? STRATEGY_COLORS[i % STRATEGY_COLORS.length]
                    : "#f87171"
                }
                opacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

export function PairBreakdown({
  pairStats,
  strategyStats,
  isFree,
  onUpgrade,
}: PairBreakdownProps) {
  const pData = pairStats && pairStats.length > 0 ? pairStats : SAMPLE_PAIRS;
  const sData =
    strategyStats && strategyStats.length > 0
      ? strategyStats
      : SAMPLE_STRATEGIES;

  if (isFree) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <BlurredTeaser
          teaserText="You lose most on GBP/USD — want to know why? Unlock pair analytics"
          onUpgrade={onUpgrade}
        >
          <PairChart data={SAMPLE_PAIRS} />
        </BlurredTeaser>
        <BlurredTeaser
          teaserText="Your Breakout strategy outperforms all others — unlock to see the full breakdown"
          onUpgrade={onUpgrade}
        >
          <StrategyChart data={SAMPLE_STRATEGIES} />
        </BlurredTeaser>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <PairChart data={pData} />
      <StrategyChart data={sData} />
    </div>
  );
}

export { SAMPLE_PAIRS };
