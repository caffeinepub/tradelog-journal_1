import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Menu,
  PlusCircle,
  TrendingUp,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trades", label: "Trade History", icon: ClipboardList },
  { to: "/trades/new", label: "Log Trade", icon: PlusCircle },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/import", label: "CSV Import", icon: Upload },
  { to: "/pricing", label: "Pricing", icon: Zap },
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const routerState = useRouterState();

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
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth",
                      isActive
                        ? "bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/25"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-[#00ff41]",
                    )}
                    data-ocid={`mobile-nav-link-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-[#00ff41]" : "text-muted-foreground",
                      )}
                    />
                    {label}
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
