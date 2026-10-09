"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export function LoomspacePrivyProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) return <>{children}</>;
  return <PrivyProvider appId={appId} config={{ loginMethods: ["google", "email", "wallet"], appearance: { theme: "dark", accentColor: "#f1f1ee" } }}>{children}</PrivyProvider>;
}
