import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";

import { intensityProps, type Intensity } from "@/components/ui/intensity";

const fieldClassName =
  "min-h-control w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-base text-text transition-[border-color,box-shadow,background-color] duration-control ease-standard outline-none placeholder:text-text-secondary focus-visible:border-focus focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error aria-invalid:outline-solid aria-invalid:outline-2 aria-invalid:outline-offset-2 aria-invalid:outline-error";

function Input({
  className,
  type,
  intensity,
  ...props
}: React.ComponentProps<"input"> & { intensity?: Intensity }) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(fieldClassName, className)}
      {...intensityProps(intensity)}
      {...props}
    />
  );
}

export { Input, fieldClassName };
