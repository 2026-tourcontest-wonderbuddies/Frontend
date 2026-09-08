import { useMemo } from "react";
import type { StepProps } from "../../types/builderForm";
import { addDays, fmtHour } from "../../utils/date";

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

export { TRIP_LENGTH_CHIPS };

export default function StepSchedule({ form, patch }: StepProps) {
  const endDate = useMemo(() => addDays(form.startDate, form.nights), [form.startDate, form.nights]);

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
        총 여행 활동 시각 — ※ 제주공항 기준입니다.
        <br />
        시작 — 수하물 수령 후 공항 밖으로 나오는 시각
        <br />
        종료 — 돌아가는 날 공항에 도착해야 하는 시각 (예: 15시 비행이면 13시)
      </div>
      <div className="time-inputs">
        <div className="time-box">
          <span className="lbl">시작</span>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => patch({ startHour: Math.max(0, form.startHour - 1) })}
          >
            –
          </button>
          <span className="time-val mono">{fmtHour(form.startHour)}</span>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => patch({ startHour: Math.min(23, form.startHour + 1) })}
          >
            +
          </button>
        </div>
        <span className="time-arrow">→</span>
        <div className="time-box">
          <span className="lbl">종료</span>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => patch({ endHour: Math.max(1, form.endHour - 1) })}
          >
            –
          </button>
          <span className="time-val mono">{form.endHour === 24 ? "24:00" : fmtHour(form.endHour)}</span>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => patch({ endHour: Math.min(24, form.endHour + 1) })}
          >
            +
          </button>
        </div>
      </div>
      <div className="presets">
        {PRESETS.map((p) => (
          <button type="button" className="preset" key={p.label} onClick={() => patch({ startHour: p.s, endHour: p.e })}>
            {p.label}
          </button>
        ))}
      </div>

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
