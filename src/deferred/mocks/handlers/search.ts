import { http, HttpResponse } from "msw";
import { searchSeedPlaces } from "../data";
import type { RegionKey } from "../../types";

export const searchHandlers = [
  http.get("/api/places/search", ({ request }) => {
    const url = new URL(request.url);
    const results = searchSeedPlaces({
      q: url.searchParams.get("q") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
      region: (url.searchParams.get("region") as RegionKey | null) ?? undefined,
    });
    return HttpResponse.json(results);
  }),
];
