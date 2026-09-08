import type {
  CandidateScores,
  CandidatesResponse,
  CoursePriority,
  DayCase,
  ItineraryDayDTO,
  ItineraryItemDTO,
  LodgingDTO,
  LodgingRecommendationDTO,
  PlaceDTO,
  PlaceSearchParams,
  Quadrant,
  SlotType,
  TripCandidateDTO,
  TripRequestPayload,
  TripResponse,
} from "../types";
import { SEED_LODGINGS } from "./lodging-data";
import { centroid, distanceKm } from "../../utils/geo";

// Small seed pool standing in for the real Place table until the backend
// exposes /api/places. Enough variety to demo region + purpose matching.
interface SeedPlace extends PlaceDTO {
  purposes: string[];
  stayMin: number;
  category?: string; // TourAPI 중분류 이름 (일자별 exclude_categories와 매칭)
}

const SEED_PLACES: SeedPlace[] = [
  {
    content_id: "P001",
    title: "성산일출봉 일출",
    address: "서귀포시 성산읍 성산리",
    longitude: 126.9425,
    latitude: 33.4587,
    overview: "어스름 속 응회구 정상 계단을 올라, 수평선 위로 해가 떠오르는 순간을 마주합니다.",
    content_type_name: "관광지",
    small_category_name: "자연관광지",
    quadrant: "SE",
    satisfaction_score: 4.54,
    purposes: ["nature", "photo"],
    stayMin: 60,
    category: "자연경관(산)",
  },
  {
    content_id: "P002",
    title: "섭지코지",
    address: "서귀포시 성산읍 섭지코지로",
    longitude: 126.9275,
    latitude: 33.4238,
    overview: "아침 햇살 아래 등대와 유채꽃 벌판을 걷는 해안 산책로.",
    content_type_name: "관광지",
    small_category_name: "자연관광지",
    quadrant: "SE",
    satisfaction_score: 4.4,
    purposes: ["nature", "photo"],
    stayMin: 60,
  },
  {
    content_id: "P003",
    title: "광치기 해변 맛집",
    address: "서귀포시 성산읍 고성리",
    longitude: 126.9139,
    latitude: 33.4381,
    overview: "썰물 때 드러나는 넓은 여(암반) 지대를 걸으며 근처 식당에서 여유롭게 점심.",
    content_type_name: "음식점",
    small_category_name: "해산물요리",
    quadrant: "SE",
    satisfaction_score: 4.3,
    purposes: ["food"],
    stayMin: 80,
  },
  {
    content_id: "P004",
    title: "표선해수욕장",
    address: "서귀포시 표선면 표선리",
    longitude: 126.8367,
    latitude: 33.3253,
    overview: "넓은 백사장과 얕은 수심이 특징인 해변.",
    content_type_name: "관광지",
    small_category_name: "해수욕장",
    quadrant: "SE",
    satisfaction_score: 4.56,
    purposes: ["nature", "activity"],
    stayMin: 60,
  },
  {
    content_id: "P005",
    title: "서귀포 매일 올레시장 노을",
    address: "서귀포시 중앙로",
    longitude: 126.5608,
    latitude: 33.2515,
    overview: "해질녘 붉은 빛 아래, 갓 튀긴 오메기떡과 회국수 노점이 불을 켜는 시장 골목.",
    content_type_name: "쇼핑",
    small_category_name: "전통시장",
    quadrant: "SW",
    satisfaction_score: 4.45,
    purposes: ["food", "shopping"],
    stayMin: 90,
    category: "시장",
  },
  {
    content_id: "P006",
    title: "협재해수욕장",
    address: "제주시 한림읍 협재리",
    longitude: 126.2394,
    latitude: 33.3941,
    overview: "에메랄드빛 바다와 백사장, 비양도가 보이는 서쪽 대표 해변.",
    content_type_name: "관광지",
    small_category_name: "해수욕장",
    quadrant: "NW",
    satisfaction_score: 4.5,
    purposes: ["nature", "photo"],
    stayMin: 70,
    category: "자연경관(하천·해양)",
  },
  {
    content_id: "P007",
    title: "애월 카페거리",
    address: "제주시 애월읍 애월로",
    longitude: 126.3266,
    latitude: 33.4626,
    overview: "해안도로를 따라 늘어선 감성 카페와 미디어아트 전시.",
    content_type_name: "음식점",
    small_category_name: "카페",
    quadrant: "NW",
    satisfaction_score: 4.35,
    purposes: ["food", "photo"],
    stayMin: 60,
  },
  {
    content_id: "P008",
    title: "동문재래시장 야시장",
    address: "제주시 관덕로",
    longitude: 126.5219,
    latitude: 33.5136,
    overview: "밤이면 불을 밝히는 야시장 골목, 흑돼지 꼬치와 오메기떡.",
    content_type_name: "쇼핑",
    small_category_name: "전통시장",
    quadrant: "NE",
    satisfaction_score: 4.4,
    purposes: ["food", "shopping"],
    stayMin: 90,
    category: "시장",
  },
  {
    content_id: "P009",
    title: "월정리해수욕장",
    address: "제주시 구좌읍 월정리",
    longitude: 126.7961,
    latitude: 33.5563,
    overview: "새하얀 모래와 코발트빛 바다, 해안가 카페 산책로.",
    content_type_name: "관광지",
    small_category_name: "해수욕장",
    quadrant: "NE",
    satisfaction_score: 4.48,
    purposes: ["nature", "photo", "activity"],
    stayMin: 60,
    category: "자연경관(하천·해양)",
  },
  {
    content_id: "P010",
    title: "용머리해안",
    address: "서귀포시 안덕면 사계리",
    longitude: 126.3103,
    latitude: 33.2306,
    overview: "파도가 깎아낸 기암절벽 해안 산책로, 노을 명소.",
    content_type_name: "관광지",
    small_category_name: "자연관광지",
    quadrant: "SW",
    satisfaction_score: 4.42,
    purposes: ["nature", "culture", "photo"],
    stayMin: 60,
    category: "자연경관(하천·해양)",
  },
];

