import { fireEvent, render } from "@testing-library/react";
import { expect, test } from "vitest";

import { TrackArtwork } from "./track-artwork";

const COVER = "https://coverartarchive.org/release/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/front-250";

test("affiche l'image quand artworkUrl est une URL Cover Art Archive", () => {
  const { container } = render(
    <TrackArtwork url={`http://coverartarchive.org${new URL(COVER).pathname}`} />,
  );

  const image = container.querySelector("img");
  expect(image).toHaveAttribute("src", COVER);
  expect(container.querySelector("svg")).toBeNull();
});

test("affiche le placeholder sans URL ou après une erreur de chargement", () => {
  const missing = render(<TrackArtwork url={null} />);
  expect(missing.container.querySelector("img")).toBeNull();
  expect(missing.container.querySelector("svg")).toBeTruthy();

  const foreign = render(<TrackArtwork url="https://archive.org/download/mbid/front.jpg" />);
  expect(foreign.container.querySelector("img")).toBeNull();
  expect(foreign.container.querySelector("svg")).toBeTruthy();

  const broken = render(<TrackArtwork url={COVER} />);
  const image = broken.container.querySelector("img");
  expect(image).toHaveAttribute("src", COVER);
  if (!image) {
    throw new Error("Image attendue.");
  }
  fireEvent.error(image);
  expect(broken.container.querySelector("img")).toBeNull();
  expect(broken.container.querySelector("svg")).toBeTruthy();
});
