import { cn } from "cn";

import { fieldClassName } from "@/components/ui/input";
import { intensityProps, type Intensity } from "@/components/ui/intensity";

function Textarea({
  className,
  intensity,
  ...props
}: React.ComponentProps<"textarea"> & { intensity?: Intensity }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldClassName, "field-sizing-content min-h-24 py-3", className)}
      {...intensityProps(intensity)}
      {...props}
    />
  );
}

export { Textarea };
