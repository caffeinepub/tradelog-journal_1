import type { SessionStats } from "@/backend.d";
import { BlurredTeaser } from "@/components/ui/BlurredTeaser";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
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

const SESSION_COLORS: Record<string, string> = {
  LONDON: "#00ff41",
  NY: "#00ffff",
  ASIAN: "#b900ff",
  OTHER: "#f59e0b",
};

function getBestSession(sessions: SessionStats[]): string {
  if (!sessions.length) return "—";
  const best = sessions.reduce((a, b) => (a.totalPnl > b.totalPnl ? a : b));
  const label = String(best.session);
  return label.charAt(0) + label.slice(1).toLowerCase();
}

function getWorstSession(sessions: SessionStats[]): string {
  if (!sessions.length) return "—";
  const worst = sessions.reduce((a, b) => (a.totalPnl < b.totalPnl ? a : b));
  const label = String(worst.session);
  return label.charAt(0) + label.slice(1).toLowerCase();
}

function SessionChart({ data }: { data: SessionStats[] }) {
  const radarData = data.map((s) => ({
    session: String(s.session),
    winRate: Math.round(s.winRate * 100),
    pnl: Math.max(0, s.totalPnl),
  }));

  return (
    <GlassCard>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div>
          <h3 className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3">
            P&L by Session
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <XAxis
                dataKey="session"
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) =>
                  v.charAt(0) + v.slice(1).toLowerCase()
                }
              />
              <YAxis
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v}`}
                width={40}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number) => [`$${v.toFixed(2)}`, "P&L"]}
                cursor={{ fill: "oklch(0.2 0 0 / 0.5)" }}
              />
              <Bar dataKey="totalPnl" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {data.map((d, i) => (
                  <Cell
                    key={`${String(d.session)}-${i}`}
                    fill={SESSION_COLORS[String(d.session)] ?? "#00ffff"}
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Win rate radar */}
        <div>
          <h3 className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3">
            Win Rate by Session
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart
              data={radarData}
              margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <PolarGrid stroke="oklch(0.25 0 0)" />
              <PolarAngleAxis
                dataKey="session"
                tick={AXIS_TICK}
                tickFormatter={(v: string) =>
                  v.charAt(0) + v.slice(1).toLowerCase()
                }
              />
              <Radar
                name="Win Rate %"
                dataKey="winRate"
                stroke="#00ffff"
                fill="#00ffff"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number) => [`${v}%`, "Win Rate"]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Session stat pills */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {data.map((s) => (
          <div
            key={String(s.session)}
            className="rounded-lg p-3 text-center"
            style={{
              background: `${SESSION_COLORS[String(s.session)] ?? "#00ffff"}10`,
              border: `1px solid ${SESSION_COLORS[String(s.session)] ?? "#00ffff"}30`,
            }}
          >
            <p
              className="text-xs font-bold uppercase"
              style={{ color: SESSION_COLORS[String(s.session)] ?? "#00ffff" }}
            >
              {String(s.session)}
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {s.totalPnl >= 0 ? "+" : ""}${s.totalPnl.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">
              {(s.winRate * 100).toFixed(0)}% WR · {String(s.tradeCount)} trades
            </p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function EmptySessionChart() {
  return (
    <GlassCard className="flex flex-col items-center justify-center py-14 gap-3 text-center">
      <p className="text-sm text-muted-foreground">No session data available</p>
      <p className="text-xs text-muted-foreground/60">
        Log trades to see your session breakdown
      </p>
    </GlassCard>
  );
}

interface SessionBreakdownProps {
  sessions: SessionStats[] | undefined;
  isFree: boolean;
  onUpgrade: () => void;
}

export function SessionBreakdown({
  sessions,
  isFree,
  onUpgrade,
}: SessionBreakdownProps) {
  const data = sessions && sessions.length > 0 ? sessions : [];

  const bestSession = getBestSession(data);
  const worstSession = getWorstSession(data);

  const teaserText =
    bestSession !== "—"
      ? `Your best session is ${bestSession} — upgrade to unlock details. You underperform most during ${worstSession} session.`
      : "Log trades to unlock your session performance breakdown";

  if (isFree) {
    return (
      <BlurredTeaser
        teaserText={teaserText}
        ctaText="Unlock Session Analytics"
        onUpgrade={onUpgrade}
      >
        <EmptySessionChart />
      </BlurredTeaser>
    );
  }

  if (!data.length) return <EmptySessionChart />;

  return <SessionChart data={data} />;
}
