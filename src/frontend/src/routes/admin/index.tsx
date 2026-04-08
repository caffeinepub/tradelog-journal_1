import { createActor } from "@/backend";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useIsAdmin } from "@/hooks/use-is-admin";
import type { CouponCode, CouponPerkType, CreateCouponInput } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  PlusCircle,
  ShieldAlert,
  Ticket,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Route as RootRoute } from "../__root";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/admin",
  component: AdminPage,
});

// ─── Perk badge ──────────────────────────────────────────────────────────────

function PerkBadge({ perk }: { perk: CouponPerkType }) {
  const configs: Record<
    string,
    { label: string; color: string; bg: string; border: string }
  > = {
    UPGRADE_TO_PAID: {
      label: "Upgrade to Paid",
      color: "#00ff41",
      bg: "rgba(0,255,65,0.12)",
      border: "rgba(0,255,65,0.35)",
    },
    FREE_MONTHS: {
      label: "Free Months",
      color: "#b900ff",
      bg: "rgba(185,0,255,0.12)",
      border: "rgba(185,0,255,0.35)",
    },
    FEATURE_UNLOCK: {
      label: "Feature Unlock",
      color: "#00ffff",
      bg: "rgba(0,255,255,0.12)",
      border: "rgba(0,255,255,0.35)",
    },
    CUSTOM: {
      label: "Custom",
      color: "#ff9500",
      bg: "rgba(255,149,0,0.12)",
      border: "rgba(255,149,0,0.35)",
    },
  };
  const cfg = configs[perk.kind] ?? configs.CUSTOM;
  const detail =
    perk.kind === "FREE_MONTHS"
      ? ` (${perk.months}mo)`
      : perk.kind === "FEATURE_UNLOCK"
        ? ` (${perk.features?.join(", ")})`
        : perk.kind === "CUSTOM"
          ? ` — ${perk.description}`
          : "";
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {cfg.label}
      {detail}
    </span>
  );
}

// ─── Coupon hooks ─────────────────────────────────────────────────────────────

function useCoupons() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CouponCode[]>({
    queryKey: ["adminCoupons"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = await (actor as any).listCoupons();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return raw.map((c: any) => mapCoupon(c));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCoupon(c: any): CouponCode {
  let perkType: CouponPerkType = { kind: "CUSTOM", description: "" };
  if ("upgradeToPhaid" in (c.perkType ?? {})) {
    perkType = { kind: "UPGRADE_TO_PAID" };
  } else if ("freeMonths" in (c.perkType ?? {})) {
    perkType = {
      kind: "FREE_MONTHS",
      months: Number(c.perkType?.freeMonths ?? 1),
    };
  } else if ("featureUnlock" in (c.perkType ?? {})) {
    perkType = {
      kind: "FEATURE_UNLOCK",
      features: Array.isArray(c.perkType?.featureUnlock)
        ? c.perkType.featureUnlock
        : [],
    };
  } else if ("custom" in (c.perkType ?? {})) {
    perkType = {
      kind: "CUSTOM",
      description: String(c.perkType?.custom ?? ""),
    };
  }
  return {
    id: Number(c.id ?? 0),
    code: String(c.code ?? ""),
    description: String(c.description ?? ""),
    perkType,
    maxUses: c.maxUses != null ? Number(c.maxUses) : undefined,
    usedCount: Number(c.usedCount ?? 0),
    expiresAt: c.expiresAt != null ? BigInt(c.expiresAt) : undefined,
    isActive: Boolean(c.isActive),
    createdAt: BigInt(c.createdAt ?? 0),
  };
}

function useDeactivateCoupon() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).deactivateCoupon(BigInt(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminCoupons"] });
      toast.success("Coupon deactivated");
    },
    onError: () => toast.error("Failed to deactivate coupon"),
  });
}

