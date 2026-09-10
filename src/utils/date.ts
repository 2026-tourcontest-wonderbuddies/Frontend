export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 기본 출발일 — 오늘로부터 2주 뒤. */
export function defaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return toDateInputValue(d);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateInputValue(d);
}

export function fmtHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

/** 일자별 활동 시각을 따로 정하지 않은 날에 쓰는 기본값. */
export const DEFAULT_DAY_START_HOUR = 9;
export const DEFAULT_DAY_END_HOUR = 21;

/** 사용자가 직접 손댄 날만 담기는 일자별 활동 시각. day_index는 1부터. */
export interface DayHoursOverride {
  day_index: number;
  start_hour?: number;
  end_hour?: number;
}

export interface DayHours {
  dayIndex: number;
  startHour: number;
  endHour: number;
}

/**
 * nights+1개 일자의 활동 시간대를 계산한다.
 * 1일차 시작과 마지막 날 종료는 여행 전체의 양 끝점(공항 기준)이라 override 대상이 아니고,
 * 나머지는 overrides에 있으면 그 값, 없으면 기본 활동시간을 쓴다.
 * 범위 밖 day_index는 조회되지 않으므로 박 수를 줄였을 때 남은 값은 자동으로 무시된다.
 */
export function resolveDayHours(
  nights: number,
  tripStartHour: number,
  tripEndHour: number,
  overrides: DayHoursOverride[],
): DayHours[] {
  const total = nights + 1;
  if (total === 1) {
    return [{ dayIndex: 1, startHour: tripStartHour, endHour: tripEndHour }];
  }
  return Array.from({ length: total }, (_, i) => {
    const dayIndex = i + 1;
    const o = overrides.find((x) => x.day_index === dayIndex);
    return {
      dayIndex,
      startHour: dayIndex === 1 ? tripStartHour : (o?.start_hour ?? DEFAULT_DAY_START_HOUR),
      endHour: dayIndex === total ? tripEndHour : (o?.end_hour ?? DEFAULT_DAY_END_HOUR),
    };
  });
}
