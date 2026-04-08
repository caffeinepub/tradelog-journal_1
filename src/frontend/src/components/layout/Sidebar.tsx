import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useTradeLimits } from "@/hooks/use-trade-limits";
import { useUserTier } from "@/hooks/use-user-tier";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  ClipboardList,
  Crown,
  LayoutDashboard,
  LogIn,
  PlusCircle,
  ShieldCheck,
  Tag,
  TrendingUp,
  Upload,
  Zap,
} from "lucide-react";

const baseNavItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trades", label: "Trade History", icon: ClipboardList },
  { to: "/trades/new", label: "Log Trade", icon: PlusCircle },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/import", label: "CSV Import", icon: Upload },
  { to: "/pricing", label: "Pricing", icon: Zap },
] as const;

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function Sidebar() {
  const routerState = useRouterState();
  const { isPaid } = useUserTier();
  const { totalCount, totalLimit, totalPct } = useTradeLimits();
  const { shortPrincipal, logout, isAuthenticated, login } = useAuth();
  const { isAdmin } = useIsAdmin();

  const navItems: NavItem[] = [
    ...baseNavItems,
    ...(!isPaid
      ? [{ to: "/redeem", label: "Redeem Code", icon: Tag } as NavItem]
      : []),
    ...(isAdmin
      ? [{ to: "/admin", label: "Admin", icon: ShieldCheck } as NavItem]
      : []),
  ];

  return (
    <aside
      className="hidden md:flex flex-col w-64 min-h-screen bg-sidebar border-r border-sidebar-border"
      data-ocid="sidebar-nav"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#00ff41]/15 border border-[#00ff41]/40">
          <TrendingUp className="h-4 w-4 text-[#00ff41]" />
        </div>
        <span className="font-display font-bold text-lg text-foreground tracking-tight">
          TradeLog
        </span>
        {isAdmin && (
          <Badge
            className="ml-auto text-[9px] py-0 font-bold tracking-widest"
            style={{
              background: "rgba(255,149,0,0.15)",
              color: "#ff9500",
              border: "1px solid rgba(255,149,0,0.4)",
            }}
            data-ocid="sidebar-admin-badge"
          >
            ADMIN
          </Badge>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive =
            to === "/"
              ? routerState.location.pathname === "/"
              : routerState.location.pathname.startsWith(to);

          const isAdminLink = to === "/admin";
          const isRedeemLink = to === "/redeem";
          const activeColor = isAdminLink
            ? "#ff9500"
            : isRedeemLink
              ? "#00ffff"
              : "#00ff41";
          const activeBg = isAdminLink
            ? "rgba(255,149,0,0.1)"
            : isRedeemLink
              ? "rgba(0,255,255,0.1)"
              : "rgba(0,255,65,0.1)";
          const activeBorder = isAdminLink
            ? "rgba(255,149,0,0.25)"
            : isRedeemLink
              ? "rgba(0,255,255,0.25)"
              : "rgba(0,255,65,0.25)";

          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth group",
                isActive
                  ? "border shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
              style={
                isActive
                  ? {
                      background: activeBg,
                      color: activeColor,
                      borderColor: activeBorder,
                      boxShadow: `0 0 12px ${activeColor}26`,
                    }
                  : undefined
              }
              data-ocid={`sidebar-link-${label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-smooth",
                  isActive
                    ? isAdminLink
                      ? "text-[#ff9500]"
                      : isRedeemLink
                        ? "text-[#00ffff]"
                        : "text-[#00ff41]"
                    : "text-muted-foreground",
                )}
              />
              {label}
              {to === "/pricing" && !isPaid && (
                <Badge className="ml-auto text-[10px] py-0 bg-[#b900ff]/15 text-[#b900ff] border-[#b900ff]/30 hover:bg-[#b900ff]/15">
                  PRO
                </Badge>
              )}
              {isAdminLink && (
                <Crown
                  className="ml-auto h-3.5 w-3.5"
                  style={{ color: "#ff9500" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Free tier usage */}
      {isAuthenticated && !isPaid && (
        <div className="px-4 py-3 mx-3 mb-3 rounded-lg bg-muted/40 border border-border space-y-2">
          <p className="text-xs text-muted-foreground">Free tier usage</p>
          <ProgressBar value={totalPct} showPercent />
          <p className="text-xs text-muted-foreground">
            {totalCount} / {totalLimit} trades used
          </p>
        </div>
      )}

      {/* User info / Login CTA */}
      {isAuthenticated ? (
        <div className="border-t border-sidebar-border px-4 py-3 flex items-center gap-2.5">
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-mono text-muted-foreground truncate"
              title={shortPrincipal}
            >
              {shortPrincipal || "Anonymous"}
            </p>
            {isPaid && (
              <Badge className="text-[10px] py-0 bg-[#00ff41]/10 text-[#00ff41] border-[#00ff41]/30 hover:bg-[#00ff41]/10 mt-0.5">
                PREMIUM
              </Badge>
            )}
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Log out"
            data-ocid="sidebar-logout"
          >
            Log out
          </button>
        </div>
      ) : (
        <div className="border-t border-sidebar-border px-3 py-4">
          <button
            type="button"
            onClick={() => login()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-smooth"
            style={{
              background: "rgba(0,255,65,0.12)",
              border: "1px solid rgba(0,255,65,0.5)",
              color: "#00ff41",
              boxShadow: "0 0 16px rgba(0,255,65,0.15)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(0,255,65,0.2)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 24px rgba(0,255,65,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(0,255,65,0.12)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 16px rgba(0,255,65,0.15)";
            }}
            data-ocid="sidebar-login-btn"
            aria-label="Connect with Internet Identity"
          >
            <LogIn className="h-4 w-4" />
            Connect with II
          </button>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Internet Identity · Secure login
          </p>
        </div>
      )}
    </aside>
  );
}
