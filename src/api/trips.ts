import { apiClient } from "./client";
import type { TripCoursesResponse, TripCreateRequest, TripCreateResponse } from "./types";

/** 명세 1번. 코스 본문이 아니라 trip_id + 3개 코스 id를 돌려준다. */
export function createTrip(payload: TripCreateRequest) {
  return apiClient.post<TripCreateResponse>("/trips/", payload);
}

/** 명세 2번 */
export function getTripCourses(tripId: number | string) {
  return apiClient.get<TripCoursesResponse>(`/trips/${tripId}/courses/`);
}
