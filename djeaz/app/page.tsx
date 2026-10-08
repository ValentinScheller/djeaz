import Image from "next/image";

import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans">
      {/* Emplacement temporaire : le contrôle rejoint les coques en P1.6. */}
      <ThemeToggle />
    </div>
  );
}
