import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSavedCourses, saveCourse, unsaveCourse } from "../api/courses";

/** GET /api/courses/saved/ — 계정에 저장한 코스 목록. 장소 저장과 같이 로그인 상태에서만 부른다. */
export function useSavedCourses(enabled: boolean) {
  return useQuery({
    queryKey: ["saved-courses"],
    queryFn: getSavedCourses,
    enabled,
  });
}

/** 저장/해제를 한 뮤테이션으로 처리한다. saved=현재 저장돼 있는지. */
export function useToggleSavedCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, saved }: { courseId: number; saved: boolean }) =>
      saved ? unsaveCourse(courseId) : saveCourse(courseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-courses"] }),
  });
}
