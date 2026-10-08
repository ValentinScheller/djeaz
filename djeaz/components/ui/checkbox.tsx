"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cn } from "cn";
import { CheckIcon } from "lucide-react";

import { intensityProps, type Intensity } from "@/components/ui/intensity";

function Checkbox({
  className,
  intensity,
  ...props
}: CheckboxPrimitive.Root.Props & { intensity?: Intensity }) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "inline-flex size-control shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-surface text-action-foreground",
        "transition-[background-color,border-color,box-shadow] duration-control ease-standard",
        "outline-none hover:border-action focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-error aria-invalid:outline-solid aria-invalid:outline-2 aria-invalid:outline-offset-2 aria-invalid:outline-error",
        "data-checked:border-action data-checked:bg-action",
        className,
      )}
      {...intensityProps(intensity)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current [&>svg]:size-5"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
