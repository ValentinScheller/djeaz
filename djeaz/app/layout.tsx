import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DJEAZ",
  description: "DJEAZ is a platform for DJs to share their music and connect with other DJs.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "DJEAZ",
    description: "DJEAZ is a platform for DJs to share their music and connect with other DJs.",
    url: "https://djeaz.com",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
