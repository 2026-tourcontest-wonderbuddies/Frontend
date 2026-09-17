import { apiClient } from "./client";
import type {
  CourseDetail,
  CoursePlacesResponse,
  CourseSummary,
  LodgingOptionsResponse,
  ModifyCourseResponse,
  SavedCourseToggle,
  SelectCourseResponse,
  SelectLodgingResponse,
} from "./types";

/** 명세 4번 */
export function getCourse(courseId: number | string) {
  return apiClient.get<CourseDetail>(`/courses/${courseId}/`);
}

/** 명세 5번 */
export function getCoursePlaces(courseId: number | string) {
  return apiClient.get<CoursePlacesResponse>(`/courses/${courseId}/places/`);
}

/**
 * 명세 6번. 명세서 경로에는 `/days/{day_index}/`가 있지만 숙소는 여행 전체 앵커라
 * 백엔드가 코스 단위로 구현했고(명세 7번 설명과 일치), 실제 라우트를 따른다.
 */
export function getCourseLodgingOptions(courseId: number | string) {
  return apiClient.get<LodgingOptionsResponse>(`/courses/${courseId}/lodging-options/`);
}

/** 명세 3번. body는 없다 — 경로의 course_id만으로 확정된다. */
export function selectCourse(courseId: number | string) {
  return apiClient.post<SelectCourseResponse>(`/courses/${courseId}/select/`, {});
}

/** 명세 7번 */
export function selectCourseLodging(courseId: number | string, contentId: string) {
  return apiClient.post<SelectLodgingResponse>(`/courses/${courseId}/select-lodging/`, {
    content_id: contentId,
  });
}

/** 명세 8번. 명세서 Method는 get으로 적혀 있으나 백엔드는 POST + raw_message. */
export function modifyCourse(courseId: number | string, rawMessage: string) {
  return apiClient.post<ModifyCourseResponse>(`/courses/${courseId}/modify/`, {
    raw_message: rawMessage,
  });
}

/** GET /api/courses/saved/ — 저장한 코스 목록. 장소 저장과 같이 배열을 그대로 준다. */
export function getSavedCourses() {
  return apiClient.get<CourseSummary[]>("/courses/saved/");
}

/** POST /api/courses/{course_id}/save/ — 코스 저장 */
export function saveCourse(courseId: number | string) {
  return apiClient.post<SavedCourseToggle>(`/courses/${courseId}/save/`, {});
}

/** DELETE /api/courses/{course_id}/save/ — 코스 저장 해제 */
export function unsaveCourse(courseId: number | string) {
  return apiClient.del<SavedCourseToggle>(`/courses/${courseId}/save/`);
}

// ── 코스 수동 편집 (TEAM_SHARE.md "새로 발견") ──────────────────────────────
// 응답 형태가 미확인이라 반환값은 쓰지 않는다 — 호출부가 성공 후 코스 상세를 재조회한다.

/** 그 날 안에서 장소 순서를 통째로 재배치한다. 이동시간·시각도 서버가 다시 계산한다. */
export function reorderCourseDayItems(
  courseId: number | string,
  dayIndex: number,
  itemIds: number[],
) {
  return apiClient.post(`/courses/${courseId}/days/${dayIndex}/reorder/`, {
    item_ids: itemIds,
  });
}

/** 그 날에 장소를 하나 추가한다. */
export function addCourseItem(
  courseId: number | string,
  dayIndex: number,
  contentId: string,
  order: number,
) {
  return apiClient.post(`/courses/${courseId}/days/${dayIndex}/items/`, {
    content_id: contentId,
    order,
  });
}

/** 장소를 하나 삭제한다. 뒤 일정은 서버가 재계산한다. */
export function deleteCourseItem(courseId: number | string, itemId: number) {
  return apiClient.del(`/courses/${courseId}/items/${itemId}/`);
}