const QUADRANT_BY_REGION: Record<string, Quadrant | undefined> = {
  제주시동부: "NE",
  제주시서부: "NW",
  제주시내: "NW",
  서귀포동부: "SE",
  서귀포서부: "SW",
  전역: undefined,
};

function isoAt(baseDate: Date, minutesFromMidnight: number): string {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  d.setMinutes(minutesFromMidnight);
  return d.toISOString();
}

function slotTypeFor(place: SeedPlace, needLunch: boolean, needDinner: boolean, filledLunch: boolean): SlotType {
  if (place.content_type_name === "음식점") {
    if (needLunch && !filledLunch) return "RESTAURANT";
    if (needDinner) return "RESTAURANT";
    return "CAFE";
  }
  return "GENERAL";
}

function resolveDayConditions(payload: TripRequestPayload, dayIndex: number) {
  const override = payload.day_overrides?.find((o) => o.day_index === dayIndex);
  return {
    purposeMain: override?.purpose_main ?? payload.purpose_main,
    purposeSub: override?.purpose_sub ?? payload.purpose_sub,
    region: override?.region_preference ?? payload.region_preference,
    // 제외 카테고리는 일자별 조건에만 존재한다 (공통 입력에서 제거됨).
    excludeCategories: override?.exclude_categories ?? [],
  };
}

