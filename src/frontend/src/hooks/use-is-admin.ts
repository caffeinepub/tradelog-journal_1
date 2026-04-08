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
        await actor.setAdmin(myPrincipal as Principal).catch(() => {
          // Ignore errors — either we're already admin or we're not the first caller.
        });

        return await actor.isAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  return {
    isAdmin: query.data ?? false,
    isLoading: query.isLoading,
  };
}