function useCreateCoupon() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<CouponCode, Error, CreateCouponInput>({
    mutationFn: async (input: CreateCouponInput) => {
      if (!actor) throw new Error("Not connected");
      // Map frontend perkType to backend variant
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let backendPerk: any;
      if (input.perkType.kind === "UPGRADE_TO_PAID") {
        backendPerk = { upgradeToPhaid: null };
      } else if (input.perkType.kind === "FREE_MONTHS") {
        backendPerk = { freeMonths: BigInt(input.perkType.months) };
      } else if (input.perkType.kind === "FEATURE_UNLOCK") {
        backendPerk = { featureUnlock: input.perkType.features };
      } else {
        backendPerk = { custom: input.perkType.description };
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = await (actor as any).createCoupon({
        code: input.code,
        description: input.description,
        perkType: backendPerk,
        maxUses: input.maxUses != null ? [BigInt(input.maxUses)] : [],
        expiresAt: input.expiresAt != null ? [input.expiresAt] : [],
      });
      return mapCoupon(raw);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminCoupons"] });
      toast.success("Coupon created!");
    },
    onError: (e) => toast.error(e.message ?? "Failed to create coupon"),
  });
}

// ─── Create coupon form ───────────────────────────────────────────────────────

type PerkKind = "UPGRADE_TO_PAID" | "FREE_MONTHS" | "FEATURE_UNLOCK" | "CUSTOM";