function buildDay(
  dayIndex: number,
  dayCase: DayCase,
  dayDate: Date,
  payload: TripRequestPayload,
  excludeIds: Set<string>,
): ItineraryDayDTO {
  const { purposeMain, purposeSub, region } = resolveDayConditions(payload, dayIndex);
  const quadrant = region ? QUADRANT_BY_REGION[region] : undefined;
  const purposes = [purposeMain, purposeSub].filter(Boolean) as string[];

  const bySort = (a: SeedPlace, b: SeedPlace) => {
    const aScore = a.purposes.some((pp) => purposes.includes(pp)) ? 1 : 0;
    const bScore = b.purposes.some((pp) => purposes.includes(pp)) ? 1 : 0;
    return bScore - aScore;
  };

  const remaining = SEED_PLACES.filter((p) => !excludeIds.has(p.content_id));
  const inQuadrant = remaining.filter((p) => !quadrant || p.quadrant === quadrant).sort(bySort);
  // The demo seed pool is tiny — once a region runs out of fresh candidates for a
  // later day, widen the search instead of leaving the day empty.
  const pool = inQuadrant.length >= 2 ? inQuadrant : remaining.sort(bySort);

  const availHours = dayCase === "D" ? 8 : dayCase === "B" ? 12 : 6.5;
  const targetSlots = Math.max(0, Math.min(pool.length, Math.round(availHours)));
  const needLunch = dayCase !== "A";
  const needDinner = true;

  const chosen = pool.slice(0, targetSlots);
  let cursor = dayCase === "A" ? 15 * 60 : 9 * 60; // minutes from midnight
  let filledLunch = false;

  const items: ItineraryItemDTO[] = chosen.map((place, idx) => {
    const travel = idx === 0 ? 0 : 15 + (idx % 3) * 5;
    cursor += travel;
    const arrive = cursor;
    cursor += place.stayMin;
    const depart = cursor;
    const slotType = slotTypeFor(place, needLunch, needDinner, filledLunch);
    if (slotType === "RESTAURANT" && !filledLunch) filledLunch = true;
    excludeIds.add(place.content_id);

    const { purposes: _p, stayMin: _s, ...placeDto } = place;
    return {
      order: idx,
      slot_type: slotType,
      place: placeDto,
      arrive_at: isoAt(dayDate, arrive),
      depart_at: isoAt(dayDate, depart),
      stay_min: place.stayMin,
      travel_min_from_prev: idx === 0 ? null : travel,
      hours_uncertain: false,
      pref_score: 0.7,
      adjusted_qual: (place.satisfaction_score ?? 4.0) / 5,
    };
  });

  return {
    day_index: dayIndex,
    day_case: dayCase,
    avail_hours: availHours,
    target_slots: targetSlots,
    need_lunch: needLunch,
    need_dinner: needDinner,
    need_night_spot: false,
    lodging: null,
    items,
  };
}

function dayCaseFor(index: number, total: number): DayCase {
  if (total === 1) return "D";
  if (index === 1) return "A";
  if (index === total) return "C";
  return "B";
}

let counter = 0;
export function nextTripId(): string {
  counter += 1;
  return `trip-${Date.now().toString(36)}-${counter}`;
}

export function generateTrip(payload: TripRequestPayload): TripResponse {
  const start = new Date(payload.start_datetime);
  const end = new Date(payload.end_datetime);
  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(
    1,
    Math.round((new Date(end.toDateString()).getTime() - new Date(start.toDateString()).getTime()) / msPerDay) + 1,
  );

  const excludeIds = new Set<string>();
  const days: ItineraryDayDTO[] = [];
  for (let i = 1; i <= totalDays; i += 1) {
    const dayCase = dayCaseFor(i, totalDays);
    const dayDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + (i - 1));
    days.push(buildDay(i, dayCase, dayDate, payload, excludeIds));
  }

  return {
    id: nextTripId(),
    created_at: new Date().toISOString(),
    request: payload,
    total_days: totalDays,
    days,
  };
}

// ── Course candidates (POST /api/trips/candidates/) ────────────────────────
// Three variants (dist/pref/relax) generated from the same seed pool, mirroring
// the backend's MODE_MULTIPLIER idea from constraints.py (dist=1.0, pref=0.9,
// relax=0.7) without reimplementing the real beam search.

const MODE_MULTIPLIER: Record<CoursePriority, number> = { dist: 1.0, pref: 0.9, relax: 0.7 };
const MODE_LABEL: Record<CoursePriority, string> = {
  dist: "동선 효율 추천",
  pref: "취향 맞춤 추천",
  relax: "여유로운 코스 추천",
};
const MODE_DESCRIPTION: Record<CoursePriority, string> = {
  dist: "이동 거리가 짧고 장소 간 동선이 효율적으로 구성된 코스예요.",
  pref: "선택한 여행 목적과 분위기에 가장 잘 맞는 장소들로 구성된 코스예요.",
  relax: "장소 사이에 여유 시간을 더 두어 서두르지 않고 즐길 수 있는 코스예요.",
};
const MODE_SCORES: Record<CoursePriority, CandidateScores> = {
  dist: { move_eff: 5, pref_fit: 4, slack: 3 },
  pref: { move_eff: 3, pref_fit: 5, slack: 4 },
  relax: { move_eff: 3, pref_fit: 4, slack: 5 },
};
const RELAX_BUFFER_MIN = 30;

