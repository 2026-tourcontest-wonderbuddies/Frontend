import { apiClient } from "./client";
import type {
  PeriodPlacesResponse,
  PlaceDetail,
  PlaceSearchQuery,
  PlaceSearchResponse,
  PlaceSummary,
  SavedPlaceToggle,
} from "./types";

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

/** GET /api/places/by-period/ — 홈 시간대 카드에 들어갈 장소 */
export function getPeriodPlaces(period: string, limit = 10) {
  return apiClient.get<PeriodPlacesResponse>(
    `/places/by-period/?period=${period}&limit=${limit}`,
  );
}

/**
 * GET /api/places/{content_id}/ — 장소 상세.
 * 명세서 Method는 POST로 적혀 있으나 백엔드는 GET만 허용한다(Allow: GET, HEAD, OPTIONS).
 */
export function getPlaceDetail(contentId: string) {
  return apiClient.get<PlaceDetail>(`/places/${contentId}/`);
}

/** GET /api/places/saved/ — 저장한 장소 목록. 서버가 배열을 그대로 준다(래핑 없음). */
export function getSavedPlaces() {
  return apiClient.get<PlaceSummary[]>("/places/saved/");
}

/** POST /api/places/{content_id}/save/ — 장소 저장 */
export function savePlace(contentId: string) {
  return apiClient.post<SavedPlaceToggle>(`/places/${contentId}/save/`, {});
}

/** DELETE /api/places/{content_id}/save/ — 저장 해제 */
export function unsavePlace(contentId: string) {
  return apiClient.del<SavedPlaceToggle>(`/places/${contentId}/save/`);
}
