// Display helpers for GeoNames places and the localities copied from them.

type PlaceLike = {
  name: string;
  region_code?: string | null;
  region_name?: string | null;
  country_code?: string | null;
  country_name?: string | null;
};

// Full label for search results: "Portland, OR, United States",
// "Berlin, Germany".
export function formatPlace(p: PlaceLike) {
  return [p.name, p.region_code, p.country_name].filter(Boolean).join(", ");
}

// Short label for lists: "Portland, OR" in the US and Canada, otherwise
// "Berlin, Germany".
export function formatShortPlace(p: {
  name: string;
  region_code?: string | null;
  region?: string | null;
  country?: string | null;
  country_code?: string | null;
}) {
  const second = p.region_code ?? (p.country_code === "US" ? p.region : p.country) ?? p.region ?? null;
  return [p.name, second].filter(Boolean).join(", ");
}
