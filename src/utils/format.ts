export function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function dateLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 여행 기간. 당일치기는 같은 날짜가 두 번 나오지 않게 한 번만 쓴다. */
export function periodLabel(startIso: string, endIso: string): string {
  const from = dateLabel(startIso);
  const to = dateLabel(endIso);
  return from === to ? from : `${from} – ${to}`;
}

const WEEKDAYS = "일월화수목금토";

function dayDate(tripStartIso: string, dayIndex: number): Date {
  const start = new Date(tripStartIso);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + (dayIndex - 1));
}

export function dayDateLabel(tripStartIso: string, dayIndex: number): string {
  const d = dayDate(tripStartIso, dayIndex);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}`;
}

const SLOT_LABELS: Record<string, string> = {
  GENERAL: "",
  RESTAURANT: "식사",
  CAFE: "카페",
  SNACK: "간식",
};

export function slotLabel(slotType: string): string {
  return SLOT_LABELS[slotType] ?? "";
}

/**
 * 장소 운영시간 원문(hours_raw)을 한 줄 표기로 줄인다.
 * "10:30~21:30 (준비시간 …)" → "10:30–21:30", "상시 개방 / ※ …" → "상시 개방".
 * 계절별로 시간이 갈리는("[3~6월] …") 원문은 어느 시간이 맞는지 알 수 없어 표기하지 않는다.
 */
function hoursLabel(raw: string | null | undefined): string {
  if (!raw || raw.includes("[")) return "";
  const range = raw.match(/(\d{1,2}:\d{2})\s*[~–-]\s*(\d{1,2}:\d{2})/);
  if (range) return `${range[1]}–${range[2]}`;
  return raw.startsWith("상시 개방") ? "상시 개방" : "";
}

/** 타임라인 카드 장소명 아래 한 줄: "고기국수 · 09:00–20:00". 둘 다 없으면 빈 문자열. */
export function placeMetaLine(place: { small_category_name?: string; hours_raw?: string }): string {
  return [place.small_category_name, hoursLabel(place.hours_raw)].filter(Boolean).join(" · ");
}

/** 장소 유형 뱃지 텍스트: 카페만 "카페"로, 나머지 음식점은 그대로 "음식점". */
export function placeTypeLabel(place: { content_type_name?: string; food_role?: string }): string {
  if (place.food_role === "CAFE") return "카페";
  return place.content_type_name ?? "";
}

const DAY_CASE_LABELS: Record<string, string> = {
  A: "입도일",
  B: "중간일차",
  C: "출도일",
  D: "당일치기",
};

export function dayCaseLabel(dayCase: string): string {
  return DAY_CASE_LABELS[dayCase] ?? dayCase;
}

/** "참고가 150,000원~ (실시간 아님)"처럼 끝에 붙는 괄호 설명을 뗀다. */
export function priceHintMain(hint: string): string {
  return hint.replace(/\s*\([^)]*\)\s*$/, "");
}
