// src/app/layout.tsx
import React from "react";
import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalErrorCatcher } from "@/components/GlobalErrorCatcher";
import { Toaster } from "@/components/ui/sonner";
import { InsufficientCreditsModal } from "@/components/workspace/InsufficientCreditsModal";
import { LoomspacePrivyProvider } from "@/components/loomspace-privy-provider";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Loomspace — build real apps from a brief",
  description: "Describe an idea, get a working app, inspect the source, and ship it when it is ready.",
};

// SUPER IMPORTANT: NOT EDIT THE FOLLOWING 2 LINES TO FORCE NEXT.JS TO RENDER DYNAMICALLY
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${geistMono.variable} antialiased`}>
        <LoomspacePrivyProvider>
          <GlobalErrorCatcher />
          <Toaster position="top-right" richColors />
          <InsufficientCreditsModal />
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">{children}</main>
          </div>
        </LoomspacePrivyProvider>
      </body>
    </html>
  );
}
