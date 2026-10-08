import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

import { intensityProps, type Intensity } from "@/components/ui/intensity";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-clip-padding text-base font-medium whitespace-nowrap select-none transition-[background-color,border-color,color,box-shadow,opacity] duration-control ease-standard outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-error aria-invalid:outline-solid aria-invalid:outline-2 aria-invalid:outline-error [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-action text-action-foreground hover:bg-action/90 active:bg-action/80",
        outline:
          "border-border bg-surface text-text hover:bg-accent active:bg-accent aria-expanded:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
        ghost: "text-text hover:bg-accent active:bg-accent aria-expanded:bg-accent",
        destructive: "bg-error/10 text-error hover:bg-error/20 active:bg-error/25",
        link: "text-action underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-control gap-2 px-4",
        xs: "min-h-control-compact gap-1 px-2 text-sm",
        sm: "min-h-control-compact gap-1.5 px-3 text-sm",
        lg: "min-h-12 gap-2 px-6",
        icon: "size-control",
        "icon-xs": "size-control-compact",
        "icon-sm": "size-control-compact",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  intensity,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    intensity?: Intensity;
    loading?: boolean;
  }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading ? "" : undefined}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...intensityProps(intensity)}
      {...props}
      disabled={disabled || loading}
    >
      <span className="inline-grid place-items-center">
        <span
          className={cn(
            "col-start-1 row-start-1 inline-flex items-center justify-center gap-2",
            loading && "invisible",
          )}
        >
          {children}
        </span>
        {loading ? (
          <span
            aria-hidden
            className="col-start-1 row-start-1 size-4 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin"
          />
        ) : null}
      </span>
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
