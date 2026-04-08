import { createActor } from "@/backend";
import { useAuth } from "@/hooks/use-auth";
import { useActor } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { useQuery } from "@tanstack/react-query";

export function useIsAdmin() {
  const { actor, isFetching } = useActor(createActor);
  const { isAuthenticated, principalText, identity } = useAuth();

  const query = useQuery<boolean>({
    // Include principalText in the key so the query re-runs whenever the
    // logged-in identity changes (login / logout).
    queryKey: ["isAdmin", principalText],
    queryFn: async () => {
      if (!actor || !isAuthenticated || !identity) return false;

      try {
        // ── First-call-wins admin bootstrap ──────────────────────────────
        // The backend uses "aaaaa-aa" as a sentinel meaning "no admin set yet".
        // The first principal to call setAdmin() with their own principal
        // becomes the permanent admin. Subsequent calls are a no-op for
        // non-admins (backend returns { err: "Unauthorized" }), so it is
        // safe to attempt this on every fresh login — if admin is already
        // set the backend silently rejects it and we fall through to isAdmin().
        const myPrincipal = identity.getPrincipal();
        // Fire-and-forget: do NOT await this — just attempt and ignore the result.
        // This ensures setAdmin never blocks or delays the isAdmin() check.
        void actor.setAdmin(myPrincipal as Principal).catch(() => {
          // Ignore errors — either we're already admin or we're not the first caller.
        });

        // Small delay to let the setAdmin call reach the backend before checking
        await new Promise((resolve) => setTimeout(resolve, 300));

        return await actor.isAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    // Never throw — admin status failure should not break the UI
    throwOnError: false,
  });

  return {
    isAdmin: query.data ?? false,
    isLoading: query.isLoading,
  };
}
