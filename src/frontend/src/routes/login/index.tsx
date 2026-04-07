import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { useAuth } from "@/hooks/use-auth";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { BarChart2, Lock, Shield, TrendingUp, Upload, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { Route as RootRoute } from "../__root";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/login",
  component: LoginPage,
});

const features = [
  {
    icon: TrendingUp,
    label: "Track every trade",
    desc: "Log entries, exits, P&L, and mistakes in seconds",
    color: "#00ff41",
  },
  {
    icon: BarChart2,
    label: "Instant performance insights",
    desc: "Win rate, drawdown, session & pair breakdowns",
    color: "#b900ff",
  },
  {
    icon: Upload,
    label: "CSV bulk import",
    desc: "Import months of trade history retroactively",
    color: "#00ffff",
  },
  {
    icon: Lock,
    label: "Secure & private",
    desc: "Your data is encrypted and stored on-chain",
    color: "#00ff41",
  },
];

function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/" });
  }, [isAuthenticated, navigate]);

  return (
    <div
      className="min-h-[80vh] flex items-center justify-center px-4 py-10"
      data-ocid="login-page"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Logo & headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-4"
        >
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl"
            style={{
              background: "rgba(0,255,65,0.1)",
              border: "1px solid rgba(0,255,65,0.4)",
              boxShadow: "0 0 30px rgba(0,255,65,0.2)",
            }}
          >
            <TrendingUp className="h-8 w-8" style={{ color: "#00ff41" }} />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground">
              TradeLog Journal
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              The trading journal built for Gen Z traders 📈
            </p>
          </div>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="grid grid-cols-2 gap-3"
        >
          {features.map(({ icon: Icon, label, desc, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.08 }}
            >
              <GlassCard className="p-4 h-full flex flex-col gap-2.5">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                  style={{
                    background: `${color}18`,
                    border: `1px solid ${color}35`,
                  }}
                >
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground leading-snug">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {desc}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative flex items-center gap-3"
        >
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">secure login</span>
          <div className="flex-1 h-px bg-border" />
        </motion.div>

        {/* Login CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.35 }}
          className="space-y-3"
        >
          <NeonButton
            variant="green"
            size="lg"
            className="w-full"
            loading={isLoading}
            onClick={login}
            data-ocid="login-internet-identity-btn"
            style={{ boxShadow: "0 0 24px rgba(0,255,65,0.25)" }}
          >
            <Shield className="h-4 w-4" />
            Connect with Internet Identity
          </NeonButton>

          <div
            className="rounded-xl p-3.5 flex items-start gap-3"
            style={{
              background: "rgba(0,255,65,0.04)",
              border: "1px solid rgba(0,255,65,0.12)",
            }}
          >
            <Zap
              className="h-4 w-4 shrink-0 mt-0.5"
              style={{ color: "#00ff41", opacity: 0.7 }}
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">
                No email or password.
              </span>{" "}
              Internet Identity provides cryptographic authentication — your
              trades stay private and fully on-chain.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
