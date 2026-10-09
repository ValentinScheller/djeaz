"use client";

import { LayoutDashboardIcon, LibraryIcon, SettingsIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "cn";

const NAV_ITEMS: ReadonlyArray<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/catalog", label: "Catalogue", icon: LibraryIcon },
  { href: "/settings", label: "Paramètres", icon: SettingsIcon },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type DashboardNavProps = {
  /** Masque les libellés sous `lg` et les expose en infobulle. Le tiroir reste toujours libellé. */
  responsive?: boolean;
  onNavigate?: () => void;
};

export function DashboardNav({ responsive = false, onNavigate }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation principale" className="flex w-full flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        const link = (
          <Link
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 font-medium text-text",
              "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              "hover:bg-accent",
              responsive && "justify-center px-0 lg:justify-start lg:px-3",
              active && "bg-accent font-semibold shadow-[inset_3px_0_0_0_var(--djeaz-action)]",
            )}
          >
            <Icon aria-hidden="true" className="size-5 shrink-0" />
            <span className={responsive ? "max-lg:sr-only" : "truncate"}>{item.label}</span>
          </Link>
        );

        return <NavEntry key={item.href} label={item.label} responsive={responsive} link={link} />;
      })}
    </nav>
  );
}

function NavEntry({
  label,
  responsive,
  link,
}: {
  label: string;
  responsive: boolean;
  link: ReactElement;
}) {
  if (!responsive) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right" sideOffset={8} className="lg:hidden">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
