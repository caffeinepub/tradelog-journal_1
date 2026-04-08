import type { RouterContext } from "@/App";
import { Layout } from "@/components/layout/Layout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";

function RootComponent() {
  const context = Route.useRouteContext();
  const router = useRouter();
  const location = useRouterState({ select: (s) => s.location });

  // Fix 1 + Fix 3: After loading resolves, if not authenticated and not already on /login → navigate there.
  useEffect(() => {
    if (!context.isLoading && !context.isAuthenticated) {
      if (location.pathname !== "/login") {
        void router.navigate({ to: "/login", replace: true });
      }
    }
  }, [context.isLoading, context.isAuthenticated, location.pathname, router]);

  // While auth is initializing, show a full-screen spinner.
  // This prevents unauthenticated content from flashing before the redirect fires.
  if (context.isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background"
        data-ocid="auth-loading-screen"
        aria-live="polite"
        aria-label="Verifying session"
      >
        <div
          className="flex items-center justify-center w-14 h-14 rounded-2xl"
          style={{
            background: "rgba(0,255,65,0.08)",
            border: "1px solid rgba(0,255,65,0.3)",
            boxShadow: "0 0 24px rgba(0,255,65,0.15)",
          }}
        >
          <LoadingSpinner size="sm" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Verifying session…
        </p>
      </div>
    );
  }

  // Fix 3 (belt-and-suspenders): If not authenticated and not on /login, render nothing
  // while the useEffect navigation fires (avoids a flash of protected content).
  if (!context.isAuthenticated && location.pathname !== "/login") {
    return null;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});
