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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  MarketCondition,
  SessionTime,
  Trade,
  TradeDirection,
} from "@/types";
import { createRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Filter,
  ImageIcon,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Route as RootRoute } from "../__root";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/trades",
  component: TradesPage,
});

// ─── Sample Data ──────────────────────────────────────────────────────────────

const sampleTrades: Trade[] = [
  {
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
      "Clean break above key resistance at 1.0840. Entered on retest. Target hit within 45 minutes of London open.",
    entryDate: BigInt(Date.now() - 3600000),
    exitDate: BigInt(Date.now() - 1800000),
    createdAt: BigInt(Date.now() - 1800000),
  },
  {
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
    notes: "Moved stop too early — got stopped out",
    entryDate: BigInt(Date.now() - 7200000),
    exitDate: BigInt(Date.now() - 5400000),
    createdAt: BigInt(Date.now() - 5400000),
  },
  {
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
    entryDate: BigInt(Date.now() - 86400000),
    exitDate: BigInt(Date.now() - 79200000),
    createdAt: BigInt(Date.now() - 79200000),
  },
  {
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
    entryDate: BigInt(Date.now() - 172800000),
    exitDate: BigInt(Date.now() - 169200000),
    createdAt: BigInt(Date.now() - 169200000),
  },
  {
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
    entryDate: BigInt(Date.now() - 259200000),
    exitDate: BigInt(Date.now() - 255600000),
    createdAt: BigInt(Date.now() - 255600000),
  },
  {
    id: "6",
    pair: "EUR/USD",
    direction: "SHORT",
    entryPrice: 1.0901,
    exitPrice: 1.0875,
    pnl: 195,
    riskReward: 1.8,
    strategyTag: "Reversal",
    sessionTime: "ASIAN",
    marketCondition: "RANGING",
    notes: "Double top formation at resistance. Conservative target.",
    entryDate: BigInt(Date.now() - 345600000),
    exitDate: BigInt(Date.now() - 342000000),
    createdAt: BigInt(Date.now() - 342000000),
  },
  {
    id: "7",
    pair: "ETH/USDT",
    direction: "LONG",
    entryPrice: 3420,
    exitPrice: 3390,
    pnl: -165,
    riskReward: -1.1,
    strategyTag: "Breakout",
    mistakeTag: "Entered too early",
    sessionTime: "NY",
    marketCondition: "CHOPPY",
    notes: "Premature entry before confirmation. Choppy market.",
    entryDate: BigInt(Date.now() - 432000000),
    exitDate: BigInt(Date.now() - 428400000),
    createdAt: BigInt(Date.now() - 428400000),
  },
  {
    id: "8",
    pair: "GBP/USD",
    direction: "LONG",
    entryPrice: 1.265,
    exitPrice: 1.271,
    pnl: 340,
    riskReward: 3.1,
    strategyTag: "Trend Follow",
    sessionTime: "LONDON",
    marketCondition: "TRENDING",
    notes: "Strong bullish momentum post-CPI. Held overnight.",
    entryDate: BigInt(Date.now() - 518400000),
    exitDate: BigInt(Date.now() - 432000000),
    createdAt: BigInt(Date.now() - 432000000),
  },
];

const PAGE_SIZE = 6;

type SortKey = "date" | "pnl" | "riskReward" | "pair";
type SortDir = "asc" | "desc";

