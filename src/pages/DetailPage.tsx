import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useAddCourseItem,
  useCourse,
  useDeleteCourseItem,
  useReorderCourseItems,
} from "../hooks/useCourses";
import { usePlaceSuggestions } from "../hooks/usePlaceSearch";
import { useAuth } from "../auth/AuthContext";
import { useSavedCourses, useToggleSavedCourse } from "../hooks/useSavedCourses";
import { ApiError } from "../api/client";
import { PRIORITY_LABELS } from "../api/types";
import { dayCaseLabel, dayDateLabel, hhmm, placeMetaLine } from "../utils/format";
import type { CourseDay, PlaceSummary, SearchPlace } from "../api/types";
import {
  courseItems,
  courseLodging,
  courseMapPoints,
  courseStartIso,
  courseStats,
  dayAirport,
  dayLodgingStart,
  diffMin,
} from "../utils/course";
import KakaoMap from "../components/KakaoMap";
import PlaceDetailSheet from "../components/PlaceDetailSheet";
import Modal from "../components/Modal";

const STOP_ANGLES = [
  { x: 118, y: 0 },
  { x: 83, y: 83 },
  { x: 0, y: 118 },
  { x: -83, y: 83 },
  { x: -118, y: 0 },
  { x: -83, y: -83 },
  { x: 0, y: -118 },
  { x: 83, y: -83 },
];

const PIN_POSITIONS = [
  { top: "30%", left: "60%" },
  { top: "50%", left: "40%" },
  { top: "65%", left: "65%" },
  { top: "75%", left: "30%" },
  { top: "40%", left: "20%" },
  { top: "20%", left: "45%" },
  { top: "60%", left: "80%" },
  { top: "80%", left: "55%" },
];

/** 도착 시각대에 따라 타임라인 링 색을 고른다(핸드오프 시안 기준). */
function hourColor(time: string) {
  const h = Number(time.slice(0, 2));
  if (!Number.isFinite(h)) return "var(--morning)";
  if (h < 7) return "var(--night)";
  if (h < 9) return "var(--dawn)";
  if (h < 12) return "var(--morning)";
  if (h < 16) return "var(--midday)";
  if (h < 19) return "var(--sunset)";
  return "var(--night)";
}

function TlDot({ time }: { time: string }) {
  return (
    <div className="tl-dot mono" style={{ "--dot": hourColor(time) } as CSSProperties}>
      {time}
    </div>
  );
}

/** 서버가 400 { error }로 주는 사용자용 실패 사유(예: 이동시간 계산 불가 장소). 없으면 fallback. */
function serverErrorText(err: unknown, fallback: string): string {
  const text = err instanceof ApiError ? (err.body as { error?: unknown } | null)?.error : null;
  return typeof text === "string" && text ? text : fallback;
}

/** 검색 자동완성(usePlaceSuggestions)에서 고른 장소를 그 날 맨 끝에 추가한다. */
function AddPlaceModal({
  courseId,
  day,
  onClose,
  onAdded,
}: {
  courseId: number;
  day: CourseDay;
  onClose: () => void;
  /** 추가에 성공했을 때, 서버가 알려준 가용시간 초과 여부와 함께 부른다. */
  onAdded: (overBudget: boolean) => void;
}) {
  const [q, setQ] = useState("");
  const { data } = usePlaceSuggestions(q);
  const suggestions = data?.results ?? [];
  const addItem = useAddCourseItem();

  function pick(place: SearchPlace) {
    addItem.mutate(
      // order 는 삽입 위치(0부터) — 맨 끝에 붙이려면 현재 개수다.
      { courseId, dayIndex: day.day_index, contentId: place.content_id, order: day.items.length },
      {
        onSuccess: (res) => {
          onAdded(res.over_budget);
          onClose();
        },
      },
    );
  }

  return (
    <Modal title={`DAY ${day.day_index}에 장소 추가`} onClose={onClose}>
      <div className="search-bar" style={{ marginBottom: 12 }}>
        <input
          className="search-input"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="장소명으로 검색"
        />
      </div>
      {addItem.isPending && <p className="mono" style={{ color: "var(--ink-soft)" }}>추가하는 중…</p>}
      {addItem.isError && (
        <p className="lodging-warn">
          {serverErrorText(addItem.error, "추가하지 못했어요. 잠시 후 다시 시도해 주세요.")}
        </p>
      )}
      <div className="saved-list">
        {suggestions.map((place) => (
          <div className="saved-row" key={place.content_id}>
            <button
              type="button"
              className="saved-row-link"
              disabled={addItem.isPending}
              onClick={() => pick(place)}
            >
              <div className="saved-row-title">{place.title}</div>
              <div className="saved-row-sub mono">
                {place.content_type_name}
                {place.small_category_name ? ` · ${place.small_category_name}` : ""}
              </div>
            </button>
          </div>
        ))}
        {q.trim() && suggestions.length === 0 && (
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>검색 결과가 없어요.</p>
        )}
      </div>
    </Modal>
  );
}

