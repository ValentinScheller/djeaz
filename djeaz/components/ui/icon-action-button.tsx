"use client";

import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type IconActionButtonProps = Omit<
  ComponentProps<typeof Button>,
  "children" | "variant" | "size"
> & {
  label: string;
  tooltip?: string;
  icon: LucideIcon;
  variant?: "default" | "destructive";
  size?: "icon" | "icon-sm";
};

export function IconActionButton({
  label,
  tooltip = label,
  icon: Icon,
  variant = "default",
  size = "icon",
  disabled,
  ...props
}: IconActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size={size}
            variant={variant === "destructive" ? "destructive" : "outline"}
            {...props}
            type="button"
            aria-label={label}
            disabled={disabled}
          />
        }
      >
        <Icon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
