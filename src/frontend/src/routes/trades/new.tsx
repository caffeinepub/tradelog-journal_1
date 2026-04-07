import { TradeForm } from "@/components/trade/TradeForm";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Route as RootRoute } from "../__root";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/trades/new",
  component: NewTradePage,
});

function NewTradePage() {
  const navigate = useNavigate();

  return (
    <div
      className="max-w-2xl mx-auto space-y-5 fade-in"
      data-ocid="new-trade-page"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/trades" })}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          aria-label="Back to trades"
          data-ocid="new-trade-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Log Trade
          </h1>
          <p className="text-sm text-muted-foreground">
            Record a new trade to your journal
          </p>
        </div>
      </div>

      <TradeForm
        onSuccess={() => navigate({ to: "/trades" })}
        onCancel={() => navigate({ to: "/trades" })}
      />
    </div>
  );
}