function purposeFilteredPool(payload: TripRequestPayload, dayIndex: number, excludeIds: Set<string>): SeedPlace[] {
  const { region, excludeCategories } = resolveDayConditions(payload, dayIndex);
  const quadrant = region ? QUADRANT_BY_REGION[region] : undefined;

  return SEED_PLACES.filter((p) => !excludeIds.has(p.content_id))
    .filter((p) => !quadrant || p.quadrant === quadrant)
    .filter((p) => !p.category || !excludeCategories.includes(p.category));
}

function buildCandidateDay(
  dayIndex: number,
  dayCase: DayCase,
  dayDate: Date,
  payload: TripRequestPayload,
  excludeIds: Set<string>,
  mode: CoursePriority,
): ItineraryDayDTO {
  const { purposeMain, purposeSub } = resolveDayConditions(payload, dayIndex);
  const purposes = [purposeMain, purposeSub].filter(Boolean) as string[];

  const pool = purposeFilteredPool(payload, dayIndex, excludeIds);
  const sorted =
    mode === "dist"
      ? [...pool] // no purpose re-sort — proxy for "closest first"
      : [...pool].sort((a, b) => {
          const aScore = a.purposes.some((pp) => purposes.includes(pp)) ? 1 : 0;
          const bScore = b.purposes.some((pp) => purposes.includes(pp)) ? 1 : 0;
          return bScore - aScore;
        });

  const availHours = dayCase === "D" ? 8 : dayCase === "B" ? 12 : 6.5;
  const targetSlots = Math.max(0, Math.min(sorted.length, Math.round(7 * (availHours / 12) * MODE_MULTIPLIER[mode])));
  const needLunch = dayCase !== "A";
  const needDinner = true;

  const chosen = sorted.slice(0, targetSlots);
  let cursor = dayCase === "A" ? 15 * 60 : 9 * 60;
  let filledLunch = false;
  const buffer = mode === "relax" ? RELAX_BUFFER_MIN : 0;

  const items: ItineraryItemDTO[] = chosen.map((place, idx) => {
    const travel = (idx === 0 ? 0 : 15 + (idx % 3) * 5) + (idx === 0 ? 0 : buffer);
    cursor += travel;
    const arrive = cursor;
    cursor += place.stayMin;
    const depart = cursor;
    const slotType = slotTypeFor(place, needLunch, needDinner, filledLunch);
    if (slotType === "RESTAURANT" && !filledLunch) filledLunch = true;
    excludeIds.add(place.content_id);

    const { purposes: _p, stayMin: _s, category: _c, ...placeDto } = place;
    return {
      order: idx,
      slot_type: slotType,
      place: placeDto,
      arrive_at: isoAt(dayDate, arrive),
      depart_at: isoAt(dayDate, depart),
      stay_min: place.stayMin,
      travel_min_from_prev: idx === 0 ? null : travel,
      hours_uncertain: false,
      pref_score: 0.7,
      adjusted_qual: (place.satisfaction_score ?? 4.0) / 5,
    };
  });

  return {
    day_index: dayIndex,
    day_case: dayCase,
    avail_hours: availHours,
    target_slots: targetSlots,
    need_lunch: needLunch,
    need_dinner: needDinner,
    need_night_spot: false,
    lodging: null,
    items,
  };
}

function totalDaysFor(payload: TripRequestPayload): number {
  const start = new Date(payload.start_datetime);
  const end = new Date(payload.end_datetime);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(
    1,
    Math.round((new Date(end.toDateString()).getTime() - new Date(start.toDateString()).getTime()) / msPerDay) + 1,
  );
}

