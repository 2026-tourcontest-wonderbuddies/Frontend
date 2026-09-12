// Mirrors API_CONTRACT.md at the repo root. Keep in sync with that document.

export type PurposeKey =
  | "nature"
  | "food"
  | "photo"
  | "culture"
  | "activity"
  | "shopping";

export const PURPOSE_LABELS: Record<PurposeKey, string> = {
  nature: "힐링/자연",
  food: "식당/카페",
  photo: "사진/감성",
  culture: "문화/역사",
  activity: "체험/액티비티",
  shopping: "쇼핑/시장",
};

export type RegionKey =
  | "제주시동부"
  | "제주시서부"
  | "제주시내"
  | "서귀포동부"
  | "서귀포서부"
  | "전역";

export const REGION_LABELS: Record<RegionKey, string> = {
  제주시동부: "제주시 동부 (조천·구좌)",
  제주시서부: "제주시 서부 (한림·애월)",
  제주시내: "제주 시내 (원도심)",
  서귀포동부: "서귀포 동부 (성산·표선)",
  서귀포서부: "서귀포 서부 (안덕·대정)",
  전역: "제주 전역 무관",
};

// 빌더 입력에서 고를 수 있는 권역 5개. RegionKey 자체는 장소 검색 필터가 계속 쓰므로
// 좁히지 않고, 입력 화면에서만 이 부분집합을 노출한다.
export const BUILDER_REGION_KEYS: RegionKey[] = [
  "제주시동부",
  "제주시서부",
  "서귀포동부",
  "서귀포서부",
  "전역",
];

// 코스 우선순위는 더 이상 입력받지 않는다. 코스 매칭 후 세 가지 모드를 모두 제시하므로
// 응답 쪽(TripCandidateDTO.mode)에서만 쓰인다.
export type CoursePriority = "dist" | "pref" | "relax";

export const PRIORITY_LABELS: Record<CoursePriority, string> = {
  dist: "이동 최소 코스",
  pref: "취향 중심 코스",
  relax: "여유로운 코스",
};

export type FoodPrefKey =
  | "제주향토음식"
  | "고기구이"
  | "해산물요리"
  | "회물회초밥"
  | "한식"
  | "면요리"
  | "분식간편식"
  | "일식"
  | "중식"
  | "양식세계음식";

export const FOOD_PREF_LABELS: Record<FoodPrefKey, string> = {
  제주향토음식: "제주 향토음식",
  고기구이: "고기·구이",
  해산물요리: "해산물 요리",
  회물회초밥: "회·물회·초밥",
  한식: "한식",
  면요리: "면 요리",
  분식간편식: "분식·간편식",
  일식: "일식",
  중식: "중식",
  양식세계음식: "양식·세계음식",
};

export type LodgingType = "호텔" | "리조트·콘도" | "펜션·민박" | "게스트하우스" | "상관없음";

export interface TripRequestPayload {
  // 제주공항 기준. start=수하물 수령 후 공항 밖으로 나오는 시각,
  // end=돌아가는 날 공항에 도착해야 하는 시각. 출발지/도착지는 입력받지 않는다.
  start_datetime: string;
  end_datetime: string;

  headcount: number;
  purpose_main: PurposeKey;
  purpose_sub?: PurposeKey;
  region_preference?: RegionKey;
  day_overrides?: DayOverridePayload[];

  free_text_input?: string;

  food_pref_1?: FoodPrefKey;

  lodging_type?: LodgingType;
  lodging_conditions?: string[];
  lodging_free_text?: string;
}

export type Quadrant = "NE" | "NW" | "SE" | "SW";

export interface PlaceDTO {
  content_id: string;
  title: string;
  address: string;
  longitude: number;
  latitude: number;
  overview?: string;
  content_type_name: string;
  small_category_name?: string;
  quadrant: Quadrant;
  satisfaction_score?: number | null;
}

export type SlotType = "GENERAL" | "RESTAURANT" | "CAFE" | "SNACK";

export interface ItineraryItemDTO {
  order: number;
  slot_type: SlotType;
  place: PlaceDTO;
  arrive_at: string;
  depart_at: string;
  stay_min: number;
  travel_min_from_prev?: number | null;
  hours_uncertain?: boolean;
  pref_score?: number | null;
  adjusted_qual?: number | null;
  locked?: boolean;
}

export type DayCase = "A" | "B" | "C" | "D";

