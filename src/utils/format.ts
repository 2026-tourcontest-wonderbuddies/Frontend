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

const DAY_CASE_LABELS: Record<string, string> = {
  A: "입도일",
  B: "중간일차",
  C: "출도일",
  D: "당일치기",
};

export function dayCaseLabel(dayCase: string): string {
  return DAY_CASE_LABELS[dayCase] ?? dayCase;
}
