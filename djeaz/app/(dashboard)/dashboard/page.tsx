import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="max-w-prose text-text-secondary">
        Les événements seront disponibles dans une prochaine étape.
      </p>
    </div>
  );
}
