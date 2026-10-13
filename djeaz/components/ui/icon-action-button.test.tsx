import { PlusIcon, Trash2Icon } from "lucide-react";
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { IconActionButton } from "@/components/ui/icon-action-button";
import { TooltipProvider } from "@/components/ui/tooltip";

test("le bouton icône expose son nom, son infobulle, l'état disabled et la variante destructive", async () => {
  render(
    <TooltipProvider>
      <IconActionButton
        label="Supprimer la catégorie"
        tooltip="Supprimer"
        icon={Trash2Icon}
        variant="destructive"
      />
      <IconActionButton label="Créer une catégorie" icon={PlusIcon} disabled />
    </TooltipProvider>,
  );

  const remove = screen.getByRole("button", { name: "Supprimer la catégorie" });
  expect(remove.className).toContain("text-error");
  remove.focus();
  expect(await screen.findByText("Supprimer")).toBeInTheDocument();

  expect(screen.getByRole("button", { name: "Créer une catégorie" })).toBeDisabled();
});