export interface ItineraryDayDTO {
  day_index: number;
  day_case: DayCase;
  avail_hours: number;
  target_slots: number;
  need_lunch: boolean;
  need_dinner: boolean;
  need_night_spot: boolean;
  lodging?: LodgingDTO | null; // 여행 전체에 하나를 골라 마지막 날을 뺀 모든 날에 동일 적용
  items: ItineraryItemDTO[];
}

export interface TripResponse {
  id: string;
  created_at: string;
  request: TripRequestPayload;
  total_days: number;
  days: ItineraryDayDTO[];
}

export interface FieldErrors {
  field_errors?: Record<string, string[]>;
}

// ── Auth (Google 로그인은 명세 11번 POST /api/auth/google/ 로 연동됨) ──────────

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
}

// ── Day overrides (multi-day trips) ────────────────────────────────────────

export interface DayOverridePayload {
  day_index: number;
  purpose_main?: PurposeKey;
  purpose_sub?: PurposeKey;
  region_preference?: RegionKey;
  exclude_categories?: string[]; // TourAPI 중분류 이름 배열
  start_hour?: number; // 0~23. 그 날 활동 시작 시각. 1일차는 start_datetime과 중복이라 생략
  end_hour?: number; // 1~24. 그 날 활동 종료 시각. 마지막 날은 end_datetime과 중복이라 생략
}

// ── Course candidates (recommendation list before a trip is persisted) ────

export interface CandidateScores {
  move_eff: number; // 1~5
  pref_fit: number; // 1~5
  slack: number; // 1~5
}

export interface TripCandidateDTO {
  id: string;
  mode: CoursePriority;
  label: string;
  visit_count: number;
  total_duration_min: number;
  total_distance_km: number;
  slack_min: number;
  scores: CandidateScores;
  description: string;
  badges: string[];
  days: ItineraryDayDTO[];
}

/** 후보를 확정할 때 함께 보내는 body. 숙소는 확정 *전*에 고른다. */
export interface SelectCandidatePayload {
  lodging_content_id?: string;
}

export interface CandidatesResponse {
  request_id: string;
  candidates: TripCandidateDTO[];
}

// ── Lodging ─────────────────────────────────────────────────────────────

export interface LodgingDTO {
  content_id: string;
  title: string;
  address: string;
  longitude: number;
  latitude: number;
  small_category_name: LodgingType;
  parking: boolean;
  cooking: boolean;
  facilities: string[];
  price_per_night?: number | null;
  check_in_time?: string;
  check_out_time?: string;
}

export interface LodgingRecommendationDTO {
  lodging: LodgingDTO;
  travel_min_from_last_stop: number;
  match_reason: string;
  missing_fields: string[];
  booking_url?: string;
}

export interface LodgingRecommendationsResponse {
  candidate_id: string;
  recommendations: LodgingRecommendationDTO[];
}

// ── Course editing ──────────────────────────────────────────────────────

export type EditOpType = "reorder" | "swap" | "remove" | "add" | "lock" | "stay_time";

export interface EditRequestPayload {
  trip: TripResponse; // current client-side draft snapshot — the edit endpoint is a pure
                       // function over this, it does not touch server-persisted state.
  day_index: number;
  op: EditOpType;
  item_order?: number; // target item's current order (reorder/remove/lock/stay_time/swap-from)
  direction?: "up" | "down"; // reorder
  stay_min?: number; // stay_time
}

export interface ConstraintViolationDTO {
  type: "hours_exceeded" | "schedule_overrun" | "travel_time_insufficient";
  place_title?: string;
  detail: string;
}

export interface EditResponse {
  trip: TripResponse;
  violations: ConstraintViolationDTO[];
}

// ── Chatbot ─────────────────────────────────────────────────────────────

export type QuickFixCode =
  | "lock_place"
  | "swap_place"
  | "add_place"
  | "exclude_category"
  | "indoor_focus"
  | "outdoor_focus"
  | "walk_light"
  | "add_slack";

export interface StructuredIntentDTO {
  type: QuickFixCode | "unrecognized";
  summary: string;
}

export interface ChatMessageDTO {
  id: string;
  role: "user" | "assistant";
  text: string;
  created_at: string;
  structured_intent?: StructuredIntentDTO;
}

export interface ChatRequestPayload {
  day_index: number;
  message?: string;
  quick_fix?: QuickFixCode;
}

export interface ChatResponse {
  messages: ChatMessageDTO[];
  trip: TripResponse | null;
  violations: ConstraintViolationDTO[];
}

