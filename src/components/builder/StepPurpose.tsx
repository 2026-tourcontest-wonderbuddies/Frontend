import { useState } from "react";
import ChipGroup from "../ChipGroup";
import DayOverrideSheet from "../DayOverrideSheet";
import { pickOptions, toOptions } from "../../utils/options";
import { BUILDER_REGION_KEYS, PURPOSE_LABELS, REGION_LABELS, type PurposeKey, type RegionKey } from "../../api/types";
import type { StepProps } from "../../types/builderForm";

const PURPOSE_OPTIONS = toOptions(PURPOSE_LABELS);
const REGION_OPTIONS = pickOptions(REGION_LABELS, BUILDER_REGION_KEYS);

export default function StepPurpose({ form, patch }: StepProps) {
  const [showDayOverrides, setShowDayOverrides] = useState(false);
  const totalDays = form.nights + 1;

  return (
    <div className="step">
      <div className="step-sub">희망 권역은 하나만 고를 수 있어요 (선택 안 하면 제주 전역에서 추천)</div>
      <ChipGroup options={REGION_OPTIONS} value={form.region} onChange={(v) => patch({ region: v as RegionKey })} />

      <div className="step-sub" style={{ marginTop: 26 }}>여행 목적 — 주목적은 필수예요</div>
      <ChipGroup
        options={PURPOSE_OPTIONS}
        value={form.purposeMain}
        onChange={(v) => patch({ purposeMain: v as PurposeKey })}
      />

      <div className="step-sub" style={{ marginTop: 18 }}>보조 목적 (선택)</div>
      <ChipGroup
        options={PURPOSE_OPTIONS.filter((o) => o.value !== form.purposeMain)}
        value={form.purposeSub}
        onChange={(v) => patch({ purposeSub: v as PurposeKey })}
      />

      <div className="wizard-subaction">
        <button type="button" className="btn-outline" onClick={() => setShowDayOverrides(true)}>
          일자별 조건 개별 설정
          {form.dayOverrides.length > 0 ? ` (${form.dayOverrides.length}일 맞춤)` : ""}
        </button>
        <p className="step-sub" style={{ marginTop: 10 }}>
          날짜별로 여행 목적·희망 권역·제외 카테고리를 다르게 정할 수 있어요. 설정하지 않으면 위에서 고른
          목적·권역이 모든 날짜에 똑같이 적용돼요.
        </p>
      </div>

      {showDayOverrides && (
        <DayOverrideSheet
          totalDays={totalDays}
          commonPurpose={form.purposeMain}
          commonPurposeSub={form.purposeSub}
          commonRegion={form.region}
          overrides={form.dayOverrides}
          onChange={(dayOverrides) => patch({ dayOverrides })}
          onClose={() => setShowDayOverrides(false)}
        />
      )}
    </div>
  );
}
