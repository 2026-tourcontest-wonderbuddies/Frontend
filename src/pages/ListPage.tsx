import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

interface ListCourse {
  id: string;
  to: string;
  region: string;
  duration: string;
  time: string[];
  gradient: string;
  badge: string;
  regionLabel: string;
  title: string;
  metaChips: string[];
}

const COURSES: ListCourse[] = [
  {
    id: "c1",
    to: "/builder",
    region: "서귀포동부",
    duration: "당일코스",
    time: ["낮", "노을"],
    gradient: "linear-gradient(135deg,var(--dawn),var(--midday))",
    badge: "당일코스 · 12시간",
    regionLabel: "서귀포시 · 성산·표선",
    title: "성산일출봉 일출에서 매일 올레시장 노을까지",
    metaChips: ["☀️ 낮", "🌇 노을", "총 12시간"],
  },
  {
    id: "c2",
    to: "#",
    region: "제주시서부",
    duration: "1박2일",
    time: ["아침", "밤"],
    gradient: "linear-gradient(135deg,var(--morning),var(--sunset))",
    badge: "1박 2일",
    regionLabel: "제주시 · 한림·애월",
    title: "협재 아침 바다에서 애월 밤 카페까지",
    metaChips: ["🌤️ 아침", "🌙 밤", "총 28시간"],
  },
  {
    id: "c3",
    to: "#",
    region: "제주시동부",
    duration: "6시간",
    time: ["밤"],
    gradient: "linear-gradient(135deg,var(--night),var(--dawn))",
    badge: "6시간 · 반나절",
    regionLabel: "제주시 · 동문시장 일대",
    title: "동문재래 야시장, 제주 도민이 즐기는 반나절",
    metaChips: ["🌙 밤", "총 6시간"],
  },
  {
    id: "c4",
    to: "#",
    region: "제주시동부",
    duration: "3박4일",
    time: ["새벽", "낮"],
    gradient: "linear-gradient(135deg,var(--dawn),#4C4FA8)",
    badge: "3박 4일",
    regionLabel: "제주시 · 조천·구좌·우도",
    title: "제주 동부 3박4일 — 우도에서 함덕까지",
    metaChips: ["🌌 새벽", "☀️ 낮", "숙소 1~2곳"],
  },
  {
    id: "c5",
    to: "#",
    region: "전역",
    duration: "3박4일",
    time: ["낮", "밤"],
    gradient: "linear-gradient(135deg,var(--midday),var(--night))",
    badge: "3박 4일",
    regionLabel: "제주 전역 · 동서 일주",
    title: "제주 동서 완주 3박4일, 낮과 밤을 모두",
    metaChips: ["☀️ 낮", "🌙 밤", "2~3권역"],
  },
  {
    id: "c6",
    to: "#",
    region: "서귀포서부",
    duration: "1박2일",
    time: ["밤"],
    gradient: "linear-gradient(135deg,var(--sunset),var(--night))",
    badge: "1박 2일",
    regionLabel: "서귀포시 · 안덕·대정",
    title: "용머리해안에서 안덕 밤바다까지, 1박 2일",
    metaChips: ["🌙 밤", "숙박 1회"],
  },
  {
    id: "c7",
    to: "#",
    region: "제주시내",
    duration: "6시간",
    time: ["노을"],
    gradient: "linear-gradient(135deg,var(--sunset),var(--morning))",
    badge: "4시간 · 마지막 날",
    regionLabel: "제주시 · 도두동",
    title: "무지개 해안도로 노을 러닝 & 피크닉",
    metaChips: ["🌇 노을", "비행기 전 마지막 코스"],
  },
  {
    id: "c8",
    to: "#",
    region: "제주시서부",
    duration: "당일코스",
    time: ["아침", "낮"],
    gradient: "linear-gradient(135deg,var(--morning),var(--midday))",
    badge: "당일코스 · 8시간",
    regionLabel: "제주시 · 한림 금악",
    title: "아침 오름 트레킹, 낮의 협재 바다",
    metaChips: ["🌤️ 아침", "☀️ 낮"],
  },
  {
    id: "c9",
    to: "#",
    region: "서귀포서부",
    duration: "4박5일",
    time: ["새벽", "아침"],
    gradient: "linear-gradient(135deg,var(--dawn),var(--morning))",
    badge: "4박 5일",
    regionLabel: "서귀포시 · 영실~안덕",
    title: "서귀포 4박5일 완주 — 한라산 영실에서 오설록까지",
    metaChips: ["🌌 새벽", "🌤️ 아침", "숙소 1~2곳"],
  },
];

const REGION_FACETS = [
  { val: "제주시동부", label: "제주시 동부 (조천·구좌)" },
  { val: "제주시서부", label: "제주시 서부 (한림·애월)" },
  { val: "제주시내", label: "제주 시내 (원도심)" },
  { val: "서귀포동부", label: "서귀포 동부 (성산·표선)" },
  { val: "서귀포서부", label: "서귀포 서부 (안덕·대정)" },
  { val: "전역", label: "제주 전역 일주" },
];

const DURATION_FACETS = [
  { val: "6시간", label: "6시간 (반나절)" },
  { val: "당일코스", label: "8~10시간 (당일코스)" },
  { val: "1박2일", label: "1박2일~2박3일" },
  { val: "3박4일", label: "3박 4일" },
  { val: "4박5일", label: "4박 5일" },
];

const TOD_FACETS = [
  { val: "새벽", icon: "🌌" },
  { val: "아침", icon: "🌤️" },
  { val: "낮", icon: "☀️" },
  { val: "노을", icon: "🌇" },
  { val: "밤", icon: "🌙" },
];

