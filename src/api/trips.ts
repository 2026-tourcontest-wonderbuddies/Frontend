import { apiClient } from "./client";
import type {
  TripCoursesResponse,
  TripCreateRequest,
  TripCreateResponse,
  TripHistory,
} from "./types";

/** 명세 1번. 코스 본문이 아니라 trip_id + 3개 코스 id를 돌려준다. */
export function createTrip(payload: TripCreateRequest) {
  return apiClient.post<TripCreateResponse>("/trips/", payload);
}

/** 명세 2번 */
export function getTripCourses(tripId: number | string) {
  return apiClient.get<TripCoursesResponse>(`/trips/${tripId}/courses/`);
}

/**
 * 명세서 "이전 코스 조회" 행. 로그인한 사용자가 지금까지 만든 여행 이력을 최신순으로 준다.
 * 비로그인이면 서버가 빈 배열을 준다(에러가 아니다).
 */
export function getMyTrips() {
  return apiClient.get<TripHistory[]>("/trips/");
}
