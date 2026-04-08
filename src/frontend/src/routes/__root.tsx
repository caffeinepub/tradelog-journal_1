import type { RouterContext } from "@/App";
import { Layout } from "@/components/layout/Layout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

function RootComponent() {
  const context = Route.useRouteContext();

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

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});
