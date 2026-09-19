import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCuratedCourseDetail,
  getCuratedCourses,
  getSavedCuratedCourses,
  saveCuratedCourse,
  unsaveCuratedCourse,
} from "../api/curatedCourses";

export function useCuratedCourses() {
  return useQuery({
    queryKey: ["curated-courses"],
    queryFn: getCuratedCourses,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCuratedCourseDetail(id: number | null) {
  return useQuery({
    queryKey: ["curated-course", id],
    queryFn: () => getCuratedCourseDetail(id as number),
    enabled: id !== null,
  });
}

/** 내가 저장한 추천 코스. 하트 상태를 그리는 데 쓰므로 로그인했을 때만 부른다. */
export function useSavedCuratedCourses(enabled: boolean) {
  return useQuery({
    queryKey: ["saved-curated-courses"],
    queryFn: getSavedCuratedCourses,
    enabled,
  });
}

/** 저장/해제를 한 뮤테이션으로 처리한다. saved=현재 저장돼 있는지. */
export function useToggleSavedCuratedCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, saved }: { courseId: number; saved: boolean }) =>
      saved ? unsaveCuratedCourse(courseId) : saveCuratedCourse(courseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-curated-courses"] }),
  });
}
