import type { RouterContext } from "@/App";
import { redirect } from "@tanstack/react-router";

/**
 * Use as `beforeLoad` in any protected route.
 * - While auth is still initializing (isLoading=true), allow render — the root
 *   component shows a spinner during this window, so no content flashes.
 * - Once auth resolves: if not authenticated, redirect to /login immediately.
 */
export function requireAuth({ context }: { context: RouterContext }) {
  // Still initializing — root shows spinner, don't redirect yet
  if (context.isLoading) return;

  // Fix 2: Auth resolved and user is not authenticated → redirect immediately
  if (!context.isAuthenticated) {
    throw redirect({ to: "/login", replace: true });
  }
}
