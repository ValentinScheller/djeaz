import { expect, test } from "vitest";

import { canonicalizeCoverArtUrl, readCoverArtThumbnailUrl } from "./cover-art";

const RELEASE = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

test("n'accepte qu'une URL Cover Art Archive", () => {
  expect(canonicalizeCoverArtUrl("http://coverartarchive.org/release/x/front-250")).toBe(
    "https://coverartarchive.org/release/x/front-250",
  );
  expect(canonicalizeCoverArtUrl("https://archive.org/download/mbid/front.jpg")).toBeNull();
  expect(canonicalizeCoverArtUrl("https://user:pass@coverartarchive.org/a")).toBeNull();
});

test("prend la miniature de la face avant", () => {
  expect(
    readCoverArtThumbnailUrl(
      {
        images: [
          { front: false, thumbnails: { "250": "https://coverartarchive.org/release/back/250" } },
          {
            front: true,
            thumbnails: { "250": "http://coverartarchive.org/release/front/250" },
          },
        ],
      },
      RELEASE,
    ),
  ).toBe("https://coverartarchive.org/release/front/250");
});

test("retourne null sans image exploitable", () => {
  expect(readCoverArtThumbnailUrl({ images: [] }, RELEASE)).toBeNull();
  expect(readCoverArtThumbnailUrl(null, RELEASE)).toBeNull();
});
