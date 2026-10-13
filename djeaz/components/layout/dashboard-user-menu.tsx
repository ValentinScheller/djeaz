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

/** Identité publique issue de la session. Le nom / prénom privé n'y figure pas. */
export type DashboardUserIdentity = {
  artistName: string;
  email: string;
};

type DashboardUserMenuProps = {
  user: DashboardUserIdentity;
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

function IdentityLines({
  user,
  nameClassName,
  emailClassName,
}: {
  user: DashboardUserIdentity;
  nameClassName?: string;
  emailClassName?: string;
}) {
  return (
    <span className="flex min-w-0 max-w-full flex-col items-start text-left">
      <span
        title={user.artistName}
        className={cn("max-w-full truncate font-semibold", nameClassName)}
      >
        {user.artistName}
      </span>
      <span
        title={user.email}
        className={cn(
          "max-w-full truncate text-sm font-normal text-text-secondary",
          emailClassName,
        )}
      >
        {user.email}
      </span>
    </span>
  );
}

export function DashboardUserMenu({ user, responsive = false }: DashboardUserMenuProps) {
  const trigger = (
    <DropdownMenuTrigger
      render={
        <Button
          variant="ghost"
          aria-label={`${user.artistName}, ${user.email}`}
          className="h-auto min-h-11 w-full min-w-0 justify-start px-2"
        />
      }
    >
      <CircleUserIcon aria-hidden="true" className="size-5 shrink-0" />
      <IdentityLines
        user={user}
        nameClassName={responsive ? "max-lg:sr-only" : undefined}
        emailClassName={responsive ? "max-lg:sr-only lg:block" : "block"}
      />
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      {responsive ? (
        <Tooltip>
          <TooltipTrigger render={trigger} />
          <TooltipContent side="right" sideOffset={8} className="lg:hidden">
            <span className="flex max-w-xs min-w-0 flex-col gap-0.5 text-left">
              <span className="font-semibold wrap-break-word">{user.artistName}</span>
              <span className="wrap-break-word">{user.email}</span>
            </span>
          </TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <DropdownMenuContent
        side="top"
        align="start"
        className="w-64 max-w-[calc(100vw-2rem)] min-w-56"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="min-w-0 font-normal">
            <IdentityLines user={user} nameClassName="text-sm text-text" emailClassName="block" />
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <SignOutForm />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
