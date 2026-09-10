import ChipGroup from "../ChipGroup";
import { toOptions } from "../../utils/options";
import { FOOD_PREF_LABELS, type FoodPrefKey } from "../../api/types";
import type { StepProps } from "../../types/builderForm";

const FOOD_PREF_OPTIONS = toOptions(FOOD_PREF_LABELS);

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

      <div className="step-sub" style={{ marginTop: 26 }}>더 하고 싶은 말이 있다면 (선택)</div>
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