/** 라우트의 :id 는 명세 4번의 course_id 다. */
export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: course, isLoading, isError } = useCourse(id);
  const { user } = useAuth();
  const courseId = Number(id);
  const { data: savedCourses = [] } = useSavedCourses(Boolean(user));
  const isSaved = savedCourses.some((c) => c.id === courseId);
  const toggleSaved = useToggleSavedCourse();
  const [selectedPlace, setSelectedPlace] = useState<PlaceSummary | null>(null);
  const [dayIdx, setDayIdx] = useState(0);
  const [addPlaceOpen, setAddPlaceOpen] = useState(false);
  // 마우스를 올린 타임라인 카드의 item.id. 우측 지도에서 그 장소 마커를 강조한다.
  const [hoverItemId, setHoverItemId] = useState<number | null>(null);
  // 편집 뒤 서버가 "가용시간 초과"라고 알려준 Day. 다른 Day로 옮기거나 다음 편집 결과가 오면 바뀐다.
  const [overBudgetDay, setOverBudgetDay] = useState<number | null>(null);
  const reorderItems = useReorderCourseItems();
  const deleteItem = useDeleteCourseItem();

  // sticky 헤더를 nav 바로 아래에 붙이려면 실제 nav 높이가 필요하다(BuilderPage와 같은 방식).
  useEffect(() => {
    const navEl = document.querySelector("nav");
    if (!navEl) return;
    const sync = () =>
      document.documentElement.style.setProperty("--nav-height", `${navEl.getBoundingClientRect().height}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(navEl);
    return () => ro.disconnect();
  }, []);

  if (isLoading) {
    return (
      <div className="state-panel">
        <div className="spinner" />
        <span className="serif">코스를 불러오는 중이에요</span>
        <p>가장 잘 맞는 순서로 정리하고 있어요, 잠시만 기다려주세요.</p>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="state-panel">
        <span className="serif">코스를 찾을 수 없어요</span>
        <p>링크가 잘못되었거나, 만료된 코스일 수 있어요.</p>
        <button className="btn-primary" onClick={() => navigate("/builder")}>
          다시 만들기 →
        </button>
      </div>
    );
  }

  const day = course.days[dayIdx] ?? course.days[0];
  // 입도일(A)을 뺀 날의 숙소 카드는 공항 카드처럼 틀 없이 글자만 보여준다.
  const flatLodging = day.day_case === "A" ? "" : " tl-flat";

  function moveItem(idx: number, direction: -1 | 1) {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= day.items.length) return;
    const ids = day.items.map((it) => it.id);
    [ids[idx], ids[targetIdx]] = [ids[targetIdx], ids[idx]];
    reorderItems.mutate(
      { courseId, dayIndex: day.day_index, itemIds: ids },
      { onSuccess: (res) => setOverBudgetDay(res.over_budget ? day.day_index : null) },
    );
  }

  function removeItem(itemId: number) {
    if (!window.confirm("이 장소를 코스에서 삭제할까요?")) return;
    // 장소가 줄면 시간이 늘지 않으므로 초과 경고는 걷는다.
    deleteItem.mutate({ courseId, itemId }, { onSuccess: () => setOverBudgetDay(null) });
  }

  const airport = dayAirport(course, day);
  const lodgingStart = dayLodgingStart(course, dayIdx);
  // 체크인 가능 시각(호텔 정책)과 실제 도착 시각(마지막 일정 종료 + 이동시간)은 다르다.
  // 늦게 도착하면 체크인 시각보다 늦으므로, 둘 중 늦은 시각을 타임라인 dot에 쓴다.
  const lastItemDepart = day.items[day.items.length - 1]?.depart_at ?? null;
  // travel_to_next_min은 숙소 확정(select-lodging) 이전에는 없을 수 있다 — 그때는 이동시간 0으로 근사한다.
  const lodgingArriveIso =
    lastItemDepart && day.travel_to_next_min != null
      ? new Date(new Date(lastItemDepart).getTime() + day.travel_to_next_min * 60000).toISOString()
      : lastItemDepart;
  const lodgingArriveAt =
    lodgingArriveIso && day.lodging?.check_in_time
      ? hhmm(lodgingArriveIso) > day.lodging.check_in_time
        ? hhmm(lodgingArriveIso)
        : day.lodging.check_in_time
      : lodgingArriveIso
        ? hhmm(lodgingArriveIso)
        : day.lodging?.check_in_time || "숙박";
  // 공항 시각이 있으면 그게 그 날의 실제 양 끝점이다(사용자가 빌더에 입력한 값).
  // 2일차부터는 숙소 출발이 그 자리를 대신한다.
  const dayStart = airport.depart ?? lodgingStart.time ?? day.items[0]?.arrive_at ?? null;
  const dayEnd = airport.arrive ?? day.items[day.items.length - 1]?.depart_at ?? null;
  const allItems = courseItems(course);
  const lodging = courseLodging(course);
  const stats = courseStats(course);
  const startIso = courseStartIso(course);
  // 백엔드는 요청 조건(목적·권역)을 코스 응답에 담지 않는다. 숙소 스냅샷의 권역을 대신 쓴다.
  const regionText = lodging?.region ?? "제주";
  const modeText = PRIORITY_LABELS[course.mode];
  const titleFirst = allItems[0]?.place.title ?? "";
  const titleLast = allItems[allItems.length - 1]?.place.title ?? "";

  return (
    <div>
      <div className="crumb">
        <Link to="/">홈</Link> / <Link to="/builder">코스 매칭</Link> / {modeText}
      </div>

      <header className="result-header">
        <div>
          <div className="match-badge">
            ✓ {course.days.length}일 코스 · {modeText}
          </div>
          <h1 className="result-title">
            {titleFirst}
            {titleLast && titleFirst !== titleLast ? (
              <>
                에서
                <br />
                {titleLast}까지
              </>
            ) : null}
          </h1>
          <div className="result-region mono">
            {regionText} &nbsp;|&nbsp; {allItems.length}개 스팟 &nbsp;|&nbsp; 차량
          </div>
          <div className="meta-row">
            <span className="meta-chip mono">
              ⏱ 체류 {Math.round(stats.stayMin / 60)}시간 · 이동 {stats.travelMin}분
            </span>
            <span className="meta-chip mono">📅 {course.days.length}일 일정</span>
            {course.final_score !== null && (
              <span className="meta-chip mono">🎯 추천 점수 {course.final_score.toFixed(1)}</span>
            )}
          </div>
        </div>
        <div>
          <div className="mini-dial-wrap">
            <div className="mini-dial" />
            <div className="mini-face" />
            {day.items.slice(0, 8).map((item, i) => (
              <div
                key={item.id}
                className="mini-stop"
                style={{
                  transform: `translate(-50%,-50%) translate(${STOP_ANGLES[i].x}px,${STOP_ANGLES[i].y}px)`,
                }}
              />
            ))}
            <div className="mini-center">
              <div className="t">{regionText.split(" ")[0]}</div>
              <div className="s">
                {dayStart && dayEnd ? `${hhmm(dayStart)} → ${hhmm(dayEnd)}` : ""}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="main-detail wrap">
        <div className="detail-timeline-header">
          <div className="section-label">TIMELINE</div>
          <div className="section-title serif">시간 순서대로 보는 코스</div>

          <div className="day-summary mono" style={{ margin: "10px 0 16px", color: "var(--ink-soft)" }}>
            {startIso ? `${dayDateLabel(startIso, day.day_index)} · ` : ""}
            {dayStart && dayEnd
              ? `${hhmm(dayStart)}–${hhmm(dayEnd)} · ${day.items.length}곳 방문`
              : "방문지 없음"}
          </div>
        </div>

        {/* 타임라인을 스크롤해도 Day 탭·버튼이 nav 아래에 남도록 grid 직속 자식으로 둔다(sticky는 부모 안에서만 고정됨). */}
        <div className="detail-sticky-head">
          <div className="day-tabs-row">
            {course.days.length > 1 && (
              <div className="day-tabs day-tabs-full">
                {course.days.map((d, i) => (
                  <button
                    key={d.day_index}
                    type="button"
                    className={`day-tab${i === dayIdx ? " active" : ""}`}
                    aria-pressed={i === dayIdx}
                    onClick={() => {
                      setDayIdx(i);
                      setOverBudgetDay(null);
                    }}
                  >
                    <span className="day-tab-case">{dayCaseLabel(d.day_case)}</span>
                    <span className="day-tab-main">DAY {d.day_index}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="actions">
              <Link className="btn-primary" to={`/trip/${id}/map`}>
                지도에서 열기
              </Link>
              {user && (
                <button
                  type="button"
                  className="btn-outline"
                  aria-pressed={isSaved}
                  disabled={toggleSaved.isPending}
                  onClick={() => toggleSaved.mutate({ courseId, saved: isSaved })}
                >
                  {isSaved ? "♥ 저장됨" : "♡ 저장함에 담기"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="detail-timeline-header">
          <div className="day-subheading mono">
            가용 {day.avail_hours}시간 · 목표 {day.target_slots}곳
          </div>
        </div>

        <div className="detail-timeline-panel">
            {day.items.length === 0 && (
              <div className="day-subheading mono">
                이 조건에 맞는 장소를 더 찾지 못했어요. 권역을 넓혀보세요.
              </div>
            )}
            {(reorderItems.isError || deleteItem.isError) && (
              <p className="lodging-warn">방금 요청이 실패했어요. 잠시 후 다시 시도해 주세요.</p>
            )}
            {overBudgetDay === day.day_index && (
              <p className="lodging-warn" role="status" style={{ fontSize: 12.5, marginBottom: 8 }}>
                ⚠ DAY {day.day_index} 일정이 가용 시간({day.avail_hours}시간)을 넘었어요. 장소를 줄이거나 순서를 바꿔 보세요.
              </p>
            )}
            <div className="timeline">
            {airport.depart && (
              <div className="tl-item">
                <TlDot time={hhmm(airport.depart)} />
                <div className="tl-card tl-airport">
                  <div className="tl-title">🛬 제주공항 밖 출발 (수하물 수령 완료)</div>
                </div>
                {airport.departTravelMin ? (
                  <div className="tl-transit">
                    <span className="line" />
                    ▸ 차량 {airport.departTravelMin}분 이동
                  </div>
                ) : null}
              </div>
            )}

            {lodgingStart.time && (
              <div className="tl-item">
                <TlDot time={hhmm(lodgingStart.time)} />
                <div className={`tl-card tl-lodging${flatLodging}`}>
                  <div className="tl-title">🏨 {lodgingStart.lodging?.title} 출발</div>
                </div>
                {lodgingStart.travelMin ? (
                  <div className="tl-transit">
                    <span className="line" />
                    ▸ 차량 {lodgingStart.travelMin}분 이동
                  </div>
                ) : null}
              </div>
            )}

            {day.items.map((item, idx) => (
              <div className="tl-item" key={item.id}>
                <TlDot time={hhmm(item.arrive_at)} />
                <div
                  className="tl-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPlace(item.place)}
                  // 마우스일 때만 — 터치의 hover 에뮬레이션은 탭한 뒤 강조가 안 풀린다.
                  onPointerEnter={(e) => e.pointerType === "mouse" && setHoverItemId(item.id)}
                  onPointerLeave={() => setHoverItemId(null)}
                >
                  <div className="tl-top">
                    <div className="tl-title tl-title-row">
                      {item.place.title}
                      {item.place.content_type_name && (
                        <span className="meta-chip type-chip mono" data-type={item.place.content_type_name}>
                          {item.place.content_type_name}
                        </span>
                      )}
                    </div>
                    <div className="tl-stay mono">체류 {diffMin(item.arrive_at, item.depart_at)}분</div>
                  </div>
                  {placeMetaLine(item.place) && <div className="tl-meta">{placeMetaLine(item.place)}</div>}
                  <div className="tl-desc">
                    {item.recommend_reason ||
                      item.place.overview ||
                      `${item.place.content_type_name} · ${item.place.address}`}
                  </div>
                </div>
                <div className="edit-item-actions" style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    disabled={idx === 0 || reorderItems.isPending}
                    onClick={() => moveItem(idx, -1)}
                  >
                    ↑ 위로
                  </button>
                  <button
                    type="button"
                    disabled={idx === day.items.length - 1 || reorderItems.isPending}
                    onClick={() => moveItem(idx, 1)}
                  >
                    ↓ 아래로
                  </button>
                  <button
                    type="button"
                    disabled={deleteItem.isPending}
                    onClick={() => removeItem(item.id)}
                  >
                    ✕ 삭제
                  </button>
                </div>
                {idx < day.items.length - 1 ? (
                  <div className="tl-transit">
                    <span className="line" />
                    ▸ 차량 {day.items[idx + 1].travel_min_from_prev ?? 0}분 이동
                  </div>
                ) : airport.arriveTravelMin ? (
                  <div className="tl-transit">
                    <span className="line" />
                    ▸ 차량 {airport.arriveTravelMin}분 이동
                  </div>
                ) : day.lodging && day.travel_to_next_min != null ? (
                  <div className="tl-transit">
                    <span className="line" />
                    ▸ 차량 {day.travel_to_next_min}분 이동
                  </div>
                ) : null}
              </div>
            ))}

            {airport.arrive && (
              <div className="tl-item">
                <TlDot time={hhmm(airport.arrive)} />
                <div className="tl-card tl-airport">
                  <div className="tl-title">🛫 제주공항 도착 (탑승 수속)</div>
                </div>
              </div>
            )}

            {day.lodging && (
              <div className="tl-item">
                <TlDot time={lodgingArriveAt} />
                <div className={`tl-card tl-lodging${flatLodging}`}>
                  <div className="tl-top">
                    <div className="tl-title">
                      🏨 {day.lodging.title}
                      <span className="meta-chip mono" style={{ marginLeft: 8 }}>
                        {day.lodging.category}
                      </span>
                    </div>
                    <div className="tl-stay mono">{day.lodging.price_hint}</div>
                  </div>
                  <div className="tl-meta">
                    {[
                      day.lodging.room_type,
                      day.lodging.check_in_time && `체크인 ${day.lodging.check_in_time}부터`,
                      day.lodging.check_out_time && `체크아웃 ${day.lodging.check_out_time}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  {day.lodging.tripcom_link && (
                    <a
                      href={day.lodging.tripcom_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="side-note"
                      style={{ display: "inline-block", marginTop: 6, color: "#E07B1A" }}
                    >
                      트립닷컴에서 요금 확인 ↗
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

            <button
              type="button"
              className="btn-outline"
              style={{ marginTop: 16, padding: "9px 16px", fontSize: 12.5 }}
              onClick={() => setAddPlaceOpen(true)}
            >
              + 이 날에 장소 추가
            </button>
        </div>

        <aside>
          <div className="side-card">
            <h4>코스 지도</h4>
            <KakaoMap
              points={courseMapPoints(course, day.day_index)}
              showRoute
              highlightId={hoverItemId == null ? null : String(hoverItemId)}
              height={300}
              boundsPadding={16}
              fallback={
                <Link to={`/trip/${id}/map`} style={{ display: "block" }}>
                  <div className="map-placeholder">
                    {allItems.slice(0, 8).map((item, i) => (
                      <div className="map-pin" key={item.id} style={PIN_POSITIONS[i]} />
                    ))}
                  </div>
                </Link>
              }
            />
            <div className="side-note">
              DAY {day.day_index} · {day.items.length}개 스팟 · <Link to={`/trip/${id}/map`}>전체 지도 보기 →</Link>
            </div>
          </div>
        </aside>
      </div>

      {selectedPlace && <PlaceDetailSheet place={selectedPlace} onClose={() => setSelectedPlace(null)} />}
      {addPlaceOpen && (
        <AddPlaceModal
          courseId={courseId}
          day={day}
          onClose={() => setAddPlaceOpen(false)}
          onAdded={(overBudget) => setOverBudgetDay(overBudget ? day.day_index : null)}
        />
      )}
    </div>
  );
}
