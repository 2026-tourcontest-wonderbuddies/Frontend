import { useNow } from "../hooks/useNow";

/** 링 두께 안쪽에 맞춘 반지름(다이얼 폭의 %). 링은 50%(바깥)~41%(dial-face inset 9%) 사이다. */
const RADIUS = 45.5;

/** 자정을 12시 방향에 두고 시계방향으로 배치. px가 아니라 %라 다이얼 크기를 따라간다.
 *  링 그라데이션도 같은 기준이라 .dial의 conic은 0deg에서 시작한다. */
function pos(hour: number) {
  const a = (hour / 24) * 2 * Math.PI;
  return { left: `${50 + RADIUS * Math.sin(a)}%`, top: `${50 - RADIUS * Math.cos(a)}%` };
}

const STOPS = [
  { label: "06:00 성산일출봉 일출", hour: 6 },
  { label: "09:00 섭지코지", hour: 9 },
  { label: "12:00 광치기 해변", hour: 12 },
  { label: "15:00 표선해수욕장", hour: 15 },
  { label: "18:00 서귀포 매일 올레시장", hour: 18 },
];

/** 마커가 선 시각은 라벨이 이미 시간을 말해주므로 눈금을 빼고 나머지만 남긴다. */
const TICKS = [0, 3, 6, 9, 12, 15, 18, 21].filter((h) => !STOPS.some((s) => s.hour === h));

export default function TimeDial() {
  const now = useNow();
  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");

  return (
    <div>
      <div className="dial-wrap">
        <div className="dial" />
        <div className="dial-face" />
        <div className="dial-layer">
          {TICKS.map((hour) => (
            <div key={hour} className="tick" style={pos(hour)}>
              {hour.toString().padStart(2, "0")}
            </div>
          ))}
          {STOPS.map((s) => (
            <div key={s.label} className="stop" style={pos(s.hour)}>
              <div className="stop-label">{s.label}</div>
            </div>
          ))}
          <div className="dial-center">
            <div className="now-time mono">
              {hh}:{mm}
            </div>
            <div className="now-label">지금 이 시각</div>
          </div>
        </div>
      </div>
      <div className="dial-caption">
        성산·표선 당일 코스 예시 — <b>일출부터 노을까지</b>, 시간에 따라 걷는 방향이 바뀝니다.
      </div>
    </div>
  );
}
