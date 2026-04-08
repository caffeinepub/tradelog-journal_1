import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const INIT_TIMEOUT_MS = 3000;

// Routes that are publicly accessible — the timeout redirect must NOT fire on these.
const PUBLIC_PATHS = ["/", "/login", "/pricing", "/redeem"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

export function useAuth() {
  const { identity, loginStatus, login, clear, loginError, isLoginError } =
    useInternetIdentity();

  // If loginStatus stays 'initializing' longer than INIT_TIMEOUT_MS, we give up
  // waiting and treat the user as unauthenticated so the app can proceed.
  const [initTimedOut, setInitTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loginStatus === "initializing") {
      // Start the escape-hatch timer
      timerRef.current = setTimeout(() => {
        setInitTimedOut(true);
      }, INIT_TIMEOUT_MS);
    } else {
      // Status resolved — cancel any pending timer and clear the flag
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setInitTimedOut(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [loginStatus]);

  const isAuthenticated = loginStatus === "success" && identity !== undefined;

  // isLoading is true only while genuinely in-flight AND within the timeout window.
  // Once timedOut=true the spinner is dismissed and the user is treated as logged out.
  const isLoading =
    !initTimedOut &&
    (loginStatus === "initializing" || loginStatus === "logging-in");

  // After timeout fires and user is not authenticated, force navigation to /login —
  // BUT only if the user is NOT already on a public page (/, /login, /pricing, /redeem).
  useEffect(() => {
    if (initTimedOut && !isAuthenticated) {
      if (
        typeof window !== "undefined" &&
        !isPublicPath(window.location.pathname)
      ) {
        window.location.replace("/login");
      }
    }
  }, [initTimedOut, isAuthenticated]);

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
