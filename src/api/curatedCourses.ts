import { apiClient } from "./client";
import type { CuratedCourseDetail, CuratedCourseSummary, SavedCourseToggle } from "./types";

/** [daeun 전용 신규] GET /api/curated-courses/ — 추천 코스 전체 목록 */
export function getCuratedCourses() {
  return apiClient.get<CuratedCourseSummary[]>("/curated-courses/");
}

/** [daeun 전용 신규] GET /api/curated-courses/{id}/ — 추천 코스 상세(방문지 포함) */
export function getCuratedCourseDetail(id: number) {
  return apiClient.get<CuratedCourseDetail>(`/curated-courses/${id}/`);
}

/** GET /api/curated-courses/saved/ — 내가 저장한 추천 코스 목록(로그인 필요) */
export function getSavedCuratedCourses() {
  return apiClient.get<CuratedCourseSummary[]>("/curated-courses/saved/");
}

/** POST /api/curated-courses/{id}/save/ — 추천 코스 저장 */
export function saveCuratedCourse(id: number) {
  return apiClient.post<SavedCourseToggle>(`/curated-courses/${id}/save/`, {});
}

/** DELETE /api/curated-courses/{id}/save/ — 추천 코스 저장 취소 */
export function unsaveCuratedCourse(id: number) {
  return apiClient.del<SavedCourseToggle>(`/curated-courses/${id}/save/`);
}