// ── Save / manage ───────────────────────────────────────────────────────

export interface SavedPlaceDTO {
  id: string;
  place: PlaceDTO;
  saved_at: string;
}

export interface SavedCourseDTO {
  id: string;
  title: string;
  trip: TripResponse;
  saved_at: string;
}

// ── Place search ────────────────────────────────────────────────────────

export interface PlaceSearchParams {
  q?: string;
  category?: string;
  region?: RegionKey;
}

// ══════════════════════════════════════════════════════════════════════════
// Notion API 명세서 (04. 개발 / API 명세서) 기준 타입.
// [백엔드 연결 이전] 위쪽 타입들은 아직 백엔드가 없는 기능(저장/검색/채팅/수동편집)이 계속 쓰므로 남겨둔다.
// 새로 연동하는 화면은 이 아래 타입만 쓴다.
// ══════════════════════════════════════════════════════════════════════════

/** 백엔드 TripRequest.REGION_CHOICES */
export type RegionCode = Quadrant | "ALL";

/** 빌더 UI의 한글 권역(5분할) → 백엔드 4사분면 코드 */
export const REGION_CODE_BY_KEY: Record<RegionKey, RegionCode> = {
  제주시동부: "NE",
  제주시서부: "NW",
  제주시내: "NW",
  서귀포동부: "SE",
  서귀포서부: "SW",
  전역: "ALL",
};

/** 명세 1번 · POST /api/trips/ request body */
export interface TripCreateRequest {
  start_datetime: string; // "2026-09-10T14:00:00+09:00"
  end_datetime: string;
  guests: number;
  purpose_main: PurposeKey;
  purpose_sub?: PurposeKey;
  region_preference?: RegionCode;
  free_text_input?: string;
  food_pref_1?: string;
  food_pref_2?: string;
  // [백엔드 연결 이전] 명세엔 있지만 프론트에 아직 입력 UI가 없어 항상 undefined로 보낸다.
  food_cafe_balance?: string;
  lodging_type?: string;
  lodging_need_cooking?: boolean;
  lodging_free_text?: string;
}

/** 명세 1번 · 응답. 코스 본문이 아니라 3개 코스의 id만 온다. */
export interface TripCreateResponse {
  trip_id: number;
  course_ids: Record<CoursePriority, number>;
}

/** 명세 2번 · GET /api/trips/{trip_id}/courses/ */
export interface CourseSummary {
  id: number;
  mode: CoursePriority;
  is_selected: boolean;
  // 명세서 예시엔 숫자만 있지만 서버가 null을 주는 코스가 실제로 있다(trip 20). 미표시로 처리한다.
  final_score: number | null;
  created_at: string;
}

export interface TripCoursesResponse {
  trip_id: number;
  courses: CourseSummary[];
}

/**
 * 명세 4번 · 코스 상세 안의 place.
 * 장소 검색(SearchPlace)과 동일한 필드 + 권장 체류시간(stay_time_minutes).
 */
export interface PlaceSummary extends SearchPlace {
  stay_time_minutes: number;
}

export interface CourseItem {
  id: number;
  order: number;
  place: PlaceSummary;
  slot_type: SlotType;
  arrive_at: string;
  depart_at: string;
  travel_min_from_prev: number | null;
  locked: boolean;
  hours_uncertain: boolean;
}

/** 숙소 카드의 조건 충족 표시 한 줄 */
export interface LodgingCheck {
  name: string;
  detail: string;
  status: "yes" | "no" | "unknown";
}

/**
 * 명세 4·6번 · 숙소 스냅샷 카드.
 * 요금은 숫자가 아니라 문자열 힌트(price_hint)이고, 실시간 가격이 아니다.
 */
export interface LodgingCard {
  content_id: string;
  title: string;
  address: string;
  region: string;
  category: string;
  lat: number;
  lon: number;
  grade: number | null;
  room_type: string;
  room_count: number | null;
  max_guests: number | null;
  price_hint: string;
  check_in_time: string;
  check_out_time: string;
  checks: LodgingCheck[];
  needs_check: boolean;
  unknown_fields: string[];
  query_fit: string | null;
  travel_min: number | null;
  travel_min_total: number | null;
  travel_min_by_night: number[];
  tripcom_link: string;
  tripcom_link_type: string;
  tripcom_tracked: boolean;
  tripcom_zone_id: string;
}

