import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TimeDial from "../components/TimeDial";
import CourseCard from "../components/CourseCard";
import { useNow, periodFor, type PeriodKey } from "../hooks/useNow";

const TIME_PILLS = ["6시간(반나절)", "8~10시간", "1박2일~2박3일", "3박4일", "4박5일"];

const TOD_CARDS: { period: PeriodKey; time: string; name: string; desc: string; className: string }[] = [
  { period: "dawn", time: "04:00–07:00", name: "새벽", desc: "한라산 새벽 산행, 아무도 없는 숲길", className: "dawn" },
  { period: "morning", time: "07:00–11:00", name: "아침", desc: "국숫집 한 그릇, 갓 문 연 베이글집", className: "morning" },
  { period: "midday", time: "11:00–16:00", name: "낮", desc: "협재·함덕 바다와 오름이 빛나는 시간", className: "midday" },
  { period: "sunset", time: "16:00–19:00", name: "노을", desc: "동문시장·올레시장, 가장 붉은 골목", className: "sunset" },
  { period: "night", time: "19:00–02:00", name: "밤", desc: "동문재래 야시장, 별이 보이는 해안도로", className: "night" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [activePill, setActivePill] = useState(3);
  const now = useNow();
  const currentPeriod = periodFor(now.getHours());

  return (
    <div id="screen-home">
      <section className="hero">
        <div>
          <div className="hero-eyebrow">TIME-BASED JEJU TRAVEL PLATFORM</div>
          <h1 className="hero-title">
            당신에게 주어진
            <br />
            <span className="accent">시간</span>만큼,
            <br />
            제주를 걷습니다.
          </h1>
          <p className="hero-sub">
            6시간이든 4박 5일이든, 시간이 곧 여행의 조건입니다. 남은 시간에 딱 맞는 제주 코스를 시간대별로
            설계해드려요.
          </p>

          <div className="time-select-label">TIME AVAILABLE — 이번 제주 여행, 얼마나 시간이 있으세요?</div>
          <div className="pills">
            {TIME_PILLS.map((label, i) => (
              <div
                key={label}
                className={`pill${activePill === i ? " active" : ""}`}
                onClick={() => setActivePill(i)}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="insight-note">
            💡 제주 여행자의 실제 기록을 보면 3박4일·4박5일이 전체의 <b>67%</b>로 가장 많아요. 반나절 이하
            코스는 표본이 적어 주로 도민의 짧은 나들이에 해당합니다.
          </div>

          <button className="btn-primary" onClick={() => navigate("/list")}>
            이 시간에 맞는 코스 보기 →
          </button>
        </div>

        <TimeDial />
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="section-eyebrow">JEJU BY TIME OF DAY</div>
            <div className="section-title">같은 제주도, 시간에 따라 다른 얼굴을 보여줍니다.</div>
          </div>
          <div className="tod-row">
            {TOD_CARDS.map((c) => (
              <div
                key={c.period}
                className={`tod-card ${c.className}${currentPeriod === c.period ? " current" : ""}`}
              >
                <div className="tod-time mono">{c.time}</div>
                <div>
                  <div className="tod-name">{c.name}</div>
                  <div className="tod-desc">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="section-eyebrow">CURATED BY DURATION</div>
            <div className="section-title">남은 시간에 맞춘, 제주 추천 코스</div>
          </div>
          <div className="course-grid">
            <CourseCard
              to="/list"
              gradient="linear-gradient(135deg,var(--dawn),var(--morning))"
              badge="3박 4일"
              region="제주시 · 조천·구좌·우도"
              title="제주 동부 3박4일 — 우도에서 함덕까지"
              metaChips={["숙소 1~2곳", "2권역"]}
              desc="함덕 숙소를 앵커 삼아 월정리·비자림·우도를 사흘에 걸쳐 도는, 가장 많은 방문객이 택하는 일정 길이."
            />
            <CourseCard
              to="/list"
              gradient="linear-gradient(135deg,var(--morning),var(--sunset))"
              badge="1박 2일"
              region="제주시 · 한림·애월"
              title="협재 아침 바다에서 애월 밤 카페까지"
              metaChips={["총 28시간", "숙박 1회"]}
              desc="첫날 아침 협재 백사장에서 시작해, 다음날 밤 애월 미디어아트 전시에서 마무리."
            />
            <CourseCard
              to="/builder"
              gradient="linear-gradient(135deg,var(--midday),var(--sunset))"
              badge="당일코스"
              region="서귀포시 · 성산·표선"
              title="성산일출봉 일출에서 매일 올레시장 노을까지"
              metaChips={["총 12시간", "이동 46km"]}
              desc="새벽 일출봉의 고요함으로 시작해, 노을 진 재래시장 골목을 걸으며 하루를 닫는 코스."
            />
          </div>
        </div>
      </section>

      <section className="final">
        <div className="section-eyebrow">START MATCHING</div>
        <h2>가진 시간을 입력하면, 제주 어딘가의 코스가 완성됩니다.</h2>
        <p>
          새벽부터 밤까지, 6시간부터 4박5일까지 — 시간여행 제주가 실제 제주 방문객 데이터를 기반으로 지금
          딱 맞는 코스를 짜드려요.
        </p>
        <button className="btn-primary" onClick={() => navigate("/builder")}>
          내 시간으로 코스 만들기 →
        </button>
      </section>
    </div>
  );
}
