import { apiClient } from "./client";
import type {
  CourseDetail,
  CoursePlacesResponse,
  LodgingOptionsResponse,
  ModifyCourseResponse,
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
