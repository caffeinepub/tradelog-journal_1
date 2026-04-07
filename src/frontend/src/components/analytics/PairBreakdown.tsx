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

interface PairBreakdownProps {
  pairStats: PairStats[] | undefined;
  strategyStats: StrategyStats[] | undefined;
  isFree: boolean;
  onUpgrade: () => void;
}

function EmptyChart({ title }: { title: string }) {
  return (
    <GlassCard>
      <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest mb-4">
        {title}
      </h2>
      <div className="h-[220px] flex flex-col items-center justify-center gap-2">
        <p className="text-sm text-muted-foreground">No data available yet</p>
        <p className="text-xs text-muted-foreground/60">
          Log trades to see your breakdown
        </p>
      </div>
    </GlassCard>
  );
}

function PairChart({ data }: { data: PairStats[] }) {
  if (!data.length) return <EmptyChart title="P&L by Pair" />;

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

  if (!data.length) return <EmptyChart title="P&L by Strategy" />;

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
  if (isFree) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <BlurredTeaser
          teaserText="See which pairs you profit from most — unlock pair analytics"
          onUpgrade={onUpgrade}
        >
          <EmptyChart title="P&L by Pair" />
        </BlurredTeaser>
        <BlurredTeaser
          teaserText="Discover which strategies work best for you — unlock to see the full breakdown"
          onUpgrade={onUpgrade}
        >
          <EmptyChart title="P&L by Strategy" />
        </BlurredTeaser>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <PairChart data={pairStats ?? []} />
      <StrategyChart data={strategyStats ?? []} />
    </div>
  );
}