function buildCandidate(payload: TripRequestPayload, mode: CoursePriority): TripCandidateDTO | null {
  const totalDays = totalDaysFor(payload);
  const start = new Date(payload.start_datetime);
  const excludeIds = new Set<string>();
  const days: ItineraryDayDTO[] = [];

  for (let i = 1; i <= totalDays; i += 1) {
    const dayCase = dayCaseFor(i, totalDays);
    const dayDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + (i - 1));
    days.push(buildCandidateDay(i, dayCase, dayDate, payload, excludeIds, mode));
  }

  const allItems = days.flatMap((d) => d.items);
  if (allItems.length === 0) return null;

  const totalStayMin = allItems.reduce((sum, it) => sum + it.stay_min, 0);
  const totalTravelMin = allItems.reduce((sum, it) => sum + (it.travel_min_from_prev ?? 0), 0);
  const totalAvailMin = days.reduce((sum, d) => sum + d.avail_hours * 60, 0);
  const mealCount = allItems.filter((it) => it.slot_type !== "GENERAL").length;

  const badges = [`식사 ${mealCount}회 포함`];
  if (mode === "relax") badges.push("휴식 버퍼 포함");
  if (mode === "dist") badges.push("이동 최소화");

  return {
    id: `cand-${mode}-${Date.now().toString(36)}-${Math.round(Math.random() * 1e4)}`,
    mode,
    label: MODE_LABEL[mode],
    visit_count: allItems.length,
    total_duration_min: totalStayMin + totalTravelMin,
    total_distance_km: Math.round(totalTravelMin * 0.75),
    slack_min: Math.max(0, Math.round(totalAvailMin - totalStayMin - totalTravelMin)),
    scores: MODE_SCORES[mode],
    description: MODE_DESCRIPTION[mode],
    badges,
    days,
  };
}

export function generateCandidates(payload: TripRequestPayload): CandidatesResponse {
  const modes: CoursePriority[] = ["dist", "pref", "relax"];
  const candidates = modes
    .map((mode) => buildCandidate(payload, mode))
    .filter((c): c is TripCandidateDTO => c !== null);

  return {
    request_id: `req-${Date.now().toString(36)}-${Math.round(Math.random() * 1e4)}`,
    candidates,
  };
}

export function candidateToTrip(
  request: TripRequestPayload,
  candidate: TripCandidateDTO,
  lodging?: LodgingDTO | null,
): TripResponse {
  const totalDays = candidate.days.length;
  // 숙소는 여행 전체에 하나. 마지막 날은 돌아가는 날이라 숙박이 없다.
  const days = candidate.days.map((day) => ({
    ...day,
    lodging: lodging && day.day_index < totalDays ? lodging : null,
  }));

  return {
    id: nextTripId(),
    created_at: new Date().toISOString(),
    request,
    total_days: totalDays,
    days,
  };
}

// ── Lodging recommendations (GET /api/lodging/recommendations) ─────────────
// 코스 확정 *전*에 후보를 기준으로 계산한다. 숙박일(마지막 날 제외)들의 마지막 일정
// 좌표 평균에서 가까운 순으로 Top-3.

const KM_PER_MIN = 0.75; // buildCandidate의 거리 근사와 같은 상수

export function findLodging(contentId: string): LodgingDTO | null {
  return SEED_LODGINGS.find((l) => l.content_id === contentId) ?? null;
}

export function generateLodgingRecommendations(
  request: TripRequestPayload,
  candidate: TripCandidateDTO,
): LodgingRecommendationDTO[] {
  const totalDays = candidate.days.length;
  if (totalDays < 2) return []; // 당일치기는 숙박 없음

  const needCooking = (request.lodging_conditions ?? []).includes("취사가능");
  const wantedType = request.lodging_type && request.lodging_type !== "상관없음" ? request.lodging_type : null;

  const pool = SEED_LODGINGS.filter((l) => {
    if (wantedType && l.small_category_name !== wantedType) return false;
    if (needCooking && !l.cooking) return false;
    return true;
  });
  if (pool.length === 0) return [];

  // 숙박하는 날들의 마지막 일정 위치
  const lastStops = candidate.days
    .filter((d) => d.day_index < totalDays && d.items.length > 0)
    .map((d) => d.items[d.items.length - 1].place);
  const anchor = centroid(lastStops);

  const scored = pool.map((lodging) => {
    const km = anchor ? distanceKm(anchor, lodging) : 0;
    const travelMin = Math.max(5, Math.round(km / KM_PER_MIN));

    const reasons: string[] = [];
    if (anchor) reasons.push(`마지막 일정에서 차로 약 ${travelMin}분`);
    if (needCooking && lodging.cooking) reasons.push("취사 가능");
    if (wantedType) reasons.push(`${wantedType} 조건 일치`);
    if (lodging.parking) reasons.push("주차 가능");

    const missing: string[] = [];
    if (lodging.price_per_night == null) missing.push("1박 요금");
    if (!lodging.check_in_time) missing.push("체크인 시간");

    return {
      lodging,
      travel_min_from_last_stop: travelMin,
      match_reason: reasons.join(" · "),
      missing_fields: missing,
      km,
    };
  });

  return scored
    .sort((a, b) => a.km - b.km)
    .slice(0, 3)
    .map(({ km: _km, ...rec }) => rec);
}

