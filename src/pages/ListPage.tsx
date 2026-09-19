import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useCuratedCourses, useSavedCuratedCourses, useToggleSavedCuratedCourse } from "../hooks/useCuratedCourses";
import { BUILDER_REGION_KEYS, REGION_CODE_BY_KEY, REGION_LABELS } from "../api/types";
import type { CuratedCourseSummary, RegionCode } from "../api/types";

const REGION_FACETS: { val: RegionCode; label: string }[] = BUILDER_REGION_KEYS.map((key) => ({
  val: REGION_CODE_BY_KEY[key],
  label: REGION_LABELS[key],
}));

const DURATION_FACETS = [{ val: "당일코스", label: "당일코스" }];

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: courses, isLoading, isError } = useCuratedCourses();
  const { data: savedCurated } = useSavedCuratedCourses(Boolean(user));
  const savedIds = new Set((savedCurated ?? []).map((c) => c.id));
  const toggleSaved = useToggleSavedCuratedCourse();
  const [region, setRegion] = useState<Set<string>>(new Set());
  const [duration, setDuration] = useState<Set<string>>(new Set());
  const [time, setTime] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);

  const all: CuratedCourseSummary[] = courses ?? [];

  const visible = useMemo(
    () =>
      all.filter((c) => {
        const mR = region.size === 0 || region.has(c.region);
        const mD = duration.size === 0 || duration.has(c.duration);
        const mT = time.size === 0 || c.time_of_day.some((t) => time.has(t));
        return mR && mD && mT;
      }),
    [all, region, duration, time],
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
      <header className="page-head wrap">
        <div className="page-eyebrow">BROWSE ALL COURSES</div>
        <h1 className="page-title">제주, 모든 시간의 코스</h1>
        <p className="page-sub">
          제주 당일치기 코스 10가지, 지역과 시간대로 골라보세요.
        </p>
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
                    {all.filter((c) => c.region === f.val).length}
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
                    {all.filter((c) => c.duration === f.val).length}
                  </span>
                </div>
              ))}
            </div>
            <div className="facet-note">
              ※ 지금은 당일코스만 준비돼 있어요. 1박 이상 코스는 곧 추가될 예정이에요.
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

          {isLoading && <div className="empty-state">코스를 불러오는 중이에요</div>}
          {isError && <div className="empty-state">코스를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</div>}

          <div className="grid">
            {!isLoading && !isError && visible.length === 0 && (
              <div className="empty-state">
                <span className="serif">조건에 맞는 코스가 아직 없어요</span>
                다른 시간대나 지역을 함께 선택해보세요.
              </div>
            )}
            {visible.map((c) => (
              <Link className="course-card" to={`/list/${c.id}`} key={c.id}>
                <div className="course-photo" style={{ background: c.gradient }}>
                  <span className="badge">{c.badge}</span>
                  <button
                    type="button"
                    className={`save-btn${savedIds.has(c.id) ? " on" : ""}`}
                    aria-label={savedIds.has(c.id) ? "저장 취소" : "저장"}
                    aria-pressed={savedIds.has(c.id)}
                    onClick={(e) => {
                      e.preventDefault(); // 카드 전체가 링크라 하트를 눌러도 상세로 넘어가지 않게 한다.
                      if (user) toggleSaved.mutate({ courseId: c.id, saved: savedIds.has(c.id) });
                      else navigate("/login");
                    }}
                  >
                    {savedIds.has(c.id) ? "♥" : "♡"}
                  </button>
                </div>
                <div className="course-body">
                  <div className="course-title">{c.title}</div>
                  <div className="course-meta">
                    {c.meta_chips.map((m) => (
                      <span className="meta-chip" key={m}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
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
