import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addCourseItem,
  deleteCourseItem,
  getCourse,
  getCourseLodgingOptions,
  reorderCourseDayItems,
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

/**
 * 외부 링크(트립닷컴)를 다녀오면 탭이 통째로 새로 로드되어 메모리 캐시가 사라진다.
 * 직전 응답을 sessionStorage에 남겨 initialData로 쓰면 로딩 화면 없이 바로 그려지고,
 * 뒤에서 재조회가 최신으로 덮어쓴다.
 */
function persisted<T>(key: string, fetcher: () => Promise<T>) {
  const storageKey = `q:${key}`;
  return {
    initialData: (): T | undefined => {
      try {
        const raw = sessionStorage.getItem(storageKey);
        return raw ? (JSON.parse(raw) as T) : undefined;
      } catch {
        return undefined; // 저장소를 못 읽으면 그냥 새로 받는다.
      }
    },
    queryFn: async () => {
      const data = await fetcher();
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      } catch {
        // 용량 초과 등은 무시.
      }
      return data;
    },
  };
}

export function useCourse(courseId?: string | number) {
  return useQuery({
    queryKey: ["course", String(courseId)],
    ...persisted(`course:${courseId}`, () => getCourse(courseId!)),
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
    ...persisted(`lodging:${courseId}`, () => getCourseLodgingOptions(courseId!)),
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

/** 응답 형태가 미확인이라 반환값을 쓰지 않고, 성공하면 코스 상세를 재조회해서 최신 타임라인을 받는다. */
export function useReorderCourseItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      dayIndex,
      itemIds,
    }: {
      courseId: number | string;
      dayIndex: number;
      itemIds: number[];
    }) => reorderCourseDayItems(courseId, dayIndex, itemIds),
    onSuccess: (_res, { courseId }) => {
      qc.invalidateQueries({ queryKey: ["course", String(courseId)] });
    },
  });
}

export function useAddCourseItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      dayIndex,
      contentId,
      order,
    }: {
      courseId: number | string;
      dayIndex: number;
      contentId: string;
      order: number;
    }) => addCourseItem(courseId, dayIndex, contentId, order),
    onSuccess: (_res, { courseId }) => {
      qc.invalidateQueries({ queryKey: ["course", String(courseId)] });
    },
  });
}

export function useDeleteCourseItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, itemId }: { courseId: number | string; itemId: number }) =>
      deleteCourseItem(courseId, itemId),
    onSuccess: (_res, { courseId }) => {
      qc.invalidateQueries({ queryKey: ["course", String(courseId)] });
    },
  });
}
