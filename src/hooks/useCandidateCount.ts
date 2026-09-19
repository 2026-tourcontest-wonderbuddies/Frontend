import { useQueries } from "@tanstack/react-query";
import { searchPlaces } from "../api/places";
import { REGION_CODE_BY_KEY, type PurposeKey } from "../api/types";
import { resolveDayHours } from "../utils/date";
import type { BuilderForm } from "../types/builderForm";

// 여행 목적 → 장소 검색 API의 유형. 식사는 목적과 무관하게 필요해서 음식점은 항상 넣는다.
// 근사치다: 백엔드에 "조건에 맞는 후보 수" API가 없어 장소 검색 total 로 센다(제외 카테고리·음식 취향은 미반영).
const CATEGORY_BY_PURPOSE: Record<PurposeKey, string> = {
  nature: "관광지",
  photo: "관광지",
  activity: "관광지",
  culture: "문화시설",
  food: "음식점",
  shopping: "쇼핑",
};

// 백엔드 recommendation/constraints.py calc_target_slots 와 같은 값(모드는 pref 기준).
const BASELINE_SLOTS = 7;
const FULL_DAY_HOURS = 12;
const PREF_MULTIPLIER = 0.9;
const DAY_END_ANCHOR_HOUR = 21;

/** 파이썬 round()처럼 .5 는 짝수 쪽으로(Math.round 는 항상 올림이라 결과가 달라진다). */
function roundHalfEven(x: number): number {
  const f = Math.floor(x);
  const diff = x - f;
  if (diff < 0.5) return f;
  if (diff > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
}

/** 일자별 목표 슬롯을 합친 값. 출도일(마지막 날·당일치기)은 야간 슬롯을 더하지 않는다. */
export function estimateSlots(form: BuilderForm): number {
  const days = resolveDayHours(form.nights, form.startHour, form.endHour, form.dayHours);
  return days.reduce((sum, d) => {
    const avail = Math.max(0, d.endHour - d.startHour);
    let slots = roundHalfEven(BASELINE_SLOTS * (avail / FULL_DAY_HOURS) * PREF_MULTIPLIER);
    if (avail >= 3 && slots < 2) slots = 2;
    const isDeparture = d.dayIndex === days.length;
    if (!isDeparture && d.endHour > DAY_END_ANCHOR_HOUR) slots += 1;
    return sum + slots;
  }, 0);
}

export function useCandidateCount(form: BuilderForm) {
  const region = REGION_CODE_BY_KEY[form.region || "전역"];
  const categories = [
    ...new Set(
      ["음식점", ...[form.purposeMain, form.purposeSub].filter(Boolean).map((p) => CATEGORY_BY_PURPOSE[p as PurposeKey])],
    ),
  ];

  const results = useQueries({
    queries: categories.map((category) => ({
      queryKey: ["candidate-count", region, category],
      queryFn: () => searchPlaces({ category, region, page: 1, page_size: 1 }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  return {
    candidates: results.every((r) => r.data) ? results.reduce((n, r) => n + (r.data?.total ?? 0), 0) : null,
    slots: estimateSlots(form),
  };
}
