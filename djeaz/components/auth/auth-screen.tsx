import type { ReactNode } from "react";
import Link from "next/link";

import { Mascot } from "@/components/brand/mascot";

type AuthScreenProps = {
  title: string;
  description: string;
  alternate: {
    href: string;
    prompt: string;
    label: string;
  };
  children: ReactNode;
};

export function AuthScreen({ title, description, alternate, children }: AuthScreenProps) {
  return (
    <main className="flex w-full min-w-0 flex-1 justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full min-w-0 max-w-md rounded-[1.25rem] shadow-public">
        <section className="overflow-hidden rounded-[1.25rem] border border-border bg-surface">
          <div aria-hidden="true" className="h-1.5 bg-indigo dark:bg-apricot" />
          <div className="flex flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <Mascot alt="" className="w-16 sm:w-20" sizes="5rem" />
              <h1 id="auth-title" className="text-2xl font-semibold wrap-break-word text-text">
                {title}
              </h1>
              <p id="auth-description" className="text-text-secondary wrap-break-word">
                {description}
              </p>
            </div>
            {children}
            <p className="text-center text-text-secondary wrap-break-word">
              {alternate.prompt}{" "}
              <Link
                href={alternate.href}
                className="font-medium text-action underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {alternate.label}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
