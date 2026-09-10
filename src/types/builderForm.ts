import type {
  DayOverridePayload,
  FoodPrefKey,
  LodgingType,
  PurposeKey,
  RegionKey,
} from "../api/types";
import { defaultStartDate } from "../utils/date";

/**
 * 빌더 위저드의 전체 입력 상태. 스텝을 오가도 값이 보존되도록 셸(BuilderPage)이 통째로 들고,
 * 각 스텝에는 { form, patch }만 넘긴다.
 */
export interface BuilderForm {
  // 1 — 일정
  startDate: string;
  nights: number;
  startHour: number;
  endHour: number;
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
