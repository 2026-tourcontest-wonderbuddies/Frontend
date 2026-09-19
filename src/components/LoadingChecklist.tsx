import { useEffect, useState } from "react";

const STEPS = ["운영시간 확인", "이동시간 계산", "최적 동선 최적화"];
const STEP_INTERVAL_MS = 550;
// 서버가 진행 상황을 주지 않아서 단계와 마찬가지로 연출용 문구다. 기다리는 동안 화면이 멈춘 느낌을 줄인다.
const TIPS = [
  "가까운 장소끼리 묶어 이동 시간을 줄이고 있어요",
  "식사 시간대에 맞는 음식점을 찾고 있어요",
  "고른 취향에 어울리는 장소를 추리고 있어요",
  "운영시간에 맞춰 방문 순서를 맞추고 있어요",
];
const TIP_INTERVAL_MS = 2600;
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
  const [tip, setTip] = useState(0);

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

  useEffect(() => {
    const id = setInterval(() => setTip((t) => (t + 1) % TIPS.length), TIP_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="state-panel">
      <span className="serif">{title}</span>
      <p>
        {note} · 경과 <b className="mono">{fmtElapsed(elapsed)}</b>
      </p>
      <div className="loading-bar" aria-hidden="true">
        <i />
      </div>
      <ul className="loading-checklist">
        {STEPS.map((step, i) => (
          <li key={step} className={i < doneCount ? "done" : i === doneCount ? "active" : ""}>
            <span className="tick">{i < doneCount ? "✓" : i === doneCount ? "…" : "○"}</span>
            {step}
          </li>
        ))}
      </ul>
      <p className="loading-tip" key={tip}>
        {TIPS[tip]}
      </p>
      {onCancel && (
        <button type="button" className="btn-outline" onClick={onCancel}>
          취소
        </button>
      )}
    </div>
  );
}
