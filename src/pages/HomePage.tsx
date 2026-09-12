import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TimeDial from "../components/TimeDial";
import CourseCard from "../components/CourseCard";
import { useNow, periodFor, type PeriodKey } from "../hooks/useNow";
import { getPeriodPlaces } from "../api/places";
import type { PeriodPlace } from "../api/types";

const TIME_PILLS = ["6시간(반나절)", "8~10시간", "1박2일~2박3일", "3박4일", "4박5일"];

const TOD_CARDS: { period: PeriodKey; time: string; name: string; desc: string; className: string }[] = [
  { period: "dawn", time: "04:00–07:00", name: "새벽", desc: "성판악 입산, 해장국집과 새벽 수산시장", className: "dawn" },
  { period: "morning", time: "07:00–11:00", name: "아침", desc: "국숫집 한 그릇, 갓 문 연 베이글집", className: "morning" },
  { period: "midday", time: "11:00–16:00", name: "낮", desc: "협재·함덕 바다와 오름이 빛나는 시간", className: "midday" },
  { period: "sunset", time: "16:00–19:00", name: "노을", desc: "동문시장·올레시장, 가장 붉은 골목", className: "sunset" },
  { period: "night", time: "19:00–02:00", name: "밤", desc: "동문재래 야시장, 별이 보이는 해안도로", className: "night" },
];

/** 카드 한 장이 왜 이 시간대에 뽑혔는지 한 줄로. 근거가 두 갈래다. */
function evidenceLabel(p: PeriodPlace) {
  if (p.evidence === "hours") return `${p.open} 개방`;
  return `방문의 ${Math.round((p.share ?? 0) * 100)}%가 이 시간대`;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [activePill, setActivePill] = useState(3);
  const now = useNow();
  const currentPeriod = periodFor(now.getHours());

  const [openPeriod, setOpenPeriod] = useState<PeriodKey | null>(null);
  const [places, setPlaces] = useState<Partial<Record<PeriodKey, PeriodPlace[]>>>({});
  const [failed, setFailed] = useState<Partial<Record<PeriodKey, boolean>>>({});

  function togglePeriod(period: PeriodKey) {
    if (openPeriod === period) {
      setOpenPeriod(null);
      return;
    }
    setOpenPeriod(period);
    if (places[period] || failed[period]) return; // 한 번 받은 시간대는 다시 부르지 않는다

    getPeriodPlaces(period)
      .then((res) => setPlaces((prev) => ({ ...prev, [period]: res.results })))
      .catch(() => setFailed((prev) => ({ ...prev, [period]: true })));
  }

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
                role="button"
                tabIndex={0}
                aria-expanded={openPeriod === c.period}
                className={`tod-card ${c.className}${currentPeriod === c.period ? " current" : ""}${
                  openPeriod === c.period ? " open" : ""
                }`}
                onClick={() => togglePeriod(c.period)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    togglePeriod(c.period);
                  }
                }}
              >
                <div className="tod-time mono">{c.time}</div>
                <div>
                  <div className="tod-name">{c.name}</div>
                  <div className="tod-desc">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {openPeriod && (
            <div className="tod-panel">
              {failed[openPeriod] ? (
                <div className="tod-panel-msg">장소를 불러오지 못했습니다.</div>
              ) : !places[openPeriod] ? (
                <div className="tod-panel-msg">불러오는 중…</div>
              ) : (
                <>
                  <div className="tod-panel-head">
                    {TOD_CARDS.find((c) => c.period === openPeriod)?.name}에 가는 곳
                    <span>
                      {places[openPeriod]![0]?.evidence === "hours"
                        ? "이 시각에 문을 여는 곳"
                        : "실제 방문객 도착시각 기준"}
                    </span>
                  </div>
                  <ol className="tod-place-list">
                    {places[openPeriod]!.map((p) => (
                      <li key={p.content_id} className="tod-place-row">
                        <div className="tod-place-main">
                          <span className="tod-place-title">{p.title}</span>
                          <span className="tod-place-cat">{p.small_category_name}</span>
                        </div>
                        <div className="tod-place-meta">
                          <span className="mono">{evidenceLabel(p)}</span>
                          <span className="tod-place-addr">{p.address}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          )}
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
