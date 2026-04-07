import type { PnlDataPoint } from "@/backend.d";
import { BlurredTeaser } from "@/components/ui/BlurredTeaser";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
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

const SAMPLE_WEEKLY: PnlDataPoint[] = [
  { periodLabel: "W1", pnl: 480, tradeCount: BigInt(5) },
  { periodLabel: "W2", pnl: -120, tradeCount: BigInt(4) },
  { periodLabel: "W3", pnl: 720, tradeCount: BigInt(7) },
  { periodLabel: "W4", pnl: 340, tradeCount: BigInt(6) },
  { periodLabel: "W5", pnl: -80, tradeCount: BigInt(3) },
  { periodLabel: "W6", pnl: 920, tradeCount: BigInt(8) },
];

const SAMPLE_MONTHLY: PnlDataPoint[] = [
  { periodLabel: "Jan", pnl: 1280, tradeCount: BigInt(22) },
  { periodLabel: "Feb", pnl: -340, tradeCount: BigInt(18) },
  { periodLabel: "Mar", pnl: 2100, tradeCount: BigInt(31) },
  { periodLabel: "Apr", pnl: 760, tradeCount: BigInt(24) },
  { periodLabel: "May", pnl: -180, tradeCount: BigInt(15) },
  { periodLabel: "Jun", pnl: 1450, tradeCount: BigInt(28) },
];

interface PnlBarChartProps {
  data: PnlDataPoint[] | undefined;
  title: string;
  sampleData: PnlDataPoint[];
  isFree: boolean;
  teaserText: string;
  onUpgrade: () => void;
  variant?: "weekly" | "monthly";
}

function ChartBody({
  data,
  title,
}: {
  data: PnlDataPoint[];
  title: string;
}) {
  return (
    <GlassCard>
      <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest mb-4">
        {title}
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="periodLabel"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
            }
            width={52}
          />
          <ReferenceLine y={0} stroke="oklch(0.3 0 0)" strokeDasharray="4 4" />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v: number) => [`$${v.toFixed(2)}`, "P&L"]}
            cursor={{ fill: "oklch(0.2 0 0 / 0.5)" }}
          />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((d, i) => (
              <Cell
                key={`${d.periodLabel}-${i}`}
                fill={d.pnl >= 0 ? "#00ff41" : "#f87171"}
                opacity={0.85}
                style={{
                  filter:
                    d.pnl >= 0
                      ? "drop-shadow(0 0 6px rgba(0,255,65,0.4))"
                      : "drop-shadow(0 0 6px rgba(248,113,113,0.4))",
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

export function PnlBarChart({
  data,
  title,
  sampleData,
  isFree,
  teaserText,
  onUpgrade,
}: PnlBarChartProps) {
  if (isFree) {
    return (
      <BlurredTeaser teaserText={teaserText} onUpgrade={onUpgrade}>
        <ChartBody data={sampleData} title={title} />
      </BlurredTeaser>
    );
  }

  const chartData = data && data.length > 0 ? data : sampleData;
  return <ChartBody data={chartData} title={title} />;
}

export { SAMPLE_WEEKLY, SAMPLE_MONTHLY };
