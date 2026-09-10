import type { CourseDay, CourseDetail, CourseItem } from "../api/types";

/** 모든 Day의 방문 항목을 순서대로 펼친다. */
export function courseItems(course: CourseDetail): CourseItem[] {
  return course.days.flatMap((d) => d.items);
}

/**
 * 코스 요약 지표. 백엔드는 방문 수·소요시간을 따로 주지 않으므로
 * 체류시간(place.stay_time_minutes)과 구간 이동시간을 더해 계산한다.
 */
export function courseStats(course: CourseDetail) {
  const items = courseItems(course);
  const stayMin = items.reduce((s, it) => s + it.place.stay_time_minutes, 0);
  const travelMin = items.reduce((s, it) => s + (it.travel_min_from_prev ?? 0), 0);
  return {
    visitCount: items.length,
    stayMin,
    travelMin,
    totalMin: stayMin + travelMin,
    dayCount: course.days.filter((d) => d.items.length > 0).length,
  };
}

/** 여행 전체에 하나 걸리는 숙소 앵커. Day별로 같은 스냅샷이 들어온다. */
export function courseLodging(course: CourseDetail) {
  return course.days.find((d) => d.lodging_snapshot)?.lodging_snapshot ?? null;
}

/** 날짜 라벨용 기준 시각. 첫 방문지의 도착 시각을 쓴다. */
export function courseStartIso(course: CourseDetail): string | null {
  return courseItems(course)[0]?.arrive_at ?? null;
}

export function dayHasContent(day: CourseDay): boolean {
  return day.items.length > 0 || Boolean(day.lodging_snapshot);
}
