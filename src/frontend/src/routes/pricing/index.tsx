import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Badge } from "@/components/ui/badge";
import { useUserTier } from "@/hooks/use-user-tier";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, Lock, Sparkles, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Route as RootRoute } from "../__root";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/pricing",
  component: PricingPage,
});

// ─── Feature comparison data ─────────────────────────────────────────────────

const comparisonFeatures = [
  { label: "Trade entries per day", free: "5 trades", pro: "Unlimited" },
  { label: "Total trade cap", free: "25 trades", pro: "Unlimited" },
  { label: "Trade log (pair, direction, P&L)", free: true, pro: true },
  { label: "Win rate tracking", free: true, pro: true },
  { label: "Basic dashboard", free: true, pro: true },
  { label: "CSV bulk import", free: "25-trade cap", pro: true },
  { label: "Chart screenshot uploads", free: false, pro: true },
  { label: "Full annotation tools", free: false, pro: true },
  { label: "Complete performance analytics", free: false, pro: true },
  { label: "Session & pair breakdown", free: false, pro: true },
  { label: "Drawdown analysis", free: false, pro: true },
  { label: "Monthly P&L reports", free: false, pro: true },
  { label: "Priority support", free: false, pro: true },
];

const proFeatures = [
  "Unlimited trade entries — no daily or total caps",
  "Full performance analytics & advanced insights",
  "Session, pair & strategy breakdown",
  "CSV bulk import for retroactive data",
  "Chart screenshot uploads with annotation tools",
  "Monthly P&L reports & drawdown analysis",
  "Priority support",
];

const freeFeatures = [
  "Up to 5 trade entries per day",
  "25 total trades",
  "Basic trade log (pair, direction, P&L)",
  "Win rate & basic dashboard",
  "Chart annotation (limited tools)",
];

const testimonials = [
  {
    quote:
      "bro i went from guessing to actually knowing why I lose. the annotations + journal combo hits different. 3 months in and my win rate jumped 12%.",
    name: "Marcus R.",
    handle: "@marcustrades",
    color: "#00ff41",
  },
  {
    quote:
      "no cap the best $19 I spend every month. i used to screenshot trades and forget about them. now I have actual data to work with.",
    name: "Priya K.",
    handle: "@priyaonfx",
    color: "#b900ff",
  },
  {
    quote:
      "upgraded after hitting the 25 trade cap on my second week 💀 the analytics on sessions alone saved me from bad NY opens fr.",
    name: "Tyler S.",
    handle: "@tylerinthemarket",
    color: "#00ffff",
  },
];

