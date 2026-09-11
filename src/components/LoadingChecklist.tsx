import { useEffect, useState } from "react";

const STEPS = ["운영시간 확인", "이동시간 계산", "최적 동선 최적화"];
const STEP_INTERVAL_MS = 550;
const DEFAULT_NOTE = "여행 조건을 분석하고 있습니다";

function fmtElapsed(sec: number): string {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

interface LoadingChecklistProps {
  title?: string;
  /** 소요 시간 안내. 호출마다 실제 소요가 크게 달라 호출부가 정한다. */
  note?: string;
  onCancel?: () => void;
}

export default function LoadingChecklist({
  title = "맞춤 코스 생성 중",
  note = DEFAULT_NOTE,
  onCancel,
}: LoadingChecklistProps) {
  const [doneCount, setDoneCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // 마지막 단계는 완료로 넘기지 않는다. 전부 ✓가 되면 "끝났는데 안 넘어간다"로 읽혀서다.
  // 서버가 진행 상황을 주지 않으므로 이 체크리스트는 어디까지나 연출이고,
  // 실제로 살아 있다는 신호는 아래 경과 시간이 맡는다.
  useEffect(() => {
    if (doneCount >= STEPS.length - 1) return;
    const id = setTimeout(() => setDoneCount((c) => c + 1), STEP_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [doneCount]);

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="state-panel">
      <div className="spinner" />
      <span className="serif">{title}</span>
      <p>
        {note} · 경과 <b className="mono">{fmtElapsed(elapsed)}</b>
      </p>
      <ul className="loading-checklist">
        {STEPS.map((step, i) => (
          <li key={step} className={i < doneCount ? "done" : i === doneCount ? "active" : ""}>
            <span className="tick">{i < doneCount ? "✓" : i === doneCount ? "…" : "○"}</span>
            {step}
          </li>
        ))}
      </ul>
      {onCancel && (
        <button type="button" className="btn-outline" onClick={onCancel}>
          취소
        </button>
      )}
    </div>
  );
}