export interface CourseDay {
  id: number;
  day_index: number;
  day_case: DayCase;
  avail_hours: number;
  target_slots: number;
  need_lunch: boolean;
  need_dinner: boolean;
  need_night_spot: boolean;
  // 백엔드가 코스 상세에서 두 필드를 빼고 내려준다(숙소는 명세 6번 별도 엔드포인트).
  lodging_snapshot?: LodgingCard | null;
  lodging_options_snapshot?: LodgingCard[];
  items: CourseItem[];
}

/** 명세 4번 · GET /api/courses/{course_id}/ */
export interface CourseDetail {
  id: number;
  mode: CoursePriority;
  is_selected: boolean;
  final_score: number | null;
  created_at: string;
  days: CourseDay[];
}

/** 명세 5번 · GET /api/courses/{course_id}/places/ */
export interface CoursePlacesResponse {
  course_id: number;
  places: PlaceSummary[];
}

/**
 * 명세 6번 · 추천 숙소 목록.
 * 숙소가 없는 코스는 current_selected 키 자체가 빠져서 온다.
 */
export interface LodgingOptionsResponse {
  current_selected?: LodgingCard | null;
  lodging_options: LodgingCard[];
}

/** 명세 3번 · POST /api/courses/{course_id}/select/ */
export interface SelectCourseResponse {
  course_id: number;
  is_selected: boolean;
}

/** 명세 7번 · POST /api/courses/{course_id}/select-lodging/ */
export interface SelectLodgingResponse {
  course_id: number;
  selected_content_id: string;
  days_updated: number;
}

/** 명세 8번 · POST /api/courses/{course_id}/modify/ */
export interface ModifyCourseResponse {
  log_id: number;
  parsed_delta: unknown;
  message: string;
}

// ══════════════════════════════════════════════════════════════════════════
// 장소 검색 (daeun 전용 신규 기능, 명세서에는 없음). GET /api/places/search/
// ══════════════════════════════════════════════════════════════════════════

/** GET /api/places/search/ 응답 한 건 */
export interface SearchPlace {
  content_id: string;
  title: string;
  content_type_name: string;
  small_category_name: string;
  address: string;
  latitude: number;
  longitude: number;
  overview: string;
  contact: string;
  hours_raw: string;
  closed_days_raw: string;
  fees: string;
  parking: string;
  menu: string;
  featured_menu: string;
}

export interface PlaceSearchResponse {
  results: SearchPlace[];
  total: number;
  has_more: boolean;
}

export interface PlaceSearchQuery {
  q?: string;
  category?: string;
  region?: RegionCode;
  page?: number;
  page_size?: number;
}

// ══════════════════════════════════════════════════════════════════════════
// 시간대별 장소 (홈 JEJU BY TIME OF DAY). GET /api/places/by-period/
// ══════════════════════════════════════════════════════════════════════════

/**
 * 근거가 두 갈래다.
 *  arrival — AI Hub 실측 도착시각의 시간대 쏠림 (아침/낮/노을/밤)
 *  hours   — 영업·개방 시간 (새벽. 도착시각 표본이 전체의 0.8%뿐이라 랭킹이 안 선다)
 */
export type PeriodEvidence = "arrival" | "hours";

export interface PeriodPlace extends SearchPlace {
  stay_time_minutes: number;
  evidence: PeriodEvidence;
  // evidence === "arrival"
  n?: number;
  total?: number;
  share?: number;
  lift?: number;
  score?: number;
  // evidence === "hours"
  open?: string;
  close?: string;
  obs?: number;
}

export interface PeriodPlacesResponse {
  period: string;
  results: PeriodPlace[];
}

// ══════════════════════════════════════════════════════════════════════════
// 장소 상세. GET /api/places/{content_id}/
// ══════════════════════════════════════════════════════════════════════════

/**
 * 목록(SearchPlace)과 겹치지만 menu/featured_menu가 없고,
 * overview_summary·restroom·대/중분류·stay_time_minutes가 더 온다.
 */
export interface PlaceDetail {
  content_id: string;
  title: string;
  address: string;
  content_type_name: string;
  large_category_name: string;
  middle_category_name: string;
  small_category_name: string;
  overview: string;
  /** 서버가 만든 요약문. 클라이언트 summarizeOverview()보다 우선한다. */
  overview_summary: string;
  hours_raw: string;
  closed_days_raw: string;
  fees: string;
  parking: string;
  contact: string;
  restroom: string;
  stay_time_minutes: number;
  latitude: number;
  longitude: number;
}