const faqItems = [
  {
    q: "What happens when I hit the free tier cap?",
    a: "Once you reach 25 total trades or 5 trades in a day, you'll need to wait until the next day for the daily limit, or upgrade to Pro for unlimited entries. Your existing trades are always accessible.",
  },
  {
    q: "What features are locked on the free tier?",
    a: "Free users get basic trade logging and win rate tracking. CSV import, chart screenshot uploads, full annotation tools, and the complete performance analytics dashboard (session breakdown, drawdown, pair analysis) are Pro-only features.",
  },
  {
    q: "Can I cancel my Pro plan anytime?",
    a: "Yes — cancel whenever, no questions asked. You keep Pro access until the end of your billing period, then revert to the free tier. Your trade data is always safe.",
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function GradientHero() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-8 text-center"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.095 0 0) 0%, oklch(0.14 0.04 142) 40%, oklch(0.12 0.06 280) 100%)",
        border: "1px solid oklch(0.22 0.04 258)",
        boxShadow:
          "0 0 60px oklch(0.72 0.2 142 / 0.12), 0 0 40px oklch(0.5 0.15 280 / 0.10)",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute -top-10 -left-10 w-48 h-48 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(0,255,65,0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(185,0,255,0.14) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 space-y-4"
      >
        <Badge
          className="mb-2 text-xs font-semibold tracking-wide border"
          style={{
            background: "rgba(185,0,255,0.15)",
            color: "#b900ff",
            borderColor: "rgba(185,0,255,0.35)",
          }}
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Simple Pricing
        </Badge>

        <h1
          className="font-display text-4xl md:text-5xl font-extrabold leading-tight"
          style={{
            background:
              "linear-gradient(135deg, #ffffff 30%, #00ff41 70%, #b900ff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Level up your trading game
        </h1>

        <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
          Start free. Upgrade when you&apos;re ready to unlock your full edge —
          no fluff, just data-driven performance.
        </p>

        <div className="flex justify-center gap-6 pt-2">
          {[
            { val: "10k+", label: "Traders" },
            { val: "98%", label: "Satisfaction" },
            { val: "$0", label: "To Start" },
          ].map(({ val, label }) => (
            <div key={label} className="text-center">
              <p
                className="font-display text-2xl font-bold"
                style={{ color: "#00ff41" }}
              >
                {val}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function PremiumCelebration() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="text-center py-12"
      data-ocid="pricing-premium-active"
    >
      <div
        className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 text-4xl"
        style={{
          background:
            "radial-gradient(circle, rgba(185,0,255,0.25) 0%, transparent 70%)",
          border: "2px solid rgba(185,0,255,0.5)",
          boxShadow: "0 0 40px rgba(185,0,255,0.4)",
        }}
      >
        🎉
      </div>
      <h2
        className="font-display text-3xl font-bold mb-3"
        style={{ color: "#b900ff" }}
      >
        You are Premium!
      </h2>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        All features unlocked. You&apos;re playing the long game — now go make
        those trades count.
      </p>
      <NeonButton
        variant="purple"
        size="lg"
        onClick={() => navigate({ to: "/analytics" })}
        data-ocid="pricing-go-to-analytics"
      >
        <Sparkles className="h-4 w-4" />
        View Full Analytics
      </NeonButton>
    </motion.div>
  );
}

function ComparisonCell({
  value,
}: {
  value: boolean | string;
}) {
  if (typeof value === "string") {
    return (
      <span className="text-sm text-muted-foreground font-mono">{value}</span>
    );
  }
  return value ? (
    <Check className="h-4 w-4 mx-auto" style={{ color: "#00ff41" }} />
  ) : (
    <X className="h-4 w-4 mx-auto text-muted-foreground opacity-40" />
  );
}

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <button
        type="button"
        className="w-full text-left flex items-center justify-between gap-4 py-4 px-5 transition-smooth hover:bg-card/60 rounded-lg"
        onClick={() => setOpen((o) => !o)}
        data-ocid={`faq-item-${index}`}
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-foreground">{q}</span>
        <ChevronDown
          className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-muted-foreground pb-4 px-5 leading-relaxed">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function PricingPage() {
  const { isPaid, isLoading } = useUserTier();

  const handleUpgrade = () => {
    toast.info("Stripe integration coming soon! Stay tuned for Pro launch 🚀", {
      duration: 5000,
    });
  };

  return (
    <div
      className="max-w-4xl mx-auto space-y-12 py-6 fade-in"
      data-ocid="pricing-page"
    >
      {/* Hero gradient header */}
      <GradientHero />

      {/* Premium celebration state */}
      {!isLoading && isPaid ? (
        <PremiumCelebration />
      ) : (
        <>
          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Free tier */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 150 }}
              className="flex"
            >
              <GlassCard className="flex flex-col w-full">
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">
                      Free
                    </p>
                    <div
                      className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{
                        background: "rgba(0,255,65,0.1)",
                        color: "#00ff41",
                        border: "1px solid rgba(0,255,65,0.25)",
                      }}
                      data-ocid="pricing-current-plan-badge"
                    >
                      Current Plan
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="font-display text-5xl font-extrabold text-foreground">
                      $0
                    </span>
                    <span className="text-muted-foreground text-sm">
                      /month
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    For traders just getting started
                  </p>
                </div>

                <ul className="flex-1 space-y-2.5 mb-6">
                  {freeFeatures.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-foreground"
                    >
                      <Check
                        className="h-4 w-4 shrink-0 mt-0.5"
                        style={{ color: "#00ff41", opacity: 0.7 }}
                      />
                      {f}
                    </li>
                  ))}
                  <li className="flex items-start gap-2.5 text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
                    <Lock className="h-4 w-4 shrink-0 mt-0.5 opacity-40" />
                    CSV import, full annotations, analytics insights
                  </li>
                </ul>

                <div
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-center"
                  style={{
                    background: "rgba(0,255,65,0.06)",
                    border: "1px solid rgba(0,255,65,0.22)",
                    color: "#00ff41",
                  }}
                >
                  ✓ You&apos;re on Free
                </div>
              </GlassCard>
            </motion.div>

            {/* Pro tier */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 150 }}
              className="flex"
            >
              <div
                className="glass-card p-5 flex flex-col w-full transition-smooth"
                style={{
                  border: "1px solid rgba(185,0,255,0.5)",
                  boxShadow:
                    "0 0 40px rgba(185,0,255,0.18), 0 0 80px rgba(185,0,255,0.06), inset 0 1px 0 rgba(185,0,255,0.1)",
                }}
                data-ocid="pricing-pro-card"
              >
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <p
                      className="text-sm font-bold uppercase tracking-wider"
                      style={{ color: "#b900ff" }}
                    >
                      Pro
                    </p>
                    <Badge
                      className="text-[10px] py-0 font-bold tracking-wide"
                      style={{
                        background: "rgba(185,0,255,0.15)",
                        color: "#b900ff",
                        border: "1px solid rgba(185,0,255,0.35)",
                      }}
                    >
                      ⚡ MOST POPULAR
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="font-display text-5xl font-extrabold text-foreground">
                      $19
                    </span>
                    <span className="text-muted-foreground text-sm">
                      /month
                    </span>
                  </div>
                  <p
                    className="text-xs mt-1.5"
                    style={{ color: "rgba(185,0,255,0.7)" }}
                  >
                    Payment integration coming soon
                  </p>
                </div>

                <ul className="flex-1 space-y-2.5 mb-6">
                  {proFeatures.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-foreground"
                    >
                      <Check
                        className="h-4 w-4 shrink-0 mt-0.5"
                        style={{ color: "#00ff41" }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <NeonButton
                  variant="purple"
                  size="lg"
                  className="w-full"
                  onClick={handleUpgrade}
                  data-ocid="pricing-upgrade-cta"
                  style={{
                    boxShadow: "0 0 24px rgba(185,0,255,0.35)",
                  }}
                >
                  <Zap className="h-4 w-4" />
                  Go Pro Now
                </NeonButton>
                <p className="text-xs text-muted-foreground text-center mt-2.5">
                  Cancel anytime · No contracts
                </p>
              </div>
            </motion.div>
          </div>

          {/* Feature comparison table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-display text-lg font-bold text-foreground">
                  Full Feature Comparison
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Everything you need to know
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[55%]">
                        Feature
                      </th>
                      <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
                        Free
                      </th>
                      <th
                        className="py-3 px-4 text-xs font-bold uppercase tracking-wide text-center"
                        style={{ color: "#b900ff" }}
                      >
                        Pro
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((row) => (
                      <tr
                        key={row.label}
                        className="border-b border-border/50 last:border-0 hover:bg-card/40 transition-colors"
                        data-ocid={`comparison-row-${row.label.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <td className="py-3 px-6 text-sm text-foreground">
                          {row.label}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <ComparisonCell value={row.free} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <ComparisonCell value={row.pro} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>

          {/* Testimonials */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-xl font-bold text-foreground text-center mb-6"
            >
              What traders are saying
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {testimonials.map((t) => (
                <motion.div
                  key={t.handle}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: testimonials.indexOf(t) * 0.12 }}
                  data-ocid={`testimonial-${t.handle}`}
                >
                  <GlassCard className="h-full flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: `${t.color}18`,
                          border: `1px solid ${t.color}40`,
                          color: t.color,
                        }}
                      >
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {t.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.handle}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-xl font-bold text-foreground text-center mb-4">
              FAQ
            </h2>
            <GlassCard
              className="p-0 divide-y divide-border/60"
              data-ocid="pricing-faq"
            >
              {faqItems.map((item) => (
                <FaqItem
                  key={item.q}
                  q={item.q}
                  a={item.a}
                  index={faqItems.indexOf(item)}
                />
              ))}
            </GlassCard>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center pb-4"
          >
            <p className="text-muted-foreground text-sm mb-4">
              Ready to trade smarter?
            </p>
            <NeonButton
              variant="purple"
              size="lg"
              onClick={handleUpgrade}
              data-ocid="pricing-bottom-cta"
              style={{ boxShadow: "0 0 24px rgba(185,0,255,0.3)" }}
            >
              <Zap className="h-4 w-4" />
              Upgrade to Pro — $19/month
            </NeonButton>
            <p className="text-xs text-muted-foreground mt-2">
              Payment integration coming soon · Questions?{" "}
              <a
                href="https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
                style={{ color: "rgba(0,255,65,0.7)" }}
              >
                Contact support
              </a>
            </p>
          </motion.div>
        </>
      )}
    </div>
  );
}
