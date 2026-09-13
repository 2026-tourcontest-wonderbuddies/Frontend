import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCourse,
  getCourseLodgingOptions,
  selectCourse,
  selectCourseLodging,
} from "../api/courses";
import { getMyTrips, getTripCourses } from "../api/trips";
import type { CourseDetail } from "../api/types";

/**
 * 내가 만든 여행 이력(명세서 "이전 코스 조회").
 * 비로그인이면 빈 배열이 오므로 부를 필요가 없다 — enabled 로 막는다.
 */
export function useMyTrips(enabled: boolean) {
  return useQuery({
    queryKey: ["my-trips"],
    queryFn: getMyTrips,
    enabled,
  });
}

export function useTripCourses(tripId?: string) {
  return useQuery({
    queryKey: ["trip-courses", tripId],
    queryFn: () => getTripCourses(tripId!),
    enabled: Boolean(tripId),
  });
}

export function useCourse(courseId?: string | number) {
  return useQuery({
    queryKey: ["course", String(courseId)],
    queryFn: () => getCourse(courseId!),
    enabled: courseId != null,
  });
}

/**
 * 명세 흐름상 코스 3개는 id만 먼저 오므로(명세 2번) 상세를 각각 받아와야 한다.
 * 후보 목록 화면이 3건을 병렬로 조회한다.
 */
export function useCourseDetails(courseIds: number[]) {
  const results = useQueries({
    queries: courseIds.map((id) => ({
      queryKey: ["course", String(id)],
      queryFn: () => getCourse(id),
    })),
  });

  return {
    courses: results
      .map((r) => r.data)
      .filter((c): c is CourseDetail => Boolean(c)),
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
  };
}

export function useCourseLodgingOptions(courseId?: string | number) {
  return useQuery({
    queryKey: ["course-lodging-options", String(courseId)],
    queryFn: () => getCourseLodgingOptions(courseId!),
    enabled: courseId != null,
  });
}

export function useSelectCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: number | string) => selectCourse(courseId),
    onSuccess: (_res, courseId) => {
      qc.invalidateQueries({ queryKey: ["course", String(courseId)] });
      qc.invalidateQueries({ queryKey: ["trip-courses"] });
    },
  });
}

export function useSelectCourseLodging() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, contentId }: { courseId: number | string; contentId: string }) =>
      selectCourseLodging(courseId, contentId),
    onSuccess: (_res, { courseId }) => {
      // 숙소를 바꾸면 각 Day의 lodging이 갱신되므로 상세를 다시 받는다.
      qc.invalidateQueries({ queryKey: ["course", String(courseId)] });
      qc.invalidateQueries({ queryKey: ["course-lodging-options", String(courseId)] });
    },
  });
}
