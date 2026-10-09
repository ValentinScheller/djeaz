"use client";

import { MenuIcon } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { DashboardNav } from "./dashboard-nav";
import { DashboardUserMenu } from "./dashboard-user-menu";

export function DashboardMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="min-h-11 min-w-11 shrink-0 md:hidden"
            aria-label="Menu"
          />
        }
      >
        <MenuIcon aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(100vw-2rem,20rem)]">
        <SheetHeader className="pr-12">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Logo alt="DJEAZ" className="w-36" />
        </SheetHeader>
        <div className="px-2">
          <DashboardNav onNavigate={() => setOpen(false)} />
        </div>
        <div className="mt-auto px-4 pb-4">
          <DashboardUserMenu />
        </div>
      </SheetContent>
    </Sheet>
  );
}
