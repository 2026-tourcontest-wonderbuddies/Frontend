import ChipGroup from "../ChipGroup";
import type { LodgingType } from "../../api/types";
import type { StepProps } from "../../types/builderForm";

const LODGING_TYPE_OPTIONS: { value: LodgingType; label: string }[] = [
  { value: "상관없음", label: "상관없음" },
  { value: "호텔", label: "호텔" },
  { value: "리조트·콘도", label: "리조트·콘도" },
  { value: "펜션·민박", label: "펜션·민박" },
  { value: "게스트하우스", label: "게스트하우스" },
];

const COOKING_OPTIONS = [
  { value: "무관", label: "무관" },
  { value: "필요", label: "필요" },
];

export default function StepLodging({ form, patch }: StepProps) {
  return (
    <div className="step">
      <div className="step-sub">다일 여행이라 숙박 조건도 함께 받을게요</div>

      <div className="step-sub" style={{ marginTop: 20 }}>숙소 유형</div>
      <ChipGroup
        options={LODGING_TYPE_OPTIONS}
        value={form.lodgingType}
        onChange={(v) => patch({ lodgingType: v as LodgingType })}
      />

      <div className="step-sub" style={{ marginTop: 22 }}>희망 조건 — 취사 유무</div>
      <ChipGroup options={COOKING_OPTIONS} value={form.cooking} onChange={(cooking) => patch({ cooking })} />

      <div className="field-row" style={{ marginTop: 22 }}>
        <label>숙박 관련 자유 입력 (선택)</label>
        <textarea value={form.lodgingFreeText} onChange={(e) => patch({ lodgingFreeText: e.target.value })} />
      </div>

      <p className="step-sub" style={{ marginTop: 22 }}>
        숙소는 코스를 먼저 만든 뒤에 고르실 수 있어요. 동선의 마지막 장소에서 가까운 순으로
        추천해드리려면 코스가 정해져 있어야 하거든요.
      </p>
    </div>
  );
}
