import { useQuery } from "@tanstack/react-query";
import { getCuratedCourseDetail, getCuratedCourses } from "../api/curatedCourses";

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
