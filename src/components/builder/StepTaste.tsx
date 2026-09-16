import ChipGroup from "../ChipGroup";
import { toOptions } from "../../utils/options";
import {
  FOOD_CAFE_BALANCE_LABELS,
  FOOD_PREF_LABELS,
  type FoodCafeBalance,
  type FoodPrefKey,
} from "../../api/types";
import { isFoodPurpose, type StepProps } from "../../types/builderForm";

const FOOD_PREF_OPTIONS = toOptions(FOOD_PREF_LABELS);
const FOOD_CAFE_BALANCE_OPTIONS = toOptions(FOOD_CAFE_BALANCE_LABELS);

export default function StepTaste({ form, patch }: StepProps) {
  return (
    <div className="step">
      <div className="step-sub">선호하는 음식이 있나요? (선택, 최대 2개)</div>
      <ChipGroup
        multi
        max={2}
        options={FOOD_PREF_OPTIONS}
        value={form.foodPrefs}
        onChange={(v) => patch({ foodPrefs: v as FoodPrefKey[] })}
      />

      {/* 목적에 음식/카페가 있을 때만 묻는다. 아니면 엔진이 이 값을 읽지 않는다. */}
      {isFoodPurpose(form) && (
        <>
          <div className="step-sub section-sep">음식점과 카페, 어느 쪽에 무게를 둘까요?</div>
          <ChipGroup
            options={FOOD_CAFE_BALANCE_OPTIONS}
            value={form.foodCafeBalance}
            onChange={(v) => patch({ foodCafeBalance: v as FoodCafeBalance })}
          />
        </>
      )}

      <div className="step-sub section-sep">더 하고 싶은 말이 있다면 (선택)</div>
      <div className="field-row">
        <textarea
          placeholder="예: 아이랑 같이라 계단 많은 곳은 피하고 싶어요"
          value={form.freeTextInput}
          onChange={(e) => patch({ freeTextInput: e.target.value })}
        />
      </div>
    </div>
  );
}
