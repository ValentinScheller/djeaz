"use client";

import { CircleUserIcon } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { FieldError } from "@/components/forms/field-error";
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
import { signOutAction } from "@/features/auth/actions";
import { initialSignOutState } from "@/features/auth/form-state";
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

function SignOutForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);
  const [state, formAction, pending] = useActionState(signOutAction, initialSignOutState);

  useEffect(() => {
    if (!pending) {
      submitted.current = false;
    }
  }, [pending]);

  return (
    <form ref={formRef} action={formAction} className="w-full">
      <DropdownMenuItem
        disabled={pending}
        closeOnClick={false}
        onClick={() => {
          if (pending || submitted.current) {
            return;
          }
          submitted.current = true;
          formRef.current?.requestSubmit();
        }}
      >
        {pending ? "Déconnexion…" : "Déconnexion"}
      </DropdownMenuItem>
      {state.formError ? (
        <FieldError id="sign-out-error" message={state.formError} className="px-1.5" />
      ) : null}
    </form>
  );
}

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
        <SignOutForm />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
