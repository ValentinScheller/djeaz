import type { Metadata } from "next";

import { EmptyState } from "@/components/states/empty-state";
import { requirePageSession } from "@/features/auth/session.server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  await requirePageSession("/dashboard");

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <EmptyState
        title="Aucun événement"
        description="Vous n'avez pas encore d'événement. Ils apparaîtront ici lorsque vous pourrez en créer."
      />
    </div>
  );
}
