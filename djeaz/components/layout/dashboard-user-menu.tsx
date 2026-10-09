"use client";

import { CircleUserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "cn";

/**
 * Identité synthétique, locale à la coque.
 * P2.8 la remplacera par la session Better Auth.
 */
const PLACEHOLDER_USER = {
  name: "DJ Démo",
  email: "dj@example.test",
} as const;

type DashboardUserMenuProps = {
  /** Libellé visible seulement à partir de `lg`. L'infobulle couvre l'état compact. */
  responsive?: boolean;
};

export function DashboardUserMenu({ responsive = false }: DashboardUserMenuProps) {
  const trigger = (
    <DropdownMenuTrigger
      render={
        <Button variant="ghost" className="h-auto min-h-11 w-full min-w-0 justify-start px-2" />
      }
    >
      <CircleUserIcon aria-hidden="true" className="size-5 shrink-0" />
      <span className="flex min-w-0 flex-col items-start text-left">
        <span className={cn("truncate font-semibold", responsive && "max-lg:sr-only")}>
          {PLACEHOLDER_USER.name}
        </span>
        <span
          className={cn(
            "max-w-full truncate text-sm font-normal text-text-secondary",
            responsive ? "hidden lg:block" : "block",
          )}
        >
          {PLACEHOLDER_USER.email}
        </span>
      </span>
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      {responsive ? (
        <Tooltip>
          <TooltipTrigger render={trigger} />
          <TooltipContent side="right" sideOffset={8} className="lg:hidden">
            {PLACEHOLDER_USER.name}
          </TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <DropdownMenuContent side="top" align="start" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate text-sm font-semibold text-text">
              {PLACEHOLDER_USER.name}
            </span>
            <span className="block truncate text-sm text-text-secondary">
              {PLACEHOLDER_USER.email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* P2 branchera la déconnexion. Aucun handler ni succès factice. */}
        <DropdownMenuItem disabled>Déconnexion</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
