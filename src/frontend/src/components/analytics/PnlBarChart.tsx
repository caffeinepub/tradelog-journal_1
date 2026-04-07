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

interface PnlBarChartProps {
  data: PnlDataPoint[] | undefined;
  title: string;
  isFree: boolean;
  teaserText: string;
  onUpgrade: () => void;
  variant?: "weekly" | "monthly";
}

function EmptyChartBody({ title }: { title: string }) {
  return (
    <GlassCard>
      <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest mb-4">
        {title}
      </h2>
      <div className="h-[200px] flex flex-col items-center justify-center gap-2">
        <p className="text-sm text-muted-foreground">No P&L data yet</p>
        <p className="text-xs text-muted-foreground/60">
          Log trades to see your performance chart
        </p>
      </div>
    </GlassCard>
  );
}

function ChartBody({
  data,
  title,
}: {
  data: PnlDataPoint[];
  title: string;
}) {
  if (!data.length) return <EmptyChartBody title={title} />;

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
  isFree,
  teaserText,
  onUpgrade,
}: PnlBarChartProps) {
  if (isFree) {
    return (
      <BlurredTeaser teaserText={teaserText} onUpgrade={onUpgrade}>
        <EmptyChartBody title={title} />
      </BlurredTeaser>
    );
  }

  return <ChartBody data={data ?? []} title={title} />;
}