interface Filters {
  search: string;
  direction: TradeDirection | "ALL";
  session: SessionTime | "ALL";
  condition: MarketCondition | "ALL";
  strategy: string;
  mistake: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DirectionChip({ direction }: { direction: TradeDirection }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
        direction === "LONG"
          ? "bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/25"
          : "bg-red-500/10 text-red-400 border border-red-500/25"
      }`}
    >
      {direction === "LONG" ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {direction}
    </span>
  );
}

function PnlValue({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span
      className={`font-mono font-semibold ${isPositive ? "text-[#00ff41]" : "text-red-400"}`}
    >
      {isPositive ? "+" : ""}${Math.abs(value).toFixed(2)}
    </span>
  );
}

function RRValue({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span
      className={`font-mono text-xs ${isPositive ? "text-[#00ffff]" : "text-red-400"}`}
    >
      {isPositive ? "+" : ""}
      {value.toFixed(2)}R
    </span>
  );
}

// ─── Trade Detail Drawer ──────────────────────────────────────────────────────

interface TradeDrawerProps {
  trade: Trade | null;
  open: boolean;
  onClose: () => void;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
}

function TradeDrawer({
  trade,
  open,
  onClose,
  onEdit,
  onDelete,
}: TradeDrawerProps) {
  if (!trade) return null;

  const fields = [
    { label: "Pair", value: trade.pair, mono: true },
    {
      label: "Direction",
      value: <DirectionChip direction={trade.direction} />,
    },
    { label: "Entry Price", value: trade.entryPrice.toString(), mono: true },
    { label: "Exit Price", value: trade.exitPrice.toString(), mono: true },
    { label: "P&L", value: <PnlValue value={trade.pnl} /> },
    { label: "Risk:Reward", value: <RRValue value={trade.riskReward} /> },
    { label: "Session", value: trade.sessionTime },
    { label: "Market Condition", value: trade.marketCondition },
    {
      label: "Entry Date",
      value: new Date(Number(trade.entryDate)).toLocaleString(),
    },
    {
      label: "Exit Date",
      value: new Date(Number(trade.exitDate)).toLocaleString(),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto"
        style={{
          background: "oklch(0.12 0.04 258 / 0.97)",
          backdropFilter: "blur(20px)",
          borderLeft: "1px solid oklch(0.22 0.04 258)",
        }}
        data-ocid="trade-detail-drawer"
      >
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-3 pr-8">
            <div
              className={`p-2 rounded-lg ${trade.direction === "LONG" ? "bg-[#00ff41]/10" : "bg-red-500/10"}`}
            >
              {trade.direction === "LONG" ? (
                <TrendingUp className="h-5 w-5 text-[#00ff41]" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div>
              <SheetTitle className="font-display text-xl font-bold text-foreground">
                {trade.pair}
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(Number(trade.entryDate)).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="py-4 space-y-4">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: "P&L",
                value: `${trade.pnl >= 0 ? "+" : ""}$${Math.abs(trade.pnl).toFixed(2)}`,
                color: trade.pnl >= 0 ? "#00ff41" : "#f87171",
              },
              {
                label: "R:R",
                value: `${trade.riskReward >= 0 ? "+" : ""}${trade.riskReward.toFixed(2)}R`,
                color: "#00ffff",
              },
              { label: "Session", value: trade.sessionTime, color: "#b900ff" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="glass-card text-center py-3 px-2 rounded-lg"
                style={{ borderColor: `${color}30` }}
              >
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="font-display font-bold text-sm" style={{ color }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Details Grid */}
          <div className="glass-card rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Trade Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              {fields.map(({ label, value, mono }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {label}
                  </p>
                  {typeof value === "string" ? (
                    <p
                      className={`text-sm font-medium text-foreground truncate ${mono ? "font-mono" : ""}`}
                    >
                      {value}
                    </p>
                  ) : (
                    <div className="mt-0.5">{value}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="glass-card rounded-lg p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Tags
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[#00ff41]/10 text-[#00ff41] border-[#00ff41]/30 hover:bg-[#00ff41]/10">
                {trade.strategyTag}
              </Badge>
              <Badge className="bg-muted/60 text-foreground border-border hover:bg-muted/60">
                {trade.marketCondition}
              </Badge>
              <Badge className="bg-[#00ffff]/10 text-[#00ffff] border-[#00ffff]/30 hover:bg-[#00ffff]/10">
                {trade.sessionTime}
              </Badge>
              {trade.mistakeTag && (
                <Badge className="bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/10">
                  ⚠ {trade.mistakeTag}
                </Badge>
              )}
            </div>
          </div>

          {/* Notes */}
          {trade.notes && (
            <div className="glass-card rounded-lg p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Notes
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {trade.notes}
              </p>
            </div>
          )}

          {/* Chart Image */}
          <div className="glass-card rounded-lg p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Chart Screenshot
            </p>
            {trade.chartImageUrl ? (
              <img
                src={trade.chartImageUrl}
                alt="Trade chart"
                className="w-full rounded-lg object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-32 rounded-lg border border-dashed border-border bg-muted/10 gap-2">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  No chart uploaded
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2" data-ocid="trade-drawer-actions">
            <NeonButton
              variant="outline"
              size="md"
              className="flex-1"
              onClick={() => onEdit(trade)}
              data-ocid="trade-detail-edit"
            >
              <Edit className="h-4 w-4" />
              Edit Trade
            </NeonButton>
            <NeonButton
              variant="purple"
              size="md"
              onClick={() => onDelete(trade)}
              data-ocid="trade-detail-delete"
            >
              <Trash2 className="h-4 w-4" />
            </NeonButton>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────

interface DeleteDialogProps {
  trade: Trade | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

function DeleteDialog({ trade, open, onClose, onConfirm }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
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
              {trade?.pair}
            </span>{" "}
            from your journal. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <NeonButton
            variant="outline"
            size="md"
            onClick={onClose}
            data-ocid="delete-cancel"
          >
            Cancel
          </NeonButton>
          <NeonButton
            variant="purple"
            size="md"
            onClick={() => trade && onConfirm(trade.id)}
            data-ocid="delete-confirm"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </NeonButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  strategies: string[];
  mistakes: string[];
  onClear: () => void;
  activeCount: number;
}

function FilterBar({
  filters,
  onChange,
  strategies,
  mistakes,
  onClear,
  activeCount,
}: FilterBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="glass-card rounded-lg p-3"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="h-3 w-3" />
          Filters
          {activeCount > 0 && (
            <span className="bg-[#00ff41]/20 text-[#00ff41] text-xs px-1.5 rounded-full">
              {activeCount}
            </span>
          )}
        </p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            data-ocid="filters-clear"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {/* Direction */}
        <Select
          value={filters.direction}
          onValueChange={(v) =>
            onChange({ direction: v as TradeDirection | "ALL" })
          }
        >
          <SelectTrigger
            size="sm"
            className="w-full bg-card/50 border-border text-xs"
            data-ocid="filter-direction"
          >
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Directions</SelectItem>
            <SelectItem value="LONG">Long</SelectItem>
            <SelectItem value="SHORT">Short</SelectItem>
          </SelectContent>
        </Select>

        {/* Session */}
        <Select
          value={filters.session}
          onValueChange={(v) => onChange({ session: v as SessionTime | "ALL" })}
        >
          <SelectTrigger
            size="sm"
            className="w-full bg-card/50 border-border text-xs"
            data-ocid="filter-session"
          >
            <SelectValue placeholder="Session" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Sessions</SelectItem>
            <SelectItem value="ASIAN">Asian</SelectItem>
            <SelectItem value="LONDON">London</SelectItem>
            <SelectItem value="NY">New York</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Market Condition */}
        <Select
          value={filters.condition}
          onValueChange={(v) =>
            onChange({ condition: v as MarketCondition | "ALL" })
          }
        >
          <SelectTrigger
            size="sm"
            className="w-full bg-card/50 border-border text-xs"
            data-ocid="filter-condition"
          >
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Conditions</SelectItem>
            <SelectItem value="TRENDING">Trending</SelectItem>
            <SelectItem value="RANGING">Ranging</SelectItem>
            <SelectItem value="VOLATILE">Volatile</SelectItem>
            <SelectItem value="CHOPPY">Choppy</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Strategy */}
        <Select
          value={filters.strategy || "ALL"}
          onValueChange={(v) => onChange({ strategy: v === "ALL" ? "" : v })}
        >
          <SelectTrigger
            size="sm"
            className="w-full bg-card/50 border-border text-xs"
            data-ocid="filter-strategy"
          >
            <SelectValue placeholder="Strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Strategies</SelectItem>
            {strategies.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mistake */}
        <Select
          value={filters.mistake || "ALL"}
          onValueChange={(v) => onChange({ mistake: v === "ALL" ? "" : v })}
        >
          <SelectTrigger
            size="sm"
            className="w-full bg-card/50 border-border text-xs"
            data-ocid="filter-mistake"
          >
            <SelectValue placeholder="Mistake" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Mistakes</SelectItem>
            {mistakes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  hasFilters,
  onLogTrade,
}: { hasFilters: boolean; onLogTrade: () => void }) {
  return (
    <div
      className="py-20 flex flex-col items-center justify-center gap-5 text-center"
      data-ocid="trades-empty-state"
    >
      <div className="relative">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: "oklch(0.72 0.2 142 / 0.08)",
            border: "1px solid oklch(0.72 0.2 142 / 0.25)",
            boxShadow: "0 0 40px oklch(0.72 0.2 142 / 0.15)",
          }}
        >
          <Zap
            className="h-10 w-10"
            style={{ color: "#00ff41", filter: "drop-shadow(0 0 8px #00ff41)" }}
          />
        </div>
        <div
          className="absolute -inset-4 rounded-3xl opacity-20 blur-xl"
          style={{
            background: "radial-gradient(circle, #00ff41 0%, transparent 70%)",
          }}
        />
      </div>
      <div>
        <h3 className="font-display text-xl font-bold text-foreground">
          {hasFilters ? "No matches found" : "No trades yet"}
        </h3>
        <p className="text-muted-foreground text-sm mt-1 max-w-xs">
          {hasFilters
            ? "Try adjusting your filters or search terms"
            : "Start building your trading journal — every trade logged is a lesson learned."}
        </p>
      </div>
      {!hasFilters && (
        <NeonButton
          variant="green"
          size="lg"
          onClick={onLogTrade}
          data-ocid="empty-state-log-cta"
        >
          <Plus className="h-4 w-4" />
          Log Your First Trade
        </NeonButton>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function TradesPage() {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Trade | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filters, setFilters] = useState<Filters>({
    search: "",
    direction: "ALL",
    session: "ALL",
    condition: "ALL",
    strategy: "",
    mistake: "",
  });

  const trades = useMemo(
    () => sampleTrades.filter((t) => !deletedIds.has(t.id)),
    [deletedIds],
  );

  const strategies = useMemo(
    () => [...new Set(trades.map((t) => t.strategyTag))],
    [trades],
  );
  const mistakes = useMemo(
    () =>
      [...new Set(trades.map((t) => t.mistakeTag).filter(Boolean))] as string[],
    [trades],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.direction !== "ALL") count++;
    if (filters.session !== "ALL") count++;
    if (filters.condition !== "ALL") count++;
    if (filters.strategy) count++;
    if (filters.mistake) count++;
    return count;
  }, [filters]);

  const filtered = useMemo(() => {
    let result = trades;
    const q = filters.search.toLowerCase();
    if (q) {
      result = result.filter(
        (t) =>
          t.pair.toLowerCase().includes(q) ||
          (t.notes ?? "").toLowerCase().includes(q) ||
          t.strategyTag.toLowerCase().includes(q),
      );
    }
    if (filters.direction !== "ALL")
      result = result.filter((t) => t.direction === filters.direction);
    if (filters.session !== "ALL")
      result = result.filter((t) => t.sessionTime === filters.session);
    if (filters.condition !== "ALL")
      result = result.filter((t) => t.marketCondition === filters.condition);
    if (filters.strategy)
      result = result.filter((t) => t.strategyTag === filters.strategy);
    if (filters.mistake)
      result = result.filter((t) => t.mistakeTag === filters.mistake);

    result = [...result].sort((a, b) => {
      let av: number;
      let bv: number;
      if (sortKey === "date") {
        av = Number(a.entryDate);
        bv = Number(b.entryDate);
      } else if (sortKey === "pnl") {
        av = a.pnl;
        bv = b.pnl;
      } else if (sortKey === "riskReward") {
        av = a.riskReward;
        bv = b.riskReward;
      } else {
        av = a.pair.localeCompare(b.pair);
        bv = 0;
        return sortDir === "asc" ? av : -av;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });

    return result;
  }, [trades, filters, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  function updateFilters(partial: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }

  function clearFilters() {
    setFilters({
      search: "",
      direction: "ALL",
      session: "ALL",
      condition: "ALL",
      strategy: "",
      mistake: "",
    });
    setPage(1);
  }

  function handleDelete(id: string) {
    setDeletedIds((prev) => new Set([...prev, id]));
    setDeleteTarget(null);
    setSelectedTrade(null);
  }

  const SortIcon = ({ col }: { col: SortKey }) => (
    <ArrowUpDown
      className={`h-3 w-3 ml-1 inline-block transition-colors ${
        sortKey === col ? "text-[#00ff41]" : "text-muted-foreground/40"
      }`}
    />
  );

  const headers: { label: string; key?: SortKey; align?: string }[] = [
    { label: "Pair", key: "pair" },
    { label: "Direction" },
    { label: "Entry", align: "right" },
    { label: "Exit", align: "right" },
    { label: "P&L", key: "pnl", align: "right" },
    { label: "R:R", key: "riskReward", align: "right" },
    { label: "Strategy" },
    { label: "Mistake" },
    { label: "Session" },
    { label: "Date", key: "date" },
  ];

  return (
    <div className="space-y-5 fade-in" data-ocid="trades-page">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Trade History
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {filtered.length} trade{filtered.length !== 1 ? "s" : ""} in your
            journal
          </p>
        </div>
        <NeonButton
          variant="green"
          onClick={() => navigate({ to: "/trades/new" })}
          data-ocid="trades-log-new-cta"
        >
          <Plus className="h-4 w-4" />
          Log Trade
        </NeonButton>
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by pair, strategy, or notes..."
            className="pl-9 bg-card/60 border-border focus-visible:border-[#00ff41]/50 focus-visible:ring-[#00ff41]/20 h-9"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            data-ocid="trades-search-input"
          />
        </div>
        <NeonButton
          variant={showFilters ? "green" : "outline"}
          size="md"
          onClick={() => setShowFilters((p) => !p)}
          data-ocid="trades-filter-toggle"
        >
          <Filter className="h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-[#00ff41]/20 text-[#00ff41] text-xs px-1.5 rounded-full leading-5">
              {activeFilterCount}
            </span>
          )}
        </NeonButton>
      </div>

      {/* Filter Bar */}
      <AnimatePresence>
        {showFilters && (
          <FilterBar
            filters={filters}
            onChange={updateFilters}
            strategies={strategies}
            mistakes={mistakes}
            onClear={clearFilters}
            activeCount={activeFilterCount}
          />
        )}
      </AnimatePresence>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                {headers.map(({ label, key, align }) => (
                  <th
                    key={label}
                    onClick={key ? () => handleSort(key) : undefined}
                    onKeyUp={
                      key
                        ? (e) => e.key === "Enter" && handleSort(key)
                        : undefined
                    }
                    className={`px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide whitespace-nowrap ${
                      align === "right" ? "text-right" : "text-left"
                    } ${key ? "cursor-pointer hover:text-foreground select-none transition-colors" : ""}`}
                    data-ocid={key ? `sort-${key}` : undefined}
                  >
                    {label}
                    {key && <SortIcon col={key} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((trade, i) => (
                <motion.tr
                  key={trade.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className="border-b border-border/30 last:border-0 cursor-pointer group transition-colors"
                  style={{ "--tw-bg-opacity": "1" } as React.CSSProperties}
                  onClick={() => setSelectedTrade(trade)}
                  onKeyUp={(e) => e.key === "Enter" && setSelectedTrade(trade)}
                  tabIndex={0}
                  aria-label={`View trade ${trade.pair}`}
                  data-ocid={`trade-row-${trade.id}`}
                >
                  <td
                    className="px-4 py-3 font-mono font-bold text-foreground group-hover:text-[#00ff41] transition-colors"
                    style={{}}
                  >
                    <span className="group-hover:[text-shadow:0_0_8px_#00ff41]">
                      {trade.pair}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DirectionChip direction={trade.direction} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground text-right">
                    {trade.entryPrice}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground text-right">
                    {trade.exitPrice}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PnlValue value={trade.pnl} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RRValue value={trade.riskReward} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-muted/60 text-foreground px-2 py-0.5 rounded-full whitespace-nowrap">
                      {trade.strategyTag}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {trade.mistakeTag ? (
                      <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                        ⚠ {trade.mistakeTag}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">
                      {trade.sessionTime}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(Number(trade.entryDate)).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {/* Empty State */}
          {filtered.length === 0 && (
            <EmptyState
              hasFilters={activeFilterCount > 0 || filters.search !== ""}
              onLogTrade={() => navigate({ to: "/trades/new" })}
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="text-foreground font-medium">
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="text-foreground font-medium">
                {filtered.length}
              </span>
            </p>
            <div
              className="flex items-center gap-1"
              data-ocid="trades-pagination"
            >
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                aria-label="Previous page"
                data-ocid="pagination-prev"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`min-w-[28px] h-7 rounded-md text-xs font-medium transition-colors ${
                    p === page
                      ? "bg-[#00ff41]/15 text-[#00ff41] border border-[#00ff41]/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                  data-ocid={`pagination-page-${p}`}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                aria-label="Next page"
                data-ocid="pagination-next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Trade Drawer */}
      <TradeDrawer
        trade={selectedTrade}
        open={!!selectedTrade}
        onClose={() => setSelectedTrade(null)}
        onEdit={(t) => {
          setSelectedTrade(null);
          navigate({ to: "/trades/$id", params: { id: t.id } });
        }}
        onDelete={(t) => {
          setDeleteTarget(t);
        }}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        trade={deleteTarget}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
