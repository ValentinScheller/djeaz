import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

test("le bouton déclenche son action, se désactive et signale le chargement", () => {
  const onClick = vi.fn();
  const { rerender } = render(<Button onClick={onClick}>Enregistrer</Button>);

  const button = screen.getByRole("button", { name: "Enregistrer" });
  button.focus();
  expect(button).toHaveFocus();
  expect(button).not.toHaveAttribute("data-intensity");

  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledOnce();

  rerender(
    <Button intensity="dashboard" disabled onClick={onClick}>
      Enregistrer
    </Button>,
  );
  expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
  expect(screen.getByRole("button")).toHaveAttribute("data-intensity", "dashboard");

  rerender(
    <Button loading onClick={onClick}>
      Enregistrer
    </Button>,
  );
  const loadingButton = screen.getByRole("button", { name: "Enregistrer" });
  expect(loadingButton).toBeDisabled();
  expect(loadingButton).toHaveAttribute("aria-busy", "true");
  fireEvent.click(loadingButton);
  expect(onClick).toHaveBeenCalledOnce();
});

test("un champ invalide ou désactivé conserve l'état accessible", () => {
  render(
    <>
      <Input aria-label="Nom" aria-invalid="true" aria-describedby="nom-erreur" />
      <Textarea aria-label="Message" disabled />
    </>,
  );

  const nom = screen.getByRole("textbox", { name: "Nom" });
  expect(nom).toHaveAttribute("aria-invalid", "true");
  expect(nom).toHaveAttribute("aria-describedby", "nom-erreur");
  expect(nom.className).toContain("aria-invalid:border-error");

  expect(screen.getByRole("textbox", { name: "Message" })).toBeDisabled();
});

test("la case à cocher se sélectionne au clic et au clavier", () => {
  render(<Checkbox aria-label="Morceau" />);
  const checkbox = screen.getByRole("checkbox", { name: "Morceau" });

  expect(checkbox).not.toBeChecked();
  fireEvent.click(checkbox);
  expect(checkbox).toBeChecked();

  checkbox.focus();
  fireEvent.keyDown(checkbox, { key: " " });
  fireEvent.keyUp(checkbox, { key: " " });
  expect(checkbox).not.toBeChecked();
});

test("le dialogue s'ouvre, expose son titre et se ferme", () => {
  render(
    <Dialog>
      <DialogTrigger>Ouvrir</DialogTrigger>
      <DialogContent>
        <DialogTitle>Confirmer</DialogTitle>
        <DialogDescription>Cette action est visible.</DialogDescription>
      </DialogContent>
    </Dialog>,
  );

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Ouvrir" }));

  const dialog = screen.getByRole("dialog", { name: "Confirmer" });
  expect(dialog).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("le tiroir gauche s'ouvre et se ferme", () => {
  render(
    <Sheet>
      <SheetTrigger>Menu</SheetTrigger>
      <SheetContent side="left">
        <SheetTitle>Navigation</SheetTitle>
      </SheetContent>
    </Sheet>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  const sheet = screen.getByRole("dialog", { name: "Navigation" });
  expect(sheet).toHaveAttribute("data-side", "left");

  fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("les onglets exposent la sélection", () => {
  render(
    <Tabs defaultValue="un">
      <TabsList>
        <TabsTrigger value="un">Un</TabsTrigger>
        <TabsTrigger value="deux">Deux</TabsTrigger>
      </TabsList>
      <TabsContent value="un">Premier</TabsContent>
      <TabsContent value="deux">Second</TabsContent>
    </Tabs>,
  );

  expect(screen.getByRole("tab", { name: "Un" })).toHaveAttribute("aria-selected", "true");
  fireEvent.click(screen.getByRole("tab", { name: "Deux" }));
  expect(screen.getByRole("tab", { name: "Deux" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Second");
});

test("une primitive reste rendue dans le thème sombre", () => {
  render(
    <div className="dark">
      <RadioGroup defaultValue="a" aria-label="Thème">
        <RadioGroupItem value="a" aria-label="Clair" />
      </RadioGroup>
    </div>,
  );

  expect(screen.getByRole("radio", { name: "Clair" })).toBeChecked();
});
