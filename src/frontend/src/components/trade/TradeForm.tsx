import { createActor } from "@/backend";
import { Direction, MarketCondition, SessionTime } from "@/backend.d";
import { AnnotationCanvas } from "@/components/trade/AnnotationCanvas";
import { ChartUploadZone } from "@/components/trade/ChartUploadZone";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { PairAutocomplete } from "@/components/ui/PairAutocomplete";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTradeLimits } from "@/hooks/use-trade-limits";
import { useUserTier } from "@/hooks/use-user-tier";
import { cn } from "@/lib/utils";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ImagePlus, Save, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface TradeFormData {
  pair: string;
  direction: "LONG" | "SHORT";
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  pnl: string;
  riskReward: string;
  strategyTag: string;
  customStrategy: string;
  mistakeTags: string[];
  sessionTime: "ASIAN" | "LONDON" | "NY" | "OTHER";
  marketCondition: "TRENDING" | "RANGING" | "VOLATILE" | "CHOPPY" | "OTHER";
  notes: string;
  entryDate: string;
  exitDate: string;
}

const STRATEGY_PRESETS = [
  "Breakout",
  "Reversal",
  "Trend Follow",
  "Open Drive",
  "Scalp",
  "Swing",
  "Range",
  "Custom",
];

const MISTAKE_PRESETS = [
  "moved stop loss",
  "entered too early",
  "entered too late",
  "sized too large",
  "chased price",
  "no plan",
];

const SESSION_TIMES = ["ASIAN", "LONDON", "NY", "OTHER"] as const;
const MARKET_CONDITIONS = [
  "TRENDING",
  "RANGING",
  "VOLATILE",
  "CHOPPY",
  "OTHER",
] as const;

