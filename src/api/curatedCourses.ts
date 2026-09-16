import { apiClient } from "./client";
import type { CuratedCourseDetail, CuratedCourseSummary } from "./types";

/** [daeun 전용 신규] GET /api/curated-courses/ — 추천 코스 전체 목록 */
export function getCuratedCourses() {
  return apiClient.get<CuratedCourseSummary[]>("/curated-courses/");
}

/** [daeun 전용 신규] GET /api/curated-courses/{id}/ — 추천 코스 상세(방문지 포함) */
export function getCuratedCourseDetail(id: number) {
  return apiClient.get<CuratedCourseDetail>(`/curated-courses/${id}/`);
}
