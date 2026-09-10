import { useState } from "react";
import Modal from "./Modal";
import ChipGroup from "./ChipGroup";
import CategoryExcludePicker from "./CategoryExcludePicker";
import { pickOptions, toOptions } from "../utils/options";
import { fmtHour, type DayHours } from "../utils/date";
import {
  BUILDER_REGION_KEYS,
  PURPOSE_LABELS,
  REGION_LABELS,
  type DayOverridePayload,
  type PurposeKey,
  type RegionKey,
} from "../api/types";

const PURPOSE_OPTIONS = toOptions(PURPOSE_LABELS);
const REGION_OPTIONS = pickOptions(REGION_LABELS, BUILDER_REGION_KEYS);

interface DayOverrideSheetProps {
  totalDays: number;
  /** 1스텝에서 정한 일자별 활동 시각. 여기서는 요약에 표시만 한다. */
  dayHours: DayHours[];
  commonPurpose: PurposeKey | "";
  commonPurposeSub: PurposeKey | "";
  commonRegion: RegionKey | "";
  overrides: DayOverridePayload[];
  onChange: (overrides: DayOverridePayload[]) => void;
  onClose: () => void;
}

export default function DayOverrideSheet({
  totalDays,
  dayHours,
  commonPurpose,
  commonPurposeSub,
  commonRegion,
  overrides,
  onChange,
  onClose,
}: DayOverrideSheetProps) {
  const [activeDay, setActiveDay] = useState(1);

  const current = overrides.find((o) => o.day_index === activeDay);

  function patchDay(patch: Partial<DayOverridePayload>) {
    const rest = overrides.filter((o) => o.day_index !== activeDay);
    const merged: DayOverridePayload = {
      day_index: activeDay,
      purpose_main: current?.purpose_main,
      purpose_sub: current?.purpose_sub,
      region_preference: current?.region_preference,
      exclude_categories: current?.exclude_categories,
      ...patch,
    };
    onChange([...rest, merged]);
  }

  function resetDay() {
    onChange(overrides.filter((o) => o.day_index !== activeDay));
  }

  function applyCommonToAll() {
    onChange([]);
  }

  const purposeMain = current?.purpose_main ?? commonPurpose;
  const purposeSub = current?.purpose_sub ?? commonPurposeSub;
  const excludeCategories = current?.exclude_categories ?? [];
  const hours = dayHours.find((h) => h.dayIndex === activeDay);

  return (
    <Modal title="일자별 조건 설정" onClose={onClose} wide>
      <div className="nocon-banner">
        ⚠ 백엔드 미연동 — 여기서 설정한 값은 아직 서버로 전송되지 않아요.
      </div>
      <p style={{ marginBottom: 16 }}>
        날짜마다 여행 목적·희망 권역·제외 카테고리를 다르게 설정할 수 있어요. 설정하지 않은 날짜는 공통 조건을
        그대로 씁니다.
      </p>

      <div className="day-tabs">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
          <button
            type="button"
            key={d}
            className={`day-tab${activeDay === d ? " active" : ""}${overrides.some((o) => o.day_index === d) ? " customized" : ""}`}
            onClick={() => setActiveDay(d)}
          >
            {d}일차
          </button>
        ))}
      </div>

      <div className="override-section">
        <div className="override-label">여행 목적 (주목적)</div>
        <ChipGroup
          options={PURPOSE_OPTIONS}
          value={purposeMain}
          onChange={(v) => patchDay({ purpose_main: v as PurposeKey })}
        />
      </div>

      <div className="override-section">
        <div className="override-label">여행 목적 (보조목적)</div>
        <ChipGroup
          options={PURPOSE_OPTIONS.filter((o) => o.value !== purposeMain)}
          value={purposeSub}
          onChange={(v) => patchDay({ purpose_sub: v as PurposeKey })}
        />
      </div>

      <div className="override-section">
        <div className="override-label">희망 권역</div>
        <ChipGroup
          options={REGION_OPTIONS}
          value={current?.region_preference ?? commonRegion}
          onChange={(v) => patchDay({ region_preference: v as RegionKey })}
        />
      </div>

      <div className="override-section">
        <div className="override-label">제외하고 싶은 카테고리 (선택)</div>
        <CategoryExcludePicker
          value={excludeCategories}
          onChange={(next) => patchDay({ exclude_categories: next })}
        />
      </div>

      <div className="override-summary">
        <h4>{activeDay}일차 현재 설정 요약</h4>
        <div className="sum-row">
          <span>여행 시간</span>
          <b className="mono">
            {hours ? `${fmtHour(hours.startHour)} ~ ${fmtHour(hours.endHour)}` : "미설정"}
          </b>
        </div>
        <div className="sum-row">
          <span>여행 목적</span>
          <b className="mono">
            {purposeMain ? PURPOSE_LABELS[purposeMain as PurposeKey] : "미선택"}
            {purposeSub ? ` · ${PURPOSE_LABELS[purposeSub as PurposeKey]}` : ""}
          </b>
        </div>
        <div className="sum-row">
          <span>희망 권역</span>
          <b className="mono">
            {current?.region_preference
              ? REGION_LABELS[current.region_preference]
              : commonRegion
                ? REGION_LABELS[commonRegion]
                : "전역"}
          </b>
        </div>
        <div className="sum-row">
          <span>제외 카테고리</span>
          <b className="mono">{excludeCategories.length ? `${excludeCategories.length}개` : "없음"}</b>
        </div>
      </div>

      <div className="chip-row" style={{ marginLeft: 0, marginTop: 20 }}>
        <button type="button" className="chip" onClick={resetDay}>
          이 날짜만 공통 조건으로 되돌리기
        </button>
        <button type="button" className="chip" onClick={applyCommonToAll}>
          공통 조건을 모든 날짜에 적용
        </button>
      </div>

      <button type="button" className="btn-primary" style={{ width: "100%", marginTop: 20 }} onClick={onClose}>
        설정 완료
      </button>
    </Modal>
  );
}
