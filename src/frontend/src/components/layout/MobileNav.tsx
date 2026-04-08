import { useIsAdmin } from "@/hooks/use-is-admin";
import { useUserTier } from "@/hooks/use-user-tier";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  ClipboardList,
  Crown,
  LayoutDashboard,
  Menu,
  PlusCircle,
  ShieldCheck,
  Tag,
  TrendingUp,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

const coreNavItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trades", label: "Trade History", icon: ClipboardList },
  { to: "/trades/new", label: "Log Trade", icon: PlusCircle },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/import", label: "CSV Import", icon: Upload },
  { to: "/pricing", label: "Pricing", icon: Zap },
] as const;

type NavTo = (typeof coreNavItems)[number]["to"] | "/redeem" | "/admin";

interface NavItem {
  to: NavTo;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const routerState = useRouterState();
  const { isAdmin } = useIsAdmin();
  const { isPaid } = useUserTier();

  const navItems: NavItem[] = [
    ...coreNavItems,
    ...(!isPaid
      ? [{ to: "/redeem" as NavTo, label: "Redeem Code", icon: Tag }]
      : []),
    ...(isAdmin
      ? [{ to: "/admin" as NavTo, label: "Admin", icon: ShieldCheck }]
      : []),
  ];

  return (
    <>
      {/* Top bar */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-sidebar border-b border-sidebar-border sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#00ff41]/15 border border-[#00ff41]/40">
            <TrendingUp className="h-3.5 w-3.5 text-[#00ff41]" />
          </div>
          <span className="font-display font-bold text-base text-foreground">
            TradeLog
          </span>
          {isAdmin && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-widest"
              style={{
                background: "rgba(255,149,0,0.15)",
                color: "#ff9500",
                border: "1px solid rgba(255,149,0,0.4)",
              }}
            >
              ADMIN
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          aria-label={open ? "Close menu" : "Open menu"}
          data-ocid="mobile-nav-toggle"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            onKeyUp={(e) => e.key === "Escape" && setOpen(false)}
            aria-hidden="true"
          />
          <nav className="relative w-72 bg-sidebar border-r border-sidebar-border flex flex-col h-full slide-up">
            <div className="flex items-center justify-between px-5 h-14 border-b border-sidebar-border">
              <span className="font-display font-bold text-base">TradeLog</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 px-3 py-4 space-y-0.5">
              {navItems.map(({ to, label, icon: Icon }) => {
                const isActive =
                  to === "/"
                    ? routerState.location.pathname === "/"
                    : routerState.location.pathname.startsWith(to);
                const isAdminLink = to === "/admin";
                const activeColor = isAdminLink ? "#ff9500" : "#00ff41";
                const activeBg = isAdminLink
                  ? "rgba(255,149,0,0.1)"
                  : "rgba(0,255,65,0.1)";
                const activeBorder = isAdminLink
                  ? "rgba(255,149,0,0.25)"
                  : "rgba(0,255,65,0.25)";

                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth",
                      isActive
                        ? "border"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-[#00ff41]",
                    )}
                    style={
                      isActive
                        ? {
                            background: activeBg,
                            color: activeColor,
                            borderColor: activeBorder,
                          }
                        : undefined
                    }
                    data-ocid={`mobile-nav-link-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive
                          ? isAdminLink
                            ? "text-[#ff9500]"
                            : "text-[#00ff41]"
                          : "text-muted-foreground",
                      )}
                    />
                    {label}
                    {isAdminLink && (
                      <Crown
                        className="ml-auto h-3.5 w-3.5"
                        style={{ color: "#ff9500" }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
