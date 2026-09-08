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

// ── Auth (mock — backend has no auth app yet) ──────────────────────────────

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
