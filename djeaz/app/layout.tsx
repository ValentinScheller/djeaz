import type { Metadata } from "next";
import localFont from "next/font/local";

import { AppProviders } from "@/components/providers/app-providers";
import { ThemeSync } from "@/components/theme-sync";
import { themeInitScript } from "@/lib/theme";

import "./globals.css";

// Axe variable 200–800 : les poids 400, 500, 600 et 700 restent disponibles.
const plusJakartaSans = localFont({
  src: "./fonts/plus-jakarta-sans-wght.ttf",
  weight: "200 800",
  style: "normal",
  variable: "--font-plus-jakarta-sans",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const title = "DJEAZ - Préparation musicale pour DJ";
const description =
  "Recueillez les préférences musicales de vos invités avant votre événement et préparez votre set avec une vision claire de votre public.";

export const metadata: Metadata = {
  title: {
    default: title,
    template: "%s | DJEAZ",
  },
  description,
  openGraph: {
    title,
    description,
    siteName: "DJEAZ",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeSync />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