function toggle(set: Set<string>, val: string): Set<string> {
  const next = new Set(set);
  if (next.has(val)) next.delete(val);
  else next.add(val);
  return next;
}

export default function ListPage() {
  const [region, setRegion] = useState<Set<string>>(new Set());
  const [duration, setDuration] = useState<Set<string>>(new Set());
  const [time, setTime] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);

  const visible = useMemo(
    () =>
      COURSES.filter((c) => {
        const mR = region.size === 0 || region.has(c.region);
        const mD = duration.size === 0 || duration.has(c.duration);
        const mT = time.size === 0 || c.time.some((t) => time.has(t));
        return mR && mD && mT;
      }),
    [region, duration, time],
  );

  const activeValues = [...region, ...duration, ...time];
  const totalFacets = region.size + duration.size + time.size;

  function resetFilters() {
    setRegion(new Set());
    setDuration(new Set());
    setTime(new Set());
  }

  return (
    <div>
      <div className="crumb">
        <Link to="/">홈</Link> / 추천 코스
      </div>
      <header className="page-head wrap">
        <div className="page-eyebrow">BROWSE ALL COURSES</div>
        <h1 className="page-title">제주, 모든 시간의 코스</h1>
        <p className="page-sub">
          새벽부터 밤까지, 6시간부터 4박5일까지 — 지금 이 조건에 맞는 제주 코스를 직접 둘러보세요.
        </p>
        <div className="nocon-banner" style={{ marginTop: 12 }}>
          ⚠ 백엔드 미연동 — 백엔드에 "공개 코스" 모델이 없어 이 목록은 예시로 넣어둔 고정
          데이터예요. 아래 검색·정렬·페이지 이동과 카드의 ♡ 저장은 아직 동작하지 않아요.
        </div>

        <div className="search-bar">
          <input className="search-input" type="text" placeholder="지역, 코스명, 키워드로 검색 (예: 노을, 성산, 야시장)" />
          <select className="sort-select">
            <option>인기순</option>
            <option>최신순</option>
            <option>소요시간 짧은순</option>
            <option>소요시간 긴순</option>
          </select>
        </div>
      </header>

      <div className="layout wrap">
        <aside className={`facets${sheetOpen ? " open" : ""}`}>
          <div className="sheet-close" onClick={() => setSheetOpen(false)}>
            닫고 결과 보기 ({visible.length}) ✕
          </div>
          <div className="facet-group">
            <div className="facet-title">지역</div>
            <div className="facet-list">
              {REGION_FACETS.map((f) => (
                <div
                  key={f.val}
                  className={`facet-item${region.has(f.val) ? " active" : ""}`}
                  onClick={() => setRegion((s) => toggle(s, f.val))}
                >
                  <div className="facet-box" />
                  {f.label}
                  <span className="facet-count mono">
                    {COURSES.filter((c) => c.region === f.val).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="facet-group">
            <div className="facet-title">소요시간</div>
            <div className="facet-list">
              {DURATION_FACETS.map((f) => (
                <div
                  key={f.val}
                  className={`facet-item${duration.has(f.val) ? " active" : ""}`}
                  onClick={() => setDuration((s) => toggle(s, f.val))}
                >
                  <div className="facet-box" />
                  {f.label}
                  <span className="facet-count mono">
                    {COURSES.filter((c) => c.duration === f.val).length}
                  </span>
                </div>
              ))}
            </div>
            <div className="facet-note">
              ※ 제주 실제 여행자 기록 기준, 3박4일·4박5일이 전체의 67%. 4시간 이하 코스는 마지막 날·늦은
              시작 시나리오에서만 제안돼요.
            </div>
          </div>
          <div className="facet-group">
            <div className="facet-title">시간대</div>
            <div className="tod-toggle-row">
              {TOD_FACETS.map((f) => (
                <div
                  key={f.val}
                  className={`tod-toggle${time.has(f.val) ? " active" : ""}`}
                  onClick={() => setTime((s) => toggle(s, f.val))}
                >
                  {f.icon}
                </div>
              ))}
            </div>
          </div>
          <a className="reset-link" onClick={resetFilters}>
            필터 초기화
          </a>
        </aside>

        <div>
          <div className="results-head">
            <div className="result-count">
              총 <b>{visible.length}</b>개 코스
            </div>
            <div className="active-pills">
              {activeValues.map((v) => (
                <div className="active-pill" key={v}>
                  {v} ✕
                </div>
              ))}
            </div>
          </div>
          <div className="grid">
            {visible.length === 0 && (
              <div className="empty-state">
                <span className="serif">조건에 맞는 코스가 아직 없어요</span>
                다른 시간대나 지역을 함께 선택해보세요.
              </div>
            )}
            {visible.map((c) => (
              <Link className="course-card" to={c.to} key={c.id}>
                <div className="course-photo" style={{ background: c.gradient }}>
                  <span className="badge">{c.badge}</span>
                  <span className="save-btn" onClick={(e) => e.preventDefault()}>
                    ♡
                  </span>
                </div>
                <div className="course-body">
                  <div className="course-region">{c.regionLabel}</div>
                  <div className="course-title">{c.title}</div>
                  <div className="course-meta">
                    {c.metaChips.map((m) => (
                      <span className="meta-chip" key={m}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="pagination">
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn">›</button>
          </div>
        </div>
      </div>

      {!sheetOpen && (
        <button className="filter-fab" onClick={() => setSheetOpen(true)}>
          ⚙ 필터{totalFacets ? <span className="mono"> {totalFacets}</span> : null}
        </button>
      )}
      <div className={`sheet-backdrop${sheetOpen ? " open" : ""}`} onClick={() => setSheetOpen(false)} />
    </div>
  );
}
