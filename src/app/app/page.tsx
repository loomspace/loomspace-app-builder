"use client";

import Dashboard from "./dashboard";
import { AppAuthGate } from "@/components/app-auth-gate";
import { LoomspaceAppShell } from "@/components/loomspace-app-shell";

export default function AppPage() {
  return <AppAuthGate><LoomspaceAppShell><Dashboard /></LoomspaceAppShell></AppAuthGate>;
}
