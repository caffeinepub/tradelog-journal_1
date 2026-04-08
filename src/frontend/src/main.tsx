import { InternetIdentityProvider } from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider
      createOptions={{
        idleOptions: {
          disableDefaultIdleCallback: true,
          disableIdle: true,
        },
        loginOptions: {
          // Open II in a properly-sized popup window so the browser allows it
          windowOpenerFeatures:
            "toolbar=0,location=0,menubar=0,width=525,height=705,left=100,top=100",
        },
      }}
    >
      <App />
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
