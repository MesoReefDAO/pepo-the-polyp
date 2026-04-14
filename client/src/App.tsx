import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Body } from "@/pages/Body";
import { PRIVY_ENABLED, PRIVY_APP_ID } from "@/lib/privy";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Body} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// Only import PrivyProvider if we have a valid app ID to avoid hook errors
let App: () => JSX.Element;

if (PRIVY_ENABLED) {
  const { PrivyProvider } = await import("@privy-io/react-auth");

  App = function AppWithPrivy() {
    return (
      <PrivyProvider
        appId={PRIVY_APP_ID}
        config={{
          loginMethods: ["email", "wallet", "google", "twitter", "telegram"],
          appearance: {
            theme: "dark",
            accentColor: "#83eef0",
            logo: "/figmaAssets/pepo-the-polyp-mascot.png",
          },
          embeddedWallets: {
            createOnLogin: "users-without-wallets",
          },
        }}
      >
        <AppContent />
      </PrivyProvider>
    );
  };
} else {
  App = function AppWithoutPrivy() {
    return <AppContent />;
  };
}

export default App;
