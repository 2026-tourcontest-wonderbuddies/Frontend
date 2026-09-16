import type {
  DayOverridePayload,
  FoodCafeBalance,
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
  foodCafeBalance: FoodCafeBalance;
  freeTextInput: string;

  // 4 — 숙박 (다일 여행에서만)
  lodgingType: LodgingType | "";
  cooking: string; // "무관" | "필요"
  lodgingFreeText: string;
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
    foodCafeBalance: "둘다",
    freeTextInput: "",
    lodgingType: "상관없음",
    cooking: "무관",
    lodgingFreeText: "",
  };
}

/**
 * 음식/카페 비중을 물어볼지 판단한다. 엔진과 같은 조건이어야 한다 —
 * engine.py의 purpose_selected = (purpose_main == "food" or purpose_sub == "food").
 * 화면과 전송이 어긋나지 않도록 StepTaste와 buildPayload가 이 하나를 공유한다.
 */
export const isFoodPurpose = (form: BuilderForm) =>
  form.purposeMain === "food" || form.purposeSub === "food";

export type PatchForm = (patch: Partial<BuilderForm>) => void;

export interface StepProps {
  form: BuilderForm;
  patch: PatchForm;
}