// ── Place lookups used by the edit/chat handlers ───────────────────────────

export interface ReplacementPick {
  place: PlaceDTO;
  stayMin: number;
}

export function pickReplacementPlace(excludeIds: Set<string>, quadrant?: Quadrant): ReplacementPick | null {
  const inQuadrant = SEED_PLACES.find((p) => !excludeIds.has(p.content_id) && (!quadrant || p.quadrant === quadrant));
  const candidate = inQuadrant ?? SEED_PLACES.find((p) => !excludeIds.has(p.content_id));
  if (!candidate) return null;
  const { purposes: _p, stayMin, category: _c, ...place } = candidate;
  return { place, stayMin };
}

// ── Place search (GET /api/places/search) ──────────────────────────────────

export function searchSeedPlaces(params: PlaceSearchParams): PlaceDTO[] {
  const quadrant = params.region ? QUADRANT_BY_REGION[params.region] : undefined;
  const q = params.q?.trim().toLowerCase();

  return SEED_PLACES.filter((p) => {
    if (quadrant && p.quadrant !== quadrant) return false;
    if (params.category && p.content_type_name !== params.category) return false;
    if (q && !p.title.toLowerCase().includes(q) && !p.address.toLowerCase().includes(q)) return false;
    return true;
  }).map(({ purposes: _p, stayMin: _s, category: _c, ...place }) => place);
}

// Fixed demo trip used by Home/List curated cards so they always show a
// fully authored example (ported 1:1 from the original static prototype).
export const DEMO_TRIP_ID = "demo-seongsan";

export const DEMO_TRIP: TripResponse = {
  id: DEMO_TRIP_ID,
  created_at: new Date().toISOString(),
  total_days: 1,
  request: {
    start_datetime: "2026-09-12T06:00:00+09:00",
    end_datetime: "2026-09-12T19:00:00+09:00",
    headcount: 2,
    purpose_main: "nature",
    purpose_sub: "photo",
    region_preference: "서귀포동부",
  },
  days: [
    {
      day_index: 1,
      day_case: "D",
      avail_hours: 12,
      target_slots: 5,
      need_lunch: true,
      need_dinner: false,
      need_night_spot: false,
      lodging: null,
      items: [
        {
          order: 0,
          slot_type: "GENERAL",
          place: SEED_PLACES[0],
          arrive_at: "2026-09-12T06:00:00+09:00",
          depart_at: "2026-09-12T07:00:00+09:00",
          stay_min: 60,
          travel_min_from_prev: null,
        },
        {
          order: 1,
          slot_type: "GENERAL",
          place: SEED_PLACES[1],
          arrive_at: "2026-09-12T09:00:00+09:00",
          depart_at: "2026-09-12T10:00:00+09:00",
          stay_min: 60,
          travel_min_from_prev: 8,
        },
        {
          order: 2,
          slot_type: "RESTAURANT",
          place: SEED_PLACES[2],
          arrive_at: "2026-09-12T12:00:00+09:00",
          depart_at: "2026-09-12T13:20:00+09:00",
          stay_min: 80,
          travel_min_from_prev: 6,
        },
        {
          order: 3,
          slot_type: "GENERAL",
          place: SEED_PLACES[3],
          arrive_at: "2026-09-12T15:00:00+09:00",
          depart_at: "2026-09-12T16:00:00+09:00",
          stay_min: 60,
          travel_min_from_prev: 18,
        },
        {
          order: 4,
          slot_type: "SNACK",
          place: SEED_PLACES[4],
          arrive_at: "2026-09-12T18:00:00+09:00",
          depart_at: "2026-09-12T19:30:00+09:00",
          stay_min: 90,
          travel_min_from_prev: 35,
        },
      ],
    },
  ],
};
