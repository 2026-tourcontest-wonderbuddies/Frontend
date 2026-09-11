import { apiClient } from "./client";
import type { PlaceSearchQuery, PlaceSearchResponse } from "./types";

/** [daeun 전용 신규] GET /api/places/search/ — 이름/유형/권역으로 장소 검색 */
export function searchPlaces(params: PlaceSearchQuery) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.region && params.region !== "ALL") query.set("region", params.region);
  query.set("page", String(params.page ?? 1));
  query.set("page_size", String(params.page_size ?? 20));

  return apiClient.get<PlaceSearchResponse>(`/places/search/?${query.toString()}`);
}
