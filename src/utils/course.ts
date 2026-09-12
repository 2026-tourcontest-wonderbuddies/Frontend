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
  return course.days.find((d) => d.lodging)?.lodging ?? null;
}

/** 날짜 라벨용 기준 시각. 첫 방문지의 도착 시각을 쓴다. */
export function courseStartIso(course: CourseDetail): string | null {
  return courseItems(course)[0]?.arrive_at ?? null;
}

const diffMin = (a: string, b: string) =>
  Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000));

/**
 * 그 날 타임라인 양 끝에 붙일 공항 시각과 공항↔인접 장소 이동시간.
 * 입도일(A)·당일치기(D)는 시작, 출도일(C)·당일치기(D)는 종료에 공항이 붙는다.
 * 서버가 trip_start_datetime/trip_end_datetime을 안 주면 전부 null이라 공항 항목은 그려지지 않는다.
 */
export function dayAirport(course: CourseDetail, day: CourseDay) {
  const depart = day.day_case === "A" || day.day_case === "D" ? course.trip_start_datetime : undefined;
  const arrive = day.day_case === "C" || day.day_case === "D" ? course.trip_end_datetime : undefined;
  const first = day.items[0];
  const last = day.items[day.items.length - 1];
  return {
    depart: depart ?? null,
    arrive: arrive ?? null,
    // 서버가 첫 항목의 travel_min_from_prev를 채워주면 그걸 쓰고, 아니면 공항 시각과 방문 시각의
    // 차이로 구한다(엔진이 공항 기준으로 스케줄을 잡으므로 같은 값이다).
    // ponytail: 엔진이 여유시간을 끼워 넣으면 그만큼 과대 표기된다.
    // 서버가 실제 이동시간을 내려주기 시작하면 ?? 앞쪽이 자동으로 이긴다.
    departTravelMin:
      depart && first ? (first.travel_min_from_prev ?? diffMin(depart, first.arrive_at)) : null,
    arriveTravelMin: arrive && last ? diffMin(last.depart_at, arrive) : null,
  };
}

export function dayHasContent(day: CourseDay): boolean {
  return day.items.length > 0 || Boolean(day.lodging);
}
