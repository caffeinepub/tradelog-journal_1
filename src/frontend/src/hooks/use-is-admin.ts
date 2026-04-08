import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export function useIsAdmin() {
  const { actor, isFetching } = useActor(createActor);

  const query = useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (actor as any).isAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 300_000,
  });

  return {
    isAdmin: query.data ?? false,
    isLoading: query.isLoading,
  };
}
