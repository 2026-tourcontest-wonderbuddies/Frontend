import type {
  DayOverridePayload,
  FoodPrefKey,
  LodgingType,
  PurposeKey,
  RegionKey,
} from "../api/types";
import { defaultStartDate, type DayHoursOverride } from "../utils/date";

/**
 * 빌더 위저드의 전체 입력 상태. 스텝을 오가도 값이 보존되도록 셸(BuilderPage)이 통째로 들고,
 * 각 스텝에는 { form, patch }만 넘긴다.
 */
export interface BuilderForm {
  // 1 — 일정
  startDate: string;
  nights: number;
  startHour: number; // 1일차 시작 — 제주공항 밖으로 나오는 시각
  endHour: number; // 마지막 날 종료 — 공항에 도착해야 하는 시각
  dayHours: DayHoursOverride[]; // 그 사이 일자별 활동 시각. 손댄 날만 담긴다.
  headcount: string; // <input type="number">의 값이라 string으로 두고 제출 시 Number()

  // 2 — 목적·권역
  region: RegionKey | "";
  purposeMain: PurposeKey | "";
  purposeSub: PurposeKey | "";
  dayOverrides: DayOverridePayload[];

  // 3 — 취향
  foodPrefs: FoodPrefKey[];
  freeTextInput: string;

  // 4 — 숙박 (다일 여행에서만)
  lodgingType: LodgingType | "";
  cooking: string; // "무관" | "필요"
  lodgingFreeText: string;

  // 5 — 숙소 고르기 (다일 여행에서만). 빈 문자열이면 고르지 않고 넘어간 것.
  lodgingContentId: string;
}

export function defaultBuilderForm(): BuilderForm {
  return {
    startDate: defaultStartDate(),
    nights: 3,
    startHour: 9,
    endHour: 18,
    dayHours: [],
    headcount: "2",
    region: "서귀포동부",
    purposeMain: "photo",
    purposeSub: "",
    dayOverrides: [],
    foodPrefs: [],
    freeTextInput: "",
    lodgingType: "상관없음",
    cooking: "무관",
    lodgingFreeText: "",
    lodgingContentId: "",
  };
}

export type PatchForm = (patch: Partial<BuilderForm>) => void;

export interface StepProps {
  form: BuilderForm;
  patch: PatchForm;
}
