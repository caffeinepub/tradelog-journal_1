import { useInternetIdentity } from "@caffeineai/core-infrastructure";

export function useAuth() {
  const { identity, loginStatus, login, clear } = useInternetIdentity();

  const isAuthenticated = loginStatus === "success" && identity !== undefined;
  const isLoading =
    loginStatus === "initializing" || loginStatus === "logging-in";

  const principalText = identity?.getPrincipal().toText() ?? "";
  const shortPrincipal = principalText
    ? `${principalText.slice(0, 5)}...${principalText.slice(-3)}`
    : "";

  return {
    identity,
    isAuthenticated,
    isLoading,
    loginStatus,
    principalText,
    shortPrincipal,
    login,
    logout: clear,
  };
}
