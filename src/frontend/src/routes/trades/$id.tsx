import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  ImageIcon,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Route as RootRoute } from "../__root";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/trades/$id",
  component: TradeDetailPage,
});

// Simulated store — in production, replace with useQuery from hooks/useQueries.ts
const sampleTrades: Record<
  string,
  {
    id: string;
    pair: string;
    direction: "LONG" | "SHORT";
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    riskReward: number;
    strategyTag: string;
    mistakeTag?: string;
    sessionTime: string;
    marketCondition: string;
    notes: string;
    chartImageUrl?: string;
    entryDate: number;
    exitDate: number;
  }
> = {
  "1": {
    id: "1",
    pair: "EUR/USD",
    direction: "LONG",
    entryPrice: 1.0842,
    exitPrice: 1.0889,
    pnl: 245,
    riskReward: 2.1,
    strategyTag: "Breakout",
    sessionTime: "LONDON",
    marketCondition: "TRENDING",
    notes:
      "Clean break above key resistance at 1.0840. Entered on retest. Target hit within 45 minutes of London open. No issues with execution. Textbook setup.",
    entryDate: Date.now() - 3600000,
    exitDate: Date.now() - 1800000,
  },
  "2": {
    id: "2",
    pair: "BTC/USDT",
    direction: "SHORT",
    entryPrice: 68450,
    exitPrice: 68725,
    pnl: -125,
    riskReward: -0.8,
    strategyTag: "Reversal",
    mistakeTag: "Moved stop loss",
    sessionTime: "NY",
    marketCondition: "VOLATILE",
    notes:
      "Moved stop too early — got stopped out. Market continued as expected after.",
    entryDate: Date.now() - 7200000,
    exitDate: Date.now() - 5400000,
  },
  "3": {
    id: "3",
    pair: "GBP/JPY",
    direction: "LONG",
    entryPrice: 194.25,
    exitPrice: 194.87,
    pnl: 380,
    riskReward: 3.4,
    strategyTag: "Trend Follow",
    sessionTime: "LONDON",
    marketCondition: "TRENDING",
    notes: "Perfect structure follow-through. Held through two pullbacks.",
    entryDate: Date.now() - 86400000,
    exitDate: Date.now() - 79200000,
  },
  "4": {
    id: "4",
    pair: "NQ",
    direction: "LONG",
    entryPrice: 20125,
    exitPrice: 20289,
    pnl: 720,
    riskReward: 4.2,
    strategyTag: "Open Drive",
    sessionTime: "NY",
    marketCondition: "TRENDING",
    notes: "Classic gap-and-go at the open. Full target reached.",
    entryDate: Date.now() - 172800000,
    exitDate: Date.now() - 169200000,
  },
  "5": {
    id: "5",
    pair: "XAU/USD",
    direction: "SHORT",
    entryPrice: 2342.5,
    exitPrice: 2328.0,
    pnl: 580,
    riskReward: 2.9,
    strategyTag: "Breakdown",
    sessionTime: "LONDON",
    marketCondition: "RANGING",
    notes: "Supply zone rejection with confirmation. Clean entry.",
    entryDate: Date.now() - 259200000,
    exitDate: Date.now() - 255600000,
  },
};

function TradeDetailPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams() as { id: string };
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [showChartUpload, setShowChartUpload] = useState(false);

  const trade = sampleTrades[id] ?? {
    id,
    pair: "UNKNOWN",
    direction: "LONG" as const,
    entryPrice: 0,
    exitPrice: 0,
    pnl: 0,
    riskReward: 0,
    strategyTag: "—",
    sessionTime: "OTHER",
    marketCondition: "OTHER",
    notes: "",
    entryDate: Date.now(),
    exitDate: Date.now(),
  };

  const isWin = trade.pnl >= 0;

  function handleDelete() {
    setDeleteOpen(false);
    navigate({ to: "/trades" });
  }

  return (
    <div
      className="max-w-2xl mx-auto space-y-5 fade-in"
      data-ocid="trade-detail-page"
    >
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/trades" })}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          aria-label="Back to trades"
          data-ocid="trade-detail-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {trade.pair}
            </h1>
            <span
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${
                trade.direction === "LONG"
                  ? "bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/25"
                  : "bg-red-500/10 text-red-400 border border-red-500/25"
              }`}
            >
              {trade.direction === "LONG" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trade.direction}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(trade.entryDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <NeonButton
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/trades/new" })}
            data-ocid="trade-detail-edit"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </NeonButton>
          <NeonButton
            variant="purple"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            data-ocid="trade-detail-delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </NeonButton>
        </div>
      </div>

      {/* Key Metrics */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <GlassCard
          glow="green"
          className="text-center py-4 px-3 space-y-1"
          style={
            {
              borderColor: isWin
                ? "rgba(0,255,65,0.3)"
                : "rgba(248,113,113,0.3)",
              boxShadow: isWin
                ? "0 0 20px rgba(0,255,65,0.1)"
                : "0 0 20px rgba(248,113,113,0.1)",
            } as React.CSSProperties
          }
        >
          <p className="text-xs text-muted-foreground">P&L</p>
          <p
            className="font-display text-2xl font-bold"
            style={{ color: isWin ? "#00ff41" : "#f87171" }}
          >
            {isWin ? "+" : ""}${Math.abs(trade.pnl).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            {isWin ? "Profit" : "Loss"}
          </p>
        </GlassCard>

        <GlassCard
          glow="cyan"
          className="text-center py-4 px-3 space-y-1"
          style={
            {
              borderColor: "rgba(0,255,255,0.3)",
              boxShadow: "0 0 20px rgba(0,255,255,0.1)",
            } as React.CSSProperties
          }
        >
          <p className="text-xs text-muted-foreground">Risk:Reward</p>
          <p className="font-display text-2xl font-bold text-[#00ffff]">
            {trade.riskReward >= 0 ? "+" : ""}
            {trade.riskReward.toFixed(2)}R
          </p>
          <p className="text-xs text-muted-foreground">Ratio</p>
        </GlassCard>

        <GlassCard className="text-center py-4 px-3 space-y-1">
          <p className="text-xs text-muted-foreground">Session</p>
          <p
            className="font-display text-2xl font-bold"
            style={{ color: "#b900ff" }}
          >
            {trade.sessionTime}
          </p>
          <p className="text-xs text-muted-foreground">Market</p>
        </GlassCard>
      </motion.div>

      {/* Entry & Exit Details */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard>
          <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-4">
            Entry &amp; Exit
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              {
                label: "Entry Price",
                value: trade.entryPrice.toString(),
                mono: true,
              },
              {
                label: "Exit Price",
                value: trade.exitPrice.toString(),
                mono: true,
              },
              {
                label: "Entry Time",
                value: new Date(trade.entryDate).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                icon: <Clock className="h-3 w-3" />,
              },
              {
                label: "Exit Time",
                value: new Date(trade.exitDate).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                icon: <Clock className="h-3 w-3" />,
              },
            ].map(({ label, value, mono, icon }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  {icon}
                  {label}
                </p>
                <p
                  className={`font-medium text-foreground ${mono ? "font-mono" : ""}`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Tags */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <GlassCard>
          <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">
            Tags &amp; Classification
          </h2>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-[#00ff41]/10 text-[#00ff41] border-[#00ff41]/30 hover:bg-[#00ff41]/10">
              📈 {trade.strategyTag}
            </Badge>
            <Badge className="bg-muted/60 text-foreground border-border hover:bg-muted/60">
              📊 {trade.marketCondition}
            </Badge>
            <Badge className="bg-[#00ffff]/10 text-[#00ffff] border-[#00ffff]/30 hover:bg-[#00ffff]/10">
              🕐 {trade.sessionTime}
            </Badge>
            {trade.mistakeTag && (
              <Badge className="bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/10">
                ⚠ {trade.mistakeTag}
              </Badge>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Notes */}
      {trade.notes && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard>
            <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">
              Notes &amp; Reflections
            </h2>
            <p className="text-sm text-foreground leading-relaxed">
              {trade.notes}
            </p>
          </GlassCard>
        </motion.div>
      )}

      {/* Chart Image */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <GlassCard>
          <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">
            Chart Screenshot
          </h2>
          {trade.chartImageUrl ? (
            <img
              src={trade.chartImageUrl}
              alt={`${trade.pair} chart`}
              className="w-full rounded-lg object-cover"
            />
          ) : (
            <div
              className="flex flex-col items-center justify-center h-44 rounded-lg border border-dashed bg-muted/10 gap-3"
              style={{ borderColor: "oklch(0.22 0.04 258)" }}
            >
              <div
                className="p-3 rounded-full"
                style={{ background: "oklch(0.72 0.2 142 / 0.08)" }}
              >
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm text-foreground font-medium">
                  No chart uploaded
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload a screenshot to annotate your trade
                </p>
              </div>
              <NeonButton
                variant="outline"
                size="sm"
                onClick={() => setShowChartUpload(!showChartUpload)}
                data-ocid="trade-detail-upload-chart"
              >
                Upload Chart
              </NeonButton>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(v) => !v && setDeleteOpen(false)}
      >
        <DialogContent
          className="max-w-sm"
          style={{
            background: "oklch(0.14 0.04 258 / 0.97)",
            backdropFilter: "blur(20px)",
          }}
          data-ocid="trade-delete-dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-foreground">
              Delete Trade?
            </DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <span className="font-mono font-semibold text-foreground">
                {trade.pair}
              </span>{" "}
              from your journal. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <NeonButton
              variant="outline"
              size="md"
              onClick={() => setDeleteOpen(false)}
              data-ocid="delete-cancel"
            >
              Cancel
            </NeonButton>
            <NeonButton
              variant="purple"
              size="md"
              onClick={handleDelete}
              data-ocid="delete-confirm"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </NeonButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
