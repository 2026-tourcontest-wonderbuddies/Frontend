import { PRIORITY_LABELS, type CourseDay, type CourseDetail, type CourseItem, type CourseLodging } from "../api/types";
import type { KakaoMapPoint } from "../components/KakaoMap";

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
  const stayMin = items.reduce((s, it) => s + diffMin(it.arrive_at, it.depart_at), 0);
  const travelMin = items.reduce((s, it) => s + (it.travel_min_from_prev ?? 0), 0);
  return {
    visitCount: items.length,
    stayMin,
    travelMin,
    totalMin: stayMin + travelMin,
    dayCount: course.days.filter((d) => d.items.length > 0).length,
  };
}

/** 코스에는 이름 필드가 없어 첫·마지막 방문지로 한 줄 제목을 만든다. */
export function courseTitle(course: CourseDetail): string {
  const items = courseItems(course);
  const first = items[0]?.place.title ?? "";
  const last = items[items.length - 1]?.place.title ?? "";
  if (last && first !== last) return `${first}에서 ${last}까지`;
  return first || PRIORITY_LABELS[course.mode];
}

/** 여행 전체에 하나 걸리는 숙소 앵커. Day별로 같은 스냅샷이 들어온다. */
export function courseLodging(course: CourseDetail) {
  return course.days.find((d) => d.lodging)?.lodging ?? null;
}

/**
 * 실제 지도(KakaoMap)에 찍을 점들. 코스 지도 페이지와 코스 상세의 미니 지도가 같이 쓴다.
 * 번호는 타임라인과 일치시킨다 — 타임라인은 하루 단위로 1부터 다시 세므로,
 * 여러 날 코스는 "2-3"(Day 2의 3번째)으로 표기한다.
 * 첫 방문지 = 출발지, 마지막 방문지 = 도착지. 숙소는 여행 전체에 하나뿐이라 따로 붙인다.
 * dayIndex 를 주면 그 날 장소만 담는다(번호는 그 날 기준 1부터) — 지도가 그 날 동선에 맞게 확대된다.
 */
export function courseMapPoints(course: CourseDetail, dayIndex?: number): KakaoMapPoint[] {
  const days = dayIndex == null ? course.days : course.days.filter((d) => d.day_index === dayIndex);
  const isMultiDay = days.length > 1;
  const visitPoints: KakaoMapPoint[] = days.flatMap((day) =>
    day.items.map((item, idx) => ({
      id: String(item.id),
      title: item.place.title,
      latitude: item.place.latitude,
      longitude: item.place.longitude,
      label: isMultiDay ? `${day.day_index}-${idx + 1}` : String(idx + 1),
      kind: "visit" as const,
    })),
  );
  if (visitPoints.length > 0) {
    visitPoints[0] = { ...visitPoints[0], kind: "start" };
    visitPoints[visitPoints.length - 1] = { ...visitPoints[visitPoints.length - 1], kind: "end" };
  }
  const lodging = courseLodging(course);
  if (!lodging) return visitPoints;
  return [
    ...visitPoints,
    {
      id: `lodging-${lodging.content_id}`,
      title: lodging.title,
      latitude: lodging.lat,
      longitude: lodging.lon,
      label: "숙소",
      kind: "lodging",
    },
  ];
}

/** 날짜 라벨용 기준 시각. 첫 방문지의 도착 시각을 쓴다. */
export function courseStartIso(course: CourseDetail): string | null {
  return courseItems(course)[0]?.arrive_at ?? null;
}

export const diffMin = (a: string, b: string) =>
  Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000));

const subMin = (iso: string, min: number) => new Date(new Date(iso).getTime() - min * 60000).toISOString();

/**
 * 시각 차이(diffMin)로 "유추한" 이동시간에만 씌우는 안전장치다.
 * 서버가 2일차 이후 arrive_at/depart_at에 1일차 날짜를 그대로 넣는 경우가 있어,
 * 시각 차이로 계산하면 며칠치(수천 분)가 나온다. 그런 값은 표시하지 않는다.
 *
 * 서버가 직접 내려준 값(travel_min_from_prev, return_to_airport_travel_min)에는 쓰지 않는다.
 * 엔진의 60분 컷은 장소↔장소 구간에만 걸리고, 숙소는 사용자가 나중에 고르는 거라
 * 반대편 권역이면 65~90분이 정상이다. 그걸 걸러내면 이동시간 줄이 통째로 사라진다.
 */
const MAX_TRAVEL_MIN = 60;
const travelOrNull = (min: number) => (min > 0 && min <= MAX_TRAVEL_MIN ? min : null);

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
    // ?? 가 아니라 || 인 이유: 서버가 0을 주면 이동시간 자체가 없다는 뜻이라 fallback을 타야 한다.
    // ponytail: 엔진이 여유시간을 끼워 넣으면 그만큼 과대 표기된다.
    departTravelMin:
      depart && first
        ? first.travel_min_from_prev || travelOrNull(diffMin(depart, first.arrive_at))
        : null,
    // 서버 좌표 기반 추정치(return_to_airport_travel_min)가 있으면 그걸 우선 쓴다.
    // 시각 차이(diffMin)는 여유시간이 끼어있거나 날짜가 어긋나면 부풀거나 깨진다.
    arriveTravelMin:
      arrive && last
        ? course.return_to_airport_travel_min ?? travelOrNull(diffMin(last.depart_at, arrive))
        : null,
  };
}

/**
 * 2일차부터 그 날 타임라인의 출발점은 전날 묵은 숙소다(백엔드가 select-lodging 확정 후
 * 첫 항목의 travel_min_from_prev를 전날 숙소 기준으로 재계산해 준다 — course_modifier.py
 * ccfbe7e에서 day.lodging_snapshot이 아니라 prev_day.lodging_snapshot을 보도록 고쳤다).
 * day.lodging(이 날 자신의 숙소)은 마지막 날엔 항상 null이라 못 쓴다 — 반드시 전날 걸 봐야 한다.
 */
export function dayLodgingStart(course: CourseDetail, dayIdx: number) {
  const day = course.days[dayIdx];
  const prevLodging = course.days[dayIdx - 1]?.lodging;
  const first = day?.items[0];
  if (dayIdx === 0 || !prevLodging || !first) {
    return { lodging: null as CourseLodging | null, time: null as string | null, travelMin: null as number | null };
  }
  const rawTravel = first.travel_min_from_prev ?? 0;
  return {
    lodging: prevLodging,
    time: subMin(first.arrive_at, rawTravel),
    // 숙소→첫 장소는 서버가 OSRM으로 재계산해 준 값이라 그대로 믿는다.
    travelMin: rawTravel > 0 ? rawTravel : null,
  };
}