interface TradeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function TradeForm({ onSuccess, onCancel }: TradeFormProps) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { isPaid } = useUserTier();
  const limits = useTradeLimits();

  const [saving, setSaving] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string>("");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [annotatedUrl, setAnnotatedUrl] = useState<string | null>(null);
  const [touched, setTouched] = useState<
    Partial<Record<keyof TradeFormData, boolean>>
  >({});
  const [errors, setErrors] = useState<
    Partial<Record<keyof TradeFormData, string>>
  >({});

  const [form, setForm] = useState<TradeFormData>({
    pair: "",
    direction: "LONG",
    entryPrice: "",
    exitPrice: "",
    stopLoss: "",
    pnl: "",
    riskReward: "",
    strategyTag: "Breakout",
    customStrategy: "",
    mistakeTags: [],
    sessionTime: "LONDON",
    marketCondition: "TRENDING",
    notes: "",
    entryDate: new Date().toISOString().slice(0, 16),
    exitDate: new Date().toISOString().slice(0, 16),
  });

  // Auto-calculate P&L and R:R
  useEffect(() => {
    const entry = Number.parseFloat(form.entryPrice);
    const exit = Number.parseFloat(form.exitPrice);
    const stop = Number.parseFloat(form.stopLoss);
    if (!Number.isNaN(entry) && !Number.isNaN(exit)) {
      const rawPnl = form.direction === "LONG" ? exit - entry : entry - exit;
      setForm((f) => ({
        ...f,
        pnl: (rawPnl * 100).toFixed(2), // pips × 100 as proxy for $ pnl
      }));
      if (!Number.isNaN(stop) && stop > 0) {
        const risk =
          form.direction === "LONG"
            ? Math.abs(entry - stop)
            : Math.abs(stop - entry);
        const reward = Math.abs(exit - entry);
        const rr = risk > 0 ? (reward / risk).toFixed(2) : "";
        setForm((f) => ({ ...f, riskReward: rr }));
      }
    }
  }, [form.entryPrice, form.exitPrice, form.stopLoss, form.direction]);

  const set = useCallback(
    <K extends keyof TradeFormData>(key: K, value: TradeFormData[K]) =>
      setForm((f) => ({ ...f, [key]: value })),
    [],
  );

  const handleBlur = (key: keyof TradeFormData) => {
    setTouched((t) => ({ ...t, [key]: true }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TradeFormData, string>> = {};
    if (!form.pair.trim()) newErrors.pair = "Pair is required";
    if (!form.entryPrice) newErrors.entryPrice = "Entry price is required";
    if (!form.exitPrice) newErrors.exitPrice = "Exit price is required";
    if (!form.entryDate) newErrors.entryDate = "Entry date is required";
    if (!form.exitDate) newErrors.exitDate = "Exit date is required";
    setErrors(newErrors);
    setTouched({
      pair: true,
      entryPrice: true,
      exitPrice: true,
      entryDate: true,
      exitDate: true,
    });
    return Object.keys(newErrors).length === 0;
  };

  const toggleMistakeTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      mistakeTags: f.mistakeTags.includes(tag)
        ? f.mistakeTags.filter((t) => t !== tag)
        : [...f.mistakeTags.slice(-3), tag], // max 4
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!actor) {
      toast.error("Not connected. Please log in.");
      return;
    }

    // Check limits before submit
    if (limits.dailyLimitReached || limits.totalLimitReached) {
      const reason = limits.totalLimitReached
        ? `You've hit your ${limits.totalLimit}-trade cap. Upgrade to log unlimited trades.`
        : `You've hit today's ${limits.dailyLimit}-trade daily limit. Upgrade for unlimited daily entries.`;
      setUpgradeReason(reason);
      setShowUpgradeModal(true);
      return;
    }

    setSaving(true);
    try {
      const strategyTag =
        form.strategyTag === "Custom" && form.customStrategy.trim()
          ? form.customStrategy.trim()
          : form.strategyTag;

      const chartUrl = annotatedUrl ?? uploadedUrl ?? undefined;
      const input = {
        pair: form.pair.trim().toUpperCase(),
        direction: form.direction === "LONG" ? Direction.LONG : Direction.SHORT,
        entryPrice: Number.parseFloat(form.entryPrice),
        exitPrice: Number.parseFloat(form.exitPrice),
        stopLoss: form.stopLoss ? Number.parseFloat(form.stopLoss) : undefined,
        sessionTime: SessionTime[form.sessionTime as keyof typeof SessionTime],
        marketCondition:
          MarketCondition[form.marketCondition as keyof typeof MarketCondition],
        strategyTag,
        mistakeTag: form.mistakeTags.length
          ? form.mistakeTags.join(", ")
          : undefined,
        notes: form.notes,
        entryDate: BigInt(new Date(form.entryDate).getTime() * 1_000_000),
        exitDate: BigInt(new Date(form.exitDate).getTime() * 1_000_000),
        chartImageUrl: chartUrl,
        takeProfit: undefined,
      };

      const result = await actor.createTrade(input);

      if ("ok" in result) {
        await queryClient.invalidateQueries({ queryKey: ["trades"] });
        await queryClient.invalidateQueries({ queryKey: ["tradeLimits"] });
        toast.success(`Trade for ${form.pair} logged!`);
        onSuccess();
      } else {
        setUpgradeReason(result.limitReached);
        setShowUpgradeModal(true);
      }
    } catch {
      toast.error("Failed to save trade. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (key: keyof TradeFormData) =>
    touched[key] && errors[key] ? errors[key] : undefined;

  const pnlValue = Number.parseFloat(form.pnl);
  const isPnlPositive = !Number.isNaN(pnlValue) && pnlValue >= 0;

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
        data-ocid="new-trade-form"
        noValidate
      >
        {/* Trade Details */}
        <GlassCard>
          <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest mb-4">
            Trade Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Pair */}
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label htmlFor="pair">
                Pair / Instrument{" "}
                <span className="text-destructive-foreground">*</span>
              </Label>
              <PairAutocomplete
                id="pair"
                value={form.pair}
                onChange={(v) => set("pair", v)}
                onBlur={() => handleBlur("pair")}
                hasError={!!fieldError("pair")}
                data-ocid="new-trade-pair"
              />
              {fieldError("pair") && (
                <p className="text-xs text-destructive-foreground">
                  {fieldError("pair")}
                </p>
              )}
            </div>

            {/* Direction toggle */}
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label>Direction</Label>
              <div
                className="flex rounded-lg overflow-hidden border border-border"
                data-ocid="new-trade-direction"
              >
                <button
                  type="button"
                  onClick={() => set("direction", "LONG")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 h-9 text-sm font-semibold transition-smooth",
                    form.direction === "LONG"
                      ? "bg-[#00ff41]/15 text-[#00ff41] border-r border-[#00ff41]/30"
                      : "bg-card/60 text-muted-foreground hover:bg-muted/30 border-r border-border",
                  )}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  LONG
                </button>
                <button
                  type="button"
                  onClick={() => set("direction", "SHORT")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 h-9 text-sm font-semibold transition-smooth",
                    form.direction === "SHORT"
                      ? "bg-[#ff3b30]/15 text-[#ff3b30]"
                      : "bg-card/60 text-muted-foreground hover:bg-muted/30",
                  )}
                >
                  <TrendingDown className="h-3.5 w-3.5" />
                  SHORT
                </button>
              </div>
            </div>

            {/* Entry Price */}
            <div className="space-y-1.5">
              <Label htmlFor="entry">
                Entry Price{" "}
                <span className="text-destructive-foreground">*</span>
              </Label>
              <Input
                id="entry"
                type="number"
                step="any"
                placeholder="1.08420"
                value={form.entryPrice}
                onChange={(e) => set("entryPrice", e.target.value)}
                onBlur={() => handleBlur("entryPrice")}
                className={cn(
                  "bg-card/60 focus-visible:border-[#00ff41]/50 focus-visible:ring-[#00ff41]/20 font-mono",
                  fieldError("entryPrice") && "border-destructive",
                )}
                data-ocid="new-trade-entry-price"
              />
              {fieldError("entryPrice") && (
                <p className="text-xs text-destructive-foreground">
                  {fieldError("entryPrice")}
                </p>
              )}
            </div>

            {/* Exit Price */}
            <div className="space-y-1.5">
              <Label htmlFor="exit">
                Exit Price{" "}
                <span className="text-destructive-foreground">*</span>
              </Label>
              <Input
                id="exit"
                type="number"
                step="any"
                placeholder="1.08890"
                value={form.exitPrice}
                onChange={(e) => set("exitPrice", e.target.value)}
                onBlur={() => handleBlur("exitPrice")}
                className={cn(
                  "bg-card/60 focus-visible:border-[#00ff41]/50 focus-visible:ring-[#00ff41]/20 font-mono",
                  fieldError("exitPrice") && "border-destructive",
                )}
                data-ocid="new-trade-exit-price"
              />
              {fieldError("exitPrice") && (
                <p className="text-xs text-destructive-foreground">
                  {fieldError("exitPrice")}
                </p>
              )}
            </div>

            {/* Stop Loss */}
            <div className="space-y-1.5">
              <Label htmlFor="stop">Stop Loss (optional)</Label>
              <Input
                id="stop"
                type="number"
                step="any"
                placeholder="1.08100"
                value={form.stopLoss}
                onChange={(e) => set("stopLoss", e.target.value)}
                className="bg-card/60 focus-visible:border-[#b900ff]/50 focus-visible:ring-[#b900ff]/20 font-mono"
                data-ocid="new-trade-stop-loss"
              />
            </div>

            {/* P&L (auto) */}
            <div className="space-y-1.5">
              <Label htmlFor="pnl">P&amp;L ($)</Label>
              <div className="relative">
                <Input
                  id="pnl"
                  type="number"
                  step="any"
                  placeholder="Auto-calculated"
                  value={form.pnl}
                  onChange={(e) => set("pnl", e.target.value)}
                  className={cn(
                    "bg-card/60 font-mono pr-16",
                    form.pnl &&
                      !Number.isNaN(Number.parseFloat(form.pnl)) &&
                      (isPnlPositive
                        ? "text-[#00ff41] focus-visible:border-[#00ff41]/50"
                        : "text-[#ff3b30] focus-visible:border-[#ff3b30]/50"),
                  )}
                  data-ocid="new-trade-pnl"
                />
                {form.pnl && !Number.isNaN(Number.parseFloat(form.pnl)) && (
                  <span
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold",
                      isPnlPositive ? "text-[#00ff41]" : "text-[#ff3b30]",
                    )}
                  >
                    {isPnlPositive ? "+" : ""}
                    {pnlValue.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* R:R (auto) */}
            <div className="space-y-1.5">
              <Label htmlFor="rr">Risk:Reward</Label>
              <Input
                id="rr"
                type="number"
                step="any"
                placeholder="Auto from stop loss"
                value={form.riskReward}
                onChange={(e) => set("riskReward", e.target.value)}
                className="bg-card/60 font-mono focus-visible:border-[#00ffff]/50 focus-visible:ring-[#00ffff]/20"
                data-ocid="new-trade-rr"
              />
            </div>

            {/* Entry Date */}
            <div className="space-y-1.5">
              <Label>
                Entry Date/Time{" "}
                <span className="text-destructive-foreground">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={form.entryDate}
                onChange={(e) => set("entryDate", e.target.value)}
                onBlur={() => handleBlur("entryDate")}
                className={cn(
                  "bg-card/60 focus-visible:border-[#00ff41]/50 focus-visible:ring-[#00ff41]/20",
                  fieldError("entryDate") && "border-destructive",
                )}
                data-ocid="new-trade-entry-date"
              />
            </div>

            {/* Exit Date */}
            <div className="space-y-1.5">
              <Label>
                Exit Date/Time{" "}
                <span className="text-destructive-foreground">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={form.exitDate}
                onChange={(e) => set("exitDate", e.target.value)}
                onBlur={() => handleBlur("exitDate")}
                className={cn(
                  "bg-card/60 focus-visible:border-[#00ff41]/50 focus-visible:ring-[#00ff41]/20",
                  fieldError("exitDate") && "border-destructive",
                )}
                data-ocid="new-trade-exit-date"
              />
            </div>
          </div>
        </GlassCard>

        {/* Tags & Context */}
        <GlassCard>
          <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest mb-4">
            Tags &amp; Context
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Strategy */}
            <div className="space-y-1.5">
              <Label>Strategy Tag</Label>
              <Select
                value={form.strategyTag}
                onValueChange={(v) => set("strategyTag", v)}
              >
                <SelectTrigger
                  className="bg-card/60"
                  data-ocid="new-trade-strategy"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STRATEGY_PRESETS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.strategyTag === "Custom" && (
                <Input
                  placeholder="Type your strategy…"
                  value={form.customStrategy}
                  onChange={(e) => set("customStrategy", e.target.value)}
                  className="mt-1.5 bg-card/60 focus-visible:border-[#00ff41]/50 text-sm"
                  data-ocid="new-trade-custom-strategy"
                />
              )}
            </div>

            {/* Session */}
            <div className="space-y-1.5">
              <Label>Session</Label>
              <Select
                value={form.sessionTime}
                onValueChange={(v) =>
                  set("sessionTime", v as TradeFormData["sessionTime"])
                }
              >
                <SelectTrigger
                  className="bg-card/60"
                  data-ocid="new-trade-session"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TIMES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Market Condition */}
            <div className="space-y-1.5">
              <Label>Market Condition</Label>
              <Select
                value={form.marketCondition}
                onValueChange={(v) =>
                  set("marketCondition", v as TradeFormData["marketCondition"])
                }
              >
                <SelectTrigger
                  className="bg-card/60"
                  data-ocid="new-trade-market-condition"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MARKET_CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mistake Tags multi-select */}
          <div className="mt-4 space-y-2">
            <Label>Mistake Tags (optional, select all that apply)</Label>
            <div
              className="flex flex-wrap gap-2"
              data-ocid="new-trade-mistakes"
            >
              {MISTAKE_PRESETS.map((tag) => {
                const active = form.mistakeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleMistakeTag(tag)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-smooth",
                      active
                        ? "bg-[#b900ff]/15 text-[#b900ff] border-[#b900ff]/40"
                        : "bg-card/40 text-muted-foreground border-border hover:border-[#b900ff]/30 hover:text-[#b900ff]",
                    )}
                    data-ocid={`mistake-tag-${tag.replace(/\s+/g, "-")}`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </GlassCard>

        {/* Chart Screenshot */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest">
              Chart Screenshot
            </h2>
            {uploadedUrl && !showAnnotations && (
              <button
                type="button"
                onClick={() => setShowAnnotations(true)}
                className="flex items-center gap-1.5 text-xs text-[#00ffff] hover:text-[#00ffff]/80 transition-colors"
                data-ocid="chart-annotate-toggle"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Annotate
              </button>
            )}
          </div>

          {showAnnotations && uploadedUrl ? (
            <AnnotationCanvas
              imageUrl={annotatedUrl ?? uploadedUrl}
              isPaid={isPaid}
              onAnnotated={(dataUrl) => {
                setAnnotatedUrl(dataUrl);
                toast.success("Annotations saved!");
              }}
              onClose={() => setShowAnnotations(false)}
            />
          ) : (
            <ChartUploadZone
              uploadedUrl={annotatedUrl ?? uploadedUrl}
              onUploaded={(url) => {
                setUploadedUrl(url);
                setAnnotatedUrl(null);
              }}
              onClear={() => {
                setUploadedUrl(null);
                setAnnotatedUrl(null);
                setShowAnnotations(false);
              }}
            />
          )}
        </GlassCard>

        {/* Notes */}
        <GlassCard>
          <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest mb-4">
            Notes
          </h2>
          <Textarea
            placeholder="What was your thesis? What went well or wrong? Key observations…"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={4}
            className="bg-card/60 focus-visible:border-[#00ff41]/50 focus-visible:ring-[#00ff41]/20 resize-none"
            data-ocid="new-trade-notes"
          />
        </GlassCard>

        {/* Usage progress bar for free users */}
        {limits.tier === "FREE" && (
          <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Free tier usage</span>
              <span>
                {limits.totalCount} / {limits.totalLimit} trades
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  limits.totalPct < 60
                    ? "bg-[#00ff41]"
                    : limits.totalPct < 85
                      ? "bg-[#00ffff]"
                      : "bg-[#ff3b30]",
                )}
                style={{ width: `${limits.totalPct}%` }}
                data-ocid="usage-progress-bar"
              />
            </div>
            {limits.totalPct >= 80 && (
              <p className="text-xs text-[#ff3b30]/80">
                You're nearly at your cap.{" "}
                <a href="/pricing" className="underline text-[#b900ff]">
                  Upgrade for unlimited trades.
                </a>
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-6">
          <NeonButton
            variant="outline"
            type="button"
            onClick={onCancel}
            data-ocid="new-trade-cancel"
          >
            Cancel
          </NeonButton>
          <NeonButton
            variant="green"
            size="lg"
            type="submit"
            loading={saving}
            className="shadow-[0_0_20px_rgba(0,255,65,0.25)]"
            data-ocid="new-trade-submit"
          >
            <Save className="h-4 w-4" />
            Save Trade
          </NeonButton>
        </div>
      </form>

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        triggerReason={upgradeReason}
      />
    </>
  );
}
