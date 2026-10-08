import Image from "next/image";

import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans">
      {/* Emplacement temporaire : le contrôle rejoint les coques en P1.6. */}
      <div className="flex w-full justify-end px-4 pt-4">
        <ThemeToggle />
      </div>
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 sm:items-start">
        <Image
          className="h-5 w-[200px]"
          src="/mascotte.svg"
          alt="DJEAZ mascotte"
          width={100}
          height={100}
          priority
        />
      </main>
    </div>
  );
}
