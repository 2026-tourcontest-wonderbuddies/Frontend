import { useMemo } from "react";
import type { StepProps } from "../../types/builderForm";
import { addDays, fmtHour, resolveDayHours, type DayHoursOverride } from "../../utils/date";

const TRIP_LENGTH_CHIPS = [
  { nights: 0, label: "당일치기" },
  { nights: 1, label: "1박2일" },
  { nights: 2, label: "2박3일" },
  { nights: 3, label: "3박4일" },
  { nights: 4, label: "4박5일" },
];

const PRESETS = [
  { s: 10, e: 16, label: "6시간" },
  { s: 9, e: 17, label: "8시간" },
  { s: 9, e: 19, label: "10시간" },
  { s: 7, e: 19, label: "12시간" },
];

/** 다일 여행에서 중간 일자에 한 번에 적용하는 하루 활동 시간대. */
const DAY_PRESETS = [
  { s: 8, e: 20, label: "매일 08–20" },
  { s: 9, e: 21, label: "매일 09–21" },
  { s: 10, e: 22, label: "매일 10–22" },
];

export { TRIP_LENGTH_CHIPS };

interface HourStepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

function HourStepper({ label, value, min, max, onChange }: HourStepperProps) {
  return (
    <div className="time-box">
      <span className="lbl">{label}</span>
      <button
        type="button"
        className="stepper-btn"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        –
      </button>
      <span className="time-val mono">{value === 24 ? "24:00" : fmtHour(value)}</span>
      <button
        type="button"
        className="stepper-btn"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );
}

export default function StepSchedule({ form, patch }: StepProps) {
  const endDate = useMemo(() => addDays(form.startDate, form.nights), [form.startDate, form.nights]);
  const isMultiDay = form.nights > 0;
  const dayHours = useMemo(
    () => resolveDayHours(form.nights, form.startHour, form.endHour, form.dayHours),
    [form.nights, form.startHour, form.endHour, form.dayHours],
  );

  function patchDayHours(dayIndex: number, p: Partial<DayHoursOverride>) {
    const rest = form.dayHours.filter((o) => o.day_index !== dayIndex);
    const current = form.dayHours.find((o) => o.day_index === dayIndex);
    patch({ dayHours: [...rest, { ...current, day_index: dayIndex, ...p }] });
  }

  /** 양 끝점(1일차 시작·마지막 날 종료)은 그대로 두고 나머지 시각만 한 번에 맞춘다. */
  function applyDayPreset(s: number, e: number) {
    patch({
      dayHours: Array.from({ length: form.nights + 1 }, (_, i) => ({
        day_index: i + 1,
        start_hour: s,
        end_hour: e,
      })),
    });
  }

  return (
    <div className="step">
      <div className="step-sub">출발일과 며칠 여행인지를 정하면 종료일이 자동으로 계산돼요.</div>
      <div className="date-inputs">
        <div className="date-box">
          <span className="lbl">출발일</span>
          <input type="date" value={form.startDate} onChange={(e) => patch({ startDate: e.target.value })} />
        </div>
        <span className="time-arrow">→</span>
        <div className="date-box">
          <span className="lbl">도착(종료)일</span>
          <input type="date" value={endDate} disabled />
        </div>
      </div>
      <div className="chip-row" style={{ marginTop: 14 }}>
        {TRIP_LENGTH_CHIPS.map((c) => (
          <button
            type="button"
            key={c.label}
            className={`chip${form.nights === c.nights ? " active" : ""}`}
            onClick={() => patch({ nights: c.nights })}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="step-sub" style={{ marginTop: 24 }}>
        {isMultiDay ? "일자별 활동 시각" : "총 여행 활동 시각"} — ※ 제주공항 기준입니다.
        <br />
        시작 — 수하물 수령 후 공항 밖으로 나오는 시각
        <br />
        종료 — 돌아가는 날 공항에 도착해야 하는 시각 (예: 15시 비행이면 13시)
      </div>

      {isMultiDay ? (
        <>
          <div className="day-hours-list">
            {dayHours.map((d) => {
              const isFirst = d.dayIndex === 1;
              const isLast = d.dayIndex === dayHours.length;
              return (
                <div className="day-hours-row" key={d.dayIndex}>
                  <span className="day-hours-label">{d.dayIndex}일차</span>
                  <HourStepper
                    label="시작"
                    value={d.startHour}
                    min={0}
                    max={Math.min(23, d.endHour - 1)}
                    onChange={(v) =>
                      isFirst ? patch({ startHour: v }) : patchDayHours(d.dayIndex, { start_hour: v })
                    }
                  />
                  <span className="time-arrow">→</span>
                  <HourStepper
                    label="종료"
                    value={d.endHour}
                    min={Math.max(1, d.startHour + 1)}
                    max={24}
                    onChange={(v) => (isLast ? patch({ endHour: v }) : patchDayHours(d.dayIndex, { end_hour: v }))}
                  />
                  {isFirst && <span className="day-hours-hint">공항에서 나오는 시각</span>}
                  {isLast && <span className="day-hours-hint">공항에 도착할 시각</span>}
                </div>
              );
            })}
          </div>
          <div className="presets">
            {DAY_PRESETS.map((p) => (
              <button type="button" className="preset" key={p.label} onClick={() => applyDayPreset(p.s, p.e)}>
                {p.label}
              </button>
            ))}
            <button type="button" className="preset" onClick={() => patch({ dayHours: [] })}>
              기본값으로 되돌리기
            </button>
          </div>
          {/*
            [백엔드 연결 이전] 1일차 시작·마지막 날 종료만 start_datetime/end_datetime으로 전송된다.
            그 사이 일자별 시각은 명세 1번 request에 day_overrides 필드가 없어 아직 보내지 못한다.
            필드가 추가되면 BuilderPage.tsx의 buildPayload()에서 함께 보내면 된다.
          */}
          <p className="nocon-note day-hours-note">
            ⚠ 백엔드 미연동 — 1일차 시작과 마지막 날 종료만 서버로 전송돼요. 그 사이 일자별 시각은 명세 1번에{" "}
            <code>day_overrides</code> 필드가 추가되면 함께 보냅니다.
          </p>
        </>
      ) : (
        <>
          <div className="time-inputs">
            <HourStepper
              label="시작"
              value={form.startHour}
              min={0}
              max={Math.min(23, form.endHour - 1)}
              onChange={(v) => patch({ startHour: v })}
            />
            <span className="time-arrow">→</span>
            <HourStepper
              label="종료"
              value={form.endHour}
              min={Math.max(1, form.startHour + 1)}
              max={24}
              onChange={(v) => patch({ endHour: v })}
            />
          </div>
          <div className="presets">
            {PRESETS.map((p) => (
              <button
                type="button"
                className="preset"
                key={p.label}
                onClick={() => patch({ startHour: p.s, endHour: p.e })}
              >
                {p.label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="step-sub" style={{ marginTop: 24 }}>몇 분이서 가세요?</div>
      <div className="field-row">
        <label>인원 수</label>
        <input
          type="number"
          min={1}
          value={form.headcount}
          onChange={(e) => patch({ headcount: e.target.value })}
        />
      </div>
    </div>
  );
}
