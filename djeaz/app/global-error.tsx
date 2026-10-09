"use client";

import localFont from "next/font/local";

import { AppError } from "@/components/states/app-error";
import { themeInitScript } from "@/lib/theme";

import "./globals.css";

// Le layout racine est remplacé : la police et le thème doivent être redéclarés ici.
const plusJakartaSans = localFont({
  src: "./fonts/plus-jakarta-sans-wght.ttf",
  weight: "200 800",
  style: "normal",
  variable: "--font-plus-jakarta-sans",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html
      lang="fr"
      className={`${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <title>Une erreur est survenue</title>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <AppError error={error} reset={reset} />
      </body>
    </html>
  );
}
