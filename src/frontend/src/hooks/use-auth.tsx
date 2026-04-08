import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useEffect } from "react";
import { toast } from "sonner";

export function useAuth() {
  const { identity, loginStatus, login, clear, loginError, isLoginError } =
    useInternetIdentity();

  const isAuthenticated = loginStatus === "success" && identity !== undefined;
  const isLoading =
    loginStatus === "initializing" || loginStatus === "logging-in";

  const principalText = identity?.getPrincipal().toText() ?? "";
  const shortPrincipal = principalText
    ? `${principalText.slice(0, 5)}...${principalText.slice(-3)}`
    : "";

  // Show a visible error toast whenever login fails
  useEffect(() => {
    if (isLoginError && loginError) {
      const msg = loginError.message ?? "Login failed. Please try again.";
      // Suppress the "already authenticated" false-error from the lib
      if (!msg.includes("already authenticated")) {
        toast.error("Login failed", {
          description: msg.length > 120 ? `${msg.slice(0, 120)}…` : msg,
          duration: 6000,
        });
      }
    }
  }, [isLoginError, loginError]);

  return {
    identity,
    isAuthenticated,
    isLoading,
    isLoginError,
    loginError,
    loginStatus,
    principalText,
    shortPrincipal,
    login,
    logout: clear,
  };
}
