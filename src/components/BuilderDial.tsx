const R = 88;
const CIRC = 2 * Math.PI * R;

function fmt(h: number): string {
  const hour = ((h % 24) + 24) % 24;
  return `${hour.toString().padStart(2, "0")}:00`;
}

interface BuilderDialProps {
  start: number;
  end: number;
  /** 중앙 시간 범위 아래 보조 문구. */
  caption?: string;
}

export default function BuilderDial({ start, end, caption = "선택한 시간 범위" }: BuilderDialProps) {
  let span = end - start;
  if (span <= 0) span += 24;
  const frac = span / 24;
  const dashArray = `${CIRC * frac} ${CIRC}`;
  const dashOffset = -(CIRC * (start / 24));

  return (
    <div className="b-dial-wrap">
      <div className="b-dial" />
      <div className="b-dial-face" />
      <svg className="arc-svg" viewBox="0 0 200 200">
        <circle className="arc-bg" cx="100" cy="100" r={R} />
        <circle
          className="arc-fg"
          cx="100"
          cy="100"
          r={R}
          style={{ strokeDasharray: dashArray, strokeDashoffset: dashOffset }}
        />
      </svg>
      <div className="b-dial-center">
        <div className="rng mono">
          {fmt(start)}–{end === 24 ? "24:00" : fmt(end)}
        </div>
        <div className="rng-label">{caption}</div>
      </div>
    </div>
  );
}
