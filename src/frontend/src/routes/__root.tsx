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

// Routes that are publicly accessible without authentication.
const PUBLIC_PATHS = ["/", "/login", "/pricing", "/redeem"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

function RootComponent() {
  const context = Route.useRouteContext();
  const router = useRouter();
  const location = useRouterState({ select: (s) => s.location });

  const isPublic = isPublicPath(location.pathname);

  // After loading resolves, if not authenticated and NOT on a public path → send to /login.
  useEffect(() => {
    if (!context.isLoading && !context.isAuthenticated && !isPublic) {
      void router.navigate({ to: "/login", replace: true });
    }
  }, [context.isLoading, context.isAuthenticated, isPublic, router]);

  // While auth is initializing on a protected route, show a full-screen spinner.
  // On public routes, skip the spinner entirely — show the page immediately.
  if (context.isLoading && !isPublic) {
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

  // Belt-and-suspenders: on a protected route that resolved as unauthenticated,
  // render nothing while the useEffect redirect fires to avoid content flash.
  if (!context.isAuthenticated && !isPublic) {
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
