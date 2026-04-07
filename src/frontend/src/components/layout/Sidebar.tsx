import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useTradeLimits } from "@/hooks/use-trade-limits";
import { useUserTier } from "@/hooks/use-user-tier";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  PlusCircle,
  TrendingUp,
  Upload,
  Zap,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trades", label: "Trade History", icon: ClipboardList },
  { to: "/trades/new", label: "Log Trade", icon: PlusCircle },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/import", label: "CSV Import", icon: Upload },
  { to: "/pricing", label: "Pricing", icon: Zap },
] as const;

export function Sidebar() {
  const routerState = useRouterState();
  const { isPaid } = useUserTier();
  const { totalCount, totalLimit, totalPct } = useTradeLimits();
  const { shortPrincipal, logout } = useAuth();

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
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive =
            to === "/"
              ? routerState.location.pathname === "/"
              : routerState.location.pathname.startsWith(to);

          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth group",
                isActive
                  ? "bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/25 shadow-[0_0_12px_rgba(0,255,65,0.15)]"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-[#00ff41]",
              )}
              data-ocid={`sidebar-link-${label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-smooth",
                  isActive
                    ? "text-[#00ff41]"
                    : "text-muted-foreground group-hover:text-[#00ff41]",
                )}
              />
              {label}
              {to === "/pricing" && !isPaid && (
                <Badge className="ml-auto text-[10px] py-0 bg-[#b900ff]/15 text-[#b900ff] border-[#b900ff]/30 hover:bg-[#b900ff]/15">
                  PRO
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Free tier usage */}
      {!isPaid && (
        <div className="px-4 py-3 mx-3 mb-3 rounded-lg bg-muted/40 border border-border space-y-2">
          <p className="text-xs text-muted-foreground">Free tier usage</p>
          <ProgressBar value={totalPct} showPercent />
          <p className="text-xs text-muted-foreground">
            {totalCount} / {totalLimit} trades used
          </p>
        </div>
      )}

      {/* User info */}
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
    </aside>
  );
}
