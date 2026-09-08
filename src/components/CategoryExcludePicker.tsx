import { useState } from "react";
import { TOUR_CATEGORIES } from "../constants/tourCategories";

interface CategoryExcludePickerProps {
  /** 선택된 중분류 이름 배열. 대분류는 여기서 파생되는 상태라 따로 저장하지 않는다. */
  value: string[];
  onChange: (value: string[]) => void;
  /** 중분류별 장소 건수. 백엔드가 집계를 내려주면 라벨 옆에 "(33건)"으로 붙는다. */
  counts?: Record<string, number>;
}

export default function CategoryExcludePicker({ value, onChange, counts }: CategoryExcludePickerProps) {
  const [expanded, setExpanded] = useState<string[]>([]);

  function toggleExpand(major: string) {
    setExpanded((prev) => (prev.includes(major) ? prev.filter((m) => m !== major) : [...prev, major]));
  }

  function toggleMinor(minor: string) {
    onChange(value.includes(minor) ? value.filter((v) => v !== minor) : [...value, minor]);
  }

  function toggleMajor(minors: string[], allSelected: boolean) {
    onChange(allSelected ? value.filter((v) => !minors.includes(v)) : [...new Set([...value, ...minors])]);
  }

  return (
    <div className="cat-picker">
      {TOUR_CATEGORIES.map(({ major, minors }) => {
        const selectedCount = minors.filter((m) => value.includes(m)).length;
        const allSelected = selectedCount === minors.length;
        const partial = selectedCount > 0 && !allSelected;
        const isOpen = expanded.includes(major);

        return (
          <div className="cat-group" key={major}>
            <div className="cat-major-row">
              <label className="cat-check">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = partial;
                  }}
                  onChange={() => toggleMajor(minors, allSelected)}
                />
                <span className="cat-major-name">{major}</span>
                {selectedCount > 0 && <span className="cat-count mono">{selectedCount}/{minors.length}</span>}
              </label>
              <button
                type="button"
                className={`cat-caret${isOpen ? " open" : ""}`}
                aria-expanded={isOpen}
                aria-label={`${major} 중분류 ${isOpen ? "접기" : "펼치기"}`}
                onClick={() => toggleExpand(major)}
              >
                ▼
              </button>
            </div>

            {isOpen && (
              <div className="cat-minor-list">
                {minors.map((minor) => (
                  <label className="cat-check cat-minor" key={minor}>
                    <input type="checkbox" checked={value.includes(minor)} onChange={() => toggleMinor(minor)} />
                    <span>{minor}</span>
                    {counts?.[minor] !== undefined && <span className="cat-count mono">({counts[minor]}건)</span>}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
