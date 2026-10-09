import { CircleAlertIcon } from "lucide-react";

import { cn } from "cn";

type FieldErrorProps = {
  id: string;
  message: string;
  className?: string;
};

export function FieldError({ id, message, className }: FieldErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      className={cn("flex items-start gap-2 text-sm font-medium text-error", className)}
    >
      <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span className="min-w-0 text-left wrap-break-word">
        <span className="sr-only">Erreur :</span> {message}
      </span>
    </p>
  );
}
