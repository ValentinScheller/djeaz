"use client";

import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <Toaster>{children}</Toaster>
    </TooltipProvider>
  );
}
