import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function SurveyHeader({ eventName }: { eventName: string }) {
  return (
    <header className="shrink-0 border-b border-border bg-surface shadow-public">
      <div aria-hidden="true" className="h-1 bg-apricot" />
      <div
        className="flex min-w-0 items-start gap-3 px-4 pb-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <Logo alt="DJEAZ" className="mt-1 w-20 shrink-0" />
        <h1 className="min-w-0 flex-1 text-lg font-semibold break-words">{eventName}</h1>
        <ThemeToggle />
      </div>
    </header>
  );
}
