export type CatalogTrackView = {
  associationId: string;
  musicTrackId: string;
  title: string;
  artist: string;
  albumTitle: string | null;
  disambiguation: string | null;
  artworkUrl: string | null;
  displayOrder: number;
};

export type CatalogCategoryView = {
  id: string;
  name: string;
  displayOrder: number;
  tracks: CatalogTrackView[];
};

export type CatalogWorkspace = {
  revision: number;
  categories: CatalogCategoryView[];
};
