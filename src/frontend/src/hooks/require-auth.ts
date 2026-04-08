import type { RouterContext } from "@/App";
import { redirect } from "@tanstack/react-router";

/**
 * Use as `beforeLoad` in any protected route.
 * - While auth is still initializing (isLoading=true), allow render — the root
 *   component shows a spinner during this window, so no content flashes.
 * - Once auth resolves: if not authenticated, redirect to /login.
 */
export function requireAuth({ context }: { context: RouterContext }) {
  // Still initializing — root shows spinner, so don't redirect yet
  if (context.isLoading) return;

  if (!context.isAuthenticated) {
    throw redirect({ to: "/login" });
  }
}
