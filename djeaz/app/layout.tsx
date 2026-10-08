import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Poids statiques : sans `weight`, next/font charge l'axe variable entier (200–800).
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    <html lang="fr" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
