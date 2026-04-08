import { useAuth } from "@/hooks/use-auth";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { Route as RootRoute } from "./routes/__root";
import { Route as AdminRoute } from "./routes/admin/index";
import { Route as AnalyticsRoute } from "./routes/analytics/index";
import { Route as ImportRoute } from "./routes/import/index";
import { Route as IndexRoute } from "./routes/index";
import { Route as LoginRoute } from "./routes/login/index";
import { Route as PricingRoute } from "./routes/pricing/index";
import { Route as RedeemRoute } from "./routes/redeem/index";
import { Route as TradesIdRoute } from "./routes/trades/$id";
import { Route as TradesIndexRoute } from "./routes/trades/index";
import { Route as TradesNewRoute } from "./routes/trades/new";

// Router context type — injected on every route
export interface RouterContext {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const routeTree = RootRoute.addChildren([
  IndexRoute,
  TradesNewRoute,
  TradesIdRoute,
  TradesIndexRoute,
  ImportRoute,
  AnalyticsRoute,
  PricingRoute,
  LoginRoute,
  AdminRoute,
  RedeemRoute,
]);

const router = createRouter({
  routeTree,
  context: {
    isAuthenticated: false,
    isLoading: true,
  } satisfies RouterContext,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  return (
    <RouterProvider router={router} context={{ isAuthenticated, isLoading }} />
  );
}