function CreateCouponForm({ onClose }: { onClose: () => void }) {
  const createCoupon = useCreateCoupon();
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [perkKind, setPerkKind] = useState<PerkKind>("UPGRADE_TO_PAID");
  const [freeMonths, setFreeMonths] = useState(1);
  const [features, setFeatures] = useState("");
  const [customText, setCustomText] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const perkOptions: { value: PerkKind; label: string; color: string }[] = [
    { value: "UPGRADE_TO_PAID", label: "Upgrade to Paid", color: "#00ff41" },
    { value: "FREE_MONTHS", label: "Free Months", color: "#b900ff" },
    { value: "FEATURE_UNLOCK", label: "Feature Unlock", color: "#00ffff" },
    { value: "CUSTOM", label: "Custom", color: "#ff9500" },
  ];

  const buildPerkType = (): CouponPerkType => {
    if (perkKind === "FREE_MONTHS")
      return { kind: "FREE_MONTHS", months: freeMonths };
    if (perkKind === "FEATURE_UNLOCK")
      return {
        kind: "FEATURE_UNLOCK",
        features: features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
      };
    if (perkKind === "CUSTOM")
      return { kind: "CUSTOM", description: customText };
    return { kind: "UPGRADE_TO_PAID" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return toast.error("Code is required");
    const input: CreateCouponInput = {
      code: code.trim().toUpperCase(),
      description: description.trim(),
      perkType: buildPerkType(),
      maxUses: maxUses ? Number(maxUses) : undefined,
      expiresAt: expiryDate
        ? BigInt(new Date(expiryDate).getTime()) * 1_000_000n
        : undefined,
    };
    await createCoupon.mutateAsync(input);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <GlassCard
        className="border border-[#00ffff]/30"
        style={{ boxShadow: "0 0 30px rgba(0,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Ticket className="h-5 w-5 text-[#00ffff]" />
            Create New Coupon
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close form"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="coupon-code"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Code *
              </Label>
              <Input
                id="coupon-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PROMO2025"
                className="font-mono uppercase"
                data-ocid="admin-coupon-code-input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="coupon-description"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Description
              </Label>
              <Input
                id="coupon-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Launch promo — 3 free months"
                data-ocid="admin-coupon-description-input"
              />
            </div>
          </div>

          {/* Perk type selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Perk Type *
            </Label>
            <div className="flex flex-wrap gap-2">
              {perkOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPerkKind(opt.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth border"
                  style={{
                    background:
                      perkKind === opt.value ? `${opt.color}18` : "transparent",
                    color:
                      perkKind === opt.value
                        ? opt.color
                        : "var(--muted-foreground)",
                    borderColor:
                      perkKind === opt.value
                        ? opt.color
                        : "rgba(255,255,255,0.12)",
                    boxShadow:
                      perkKind === opt.value
                        ? `0 0 12px ${opt.color}30`
                        : "none",
                  }}
                  data-ocid={`admin-perk-type-${opt.value.toLowerCase()}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional perk config */}
          {perkKind === "FREE_MONTHS" && (
            <div className="space-y-1.5">
              <Label
                htmlFor="free-months"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Number of Months
              </Label>
              <Input
                id="free-months"
                type="number"
                min={1}
                max={24}
                value={freeMonths}
                onChange={(e) => setFreeMonths(Number(e.target.value))}
                className="w-32"
                data-ocid="admin-free-months-input"
              />
            </div>
          )}
          {perkKind === "FEATURE_UNLOCK" && (
            <div className="space-y-1.5">
              <Label
                htmlFor="features"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Features (comma-separated)
              </Label>
              <Input
                id="features"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="analytics,csv_import,annotations"
                data-ocid="admin-features-input"
              />
            </div>
          )}
          {perkKind === "CUSTOM" && (
            <div className="space-y-1.5">
              <Label
                htmlFor="custom-text"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Custom Perk Description
              </Label>
              <Textarea
                id="custom-text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Describe the custom perk..."
                rows={2}
                data-ocid="admin-custom-perk-input"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="max-uses"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Max Uses (optional)
              </Label>
              <Input
                id="max-uses"
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                data-ocid="admin-max-uses-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="expiry-date"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Expiry Date (optional)
              </Label>
              <Input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                data-ocid="admin-expiry-date-input"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <NeonButton
              variant="outline"
              size="sm"
              type="button"
              onClick={onClose}
            >
              Cancel
            </NeonButton>
            <NeonButton
              variant="cyan"
              size="sm"
              type="submit"
              disabled={createCoupon.isPending}
              data-ocid="admin-create-coupon-submit"
            >
              <PlusCircle className="h-4 w-4" />
              {createCoupon.isPending ? "Creating..." : "Create Coupon"}
            </NeonButton>
          </div>
        </form>
      </GlassCard>
    </motion.div>
  );
}

// ─── Coupon row ───────────────────────────────────────────────────────────────

function CouponRow({ coupon }: { coupon: CouponCode }) {
  const deactivate = useDeactivateCoupon();
  const usesText =
    coupon.maxUses != null
      ? `${coupon.usedCount}/${coupon.maxUses}`
      : `${coupon.usedCount}/∞`;
  const expiry = coupon.expiresAt
    ? new Date(Number(coupon.expiresAt) / 1_000_000).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric", year: "numeric" },
      )
    : "Never";
  const isExpired = coupon.expiresAt
    ? Number(coupon.expiresAt) / 1_000_000 < Date.now()
    : false;

  return (
    <tr
      className="border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors"
      data-ocid={`admin-coupon-row-${coupon.code}`}
    >
      <td className="px-4 py-3 font-mono font-bold text-foreground text-sm">
        {coupon.code}
      </td>
      <td className="px-4 py-3">
        <PerkBadge perk={coupon.perkType} />
      </td>
      <td
        className="px-4 py-3 text-sm text-muted-foreground max-w-[180px] truncate"
        title={coupon.description}
      >
        {coupon.description || "—"}
      </td>
      <td className="px-4 py-3 text-sm font-mono text-center">{usesText}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        <span style={{ color: isExpired ? "#f87171" : undefined }}>
          {expiry}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {coupon.isActive && !isExpired ? (
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold"
            style={{ color: "#00ff41" }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground/60">
            <XCircle className="h-3.5 w-3.5" />
            {isExpired ? "Expired" : "Inactive"}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {coupon.isActive && (
          <button
            type="button"
            onClick={() => deactivate.mutate(coupon.id)}
            disabled={deactivate.isPending}
            className="text-xs text-red-400/70 hover:text-red-400 transition-colors font-semibold"
            data-ocid={`admin-deactivate-coupon-${coupon.code}`}
          >
            Deactivate
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function AdminPage() {
  const { isAdmin, isLoading } = useIsAdmin();
  const { data: coupons, isLoading: couponsLoading } = useCoupons();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        data-ocid="admin-loading"
      >
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#00ff41]/40 border-t-[#00ff41] animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">
            Verifying admin access…
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        data-ocid="admin-403"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-5 max-w-sm"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{
              background: "rgba(248,113,113,0.12)",
              border: "1px solid rgba(248,113,113,0.35)",
            }}
          >
            <ShieldAlert className="h-8 w-8 text-red-400" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Access Denied
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This area is restricted to the app admin only. If you believe this
              is an error, please contact support.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const activeCoupons = (coupons ?? []).filter((c) => c.isActive);
  const totalRedemptions = (coupons ?? []).reduce(
    (sum, c) => sum + c.usedCount,
    0,
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 fade-in" data-ocid="admin-page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Crown className="h-6 w-6" style={{ color: "#ff9500" }} />
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Admin Panel
            </h1>
            <Badge
              className="text-xs font-bold tracking-widest"
              style={{
                background: "rgba(255,149,0,0.15)",
                color: "#ff9500",
                border: "1px solid rgba(255,149,0,0.4)",
                boxShadow: "0 0 14px rgba(255,149,0,0.2)",
              }}
              data-ocid="admin-badge"
            >
              ADMIN
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Manage coupons, monitor usage, and control app settings.
          </p>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          {
            label: "Total Coupons",
            value: String(coupons?.length ?? 0),
            icon: <Ticket className="h-4 w-4" />,
            color: "#00ffff",
          },
          {
            label: "Active Coupons",
            value: String(activeCoupons.length),
            icon: <CheckCircle2 className="h-4 w-4" />,
            color: "#00ff41",
          },
          {
            label: "Total Redemptions",
            value: String(totalRedemptions),
            icon: <Users className="h-4 w-4" />,
            color: "#b900ff",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <GlassCard>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: `${stat.color}1a`,
                    border: `1px solid ${stat.color}40`,
                  }}
                >
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {stat.label}
                </span>
              </div>
              <p
                className="font-display text-3xl font-bold"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Coupon Management */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <Ticket className="h-5 w-5 text-[#00ffff]" />
            Coupon Codes
          </h2>
          <NeonButton
            variant="cyan"
            size="sm"
            onClick={() => setShowForm((v) => !v)}
            data-ocid="admin-create-coupon-btn"
          >
            <PlusCircle className="h-4 w-4" />
            {showForm ? "Cancel" : "New Coupon"}
          </NeonButton>
        </div>

        {showForm && <CreateCouponForm onClose={() => setShowForm(false)} />}

        <GlassCard className="p-0 overflow-hidden">
          {couponsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-[#00ffff]/40 border-t-[#00ffff] animate-spin" />
            </div>
          ) : !coupons?.length ? (
            <div
              className="flex flex-col items-center justify-center py-14 gap-3 text-center"
              data-ocid="admin-coupons-empty"
            >
              <Ticket className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No coupons yet. Create your first one above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Code",
                      "Perk",
                      "Description",
                      "Uses",
                      "Expires",
                      "Status",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className={`py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${h === "Uses" || h === "Status" ? "text-center px-4" : "text-left px-4"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <CouponRow key={coupon.id} coupon={coupon} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <GlassCard className="flex items-start gap-3 py-4">
          <AlertCircle className="h-4 w-4 text-[#00ffff] shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Admin access is granted to the canister principal set at deploy
            time. Coupon codes are case-insensitive on redemption. Deactivated
            coupons cannot be reactivated — create a new one if needed.
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
