import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useAddCourseItem,
  useCourse,
  useDeleteCourseItem,
  useModifyCourse,
  useReorderCourseItems,
} from "../hooks/useCourses";
import { usePlaceSuggestions } from "../hooks/usePlaceSearch";
import { useAuth } from "../auth/AuthContext";
import { useSavedCourses, useToggleSavedCourse } from "../hooks/useSavedCourses";
import { ApiError } from "../api/client";
import { PRIORITY_LABELS } from "../api/types";
import { dayCaseLabel, dayDateLabel, hhmm, placeMetaLine, priceHintMain } from "../utils/format";
import type { CourseDay, CourseItem, PlaceSummary, SearchPlace } from "../api/types";
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

/**
 * .timeline::before 의 그라데이션 정지점. CSS와 같은 값이어야 한다 —
 * 한쪽만 바꾸면 링이 선과 다른 색이 된다.
 */
const LINE_STOPS: [number, string][] = [
  [0, "--morning"],
  [0.38, "--midday"],
  [0.72, "--sunset"],
  [1, "--night"],
];

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const h = hex.trim().replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

/** 선의 세로 비율 t(0~1) 지점 색. 브라우저가 선을 섞는 방식(정지점 사이 선형 보간) 그대로다. */
function lineColorAt(t: number, stops: [number, Rgb][]): string {
  const x = Math.min(1, Math.max(0, t));
  let i = 1;
  while (i < stops.length - 1 && x > stops[i][0]) i++;
  const [p0, c0] = stops[i - 1];
  const [p1, c1] = stops[i];
  const k = p1 === p0 ? 0 : (x - p0) / (p1 - p0);
  return `rgb(${c0.map((c, j) => Math.round(c + (c1[j] - c) * k)).join(",")})`;
}

/**
 * 각 링 색을 그 높이의 선 색으로 맞춘다. 선은 타임라인 전체 높이에 걸친
 * 그라데이션이라, 카드 높이가 달라지면 같은 장소라도 색이 달라진다 — 그래서
 * 시각(hour)으로 고르지 않고 실제 위치를 재서 뽑는다.
 */
function paintTimelineDots(el: HTMLElement | null) {
  if (!el) return;
  const root = getComputedStyle(document.documentElement);
  const stops = LINE_STOPS.map(([at, name]) => [at, hexToRgb(root.getPropertyValue(name))] as [number, Rgb]);
  const box = el.getBoundingClientRect();
  // 선은 위아래로 6px씩 들여서 그린다(.timeline::before의 top/bottom).
  const lineTop = box.top + 6;
  const lineHeight = box.height - 12;
  if (lineHeight <= 0) return;
  el.querySelectorAll<HTMLElement>(".tl-dot").forEach((dot) => {
    const r = dot.getBoundingClientRect();
    dot.style.setProperty("--dot", lineColorAt((r.top + r.height / 2 - lineTop) / lineHeight, stops));
  });
}

function TlDot({ time }: { time: string }) {
  return <div className="tl-dot mono">{time}</div>;
}

/**
 * 식사 카드는 서버 재계산에서 시각이 시간대에 고정돼(slot_type RESTAURANT) 순서를 바꿔도 시각이 안 따라온다.
 * 그래서 식사 카드 자신도, 식사 카드를 타고 넘는 이웃도 그 방향으로는 못 옮기게 막는다.
 */
function mealMoveBlocked(items: CourseItem[], idx: number, direction: -1 | 1) {
  return items[idx].slot_type === "RESTAURANT" || items[idx + direction]?.slot_type === "RESTAURANT";
}

/** 서버가 400 { error }로 주는 사용자용 실패 사유(예: 이동시간 계산 불가 장소). 없으면 fallback. */
function serverErrorText(err: unknown, fallback: string): string {
  const text = err instanceof ApiError ? (err.body as { error?: unknown } | null)?.error : null;
  return typeof text === "string" && text ? text : fallback;
}

/** 편집이 실패했거나 가용 시간을 넘었을 때 타임라인 위에 띄우는 배너. */
function EditBanner({ title, detail, onClose }: { title: string; detail: string; onClose: () => void }) {
  return (
    <div className="edit-banner" role="status">
      <div className="edit-banner-text">
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      <button type="button" className="btn-outline edit-banner-close" onClick={onClose}>
        닫기
      </button>
    </div>
  );
}

/** 검색 자동완성(usePlaceSuggestions)에서 고른 장소를 그 날 맨 끝에 추가한다. */
function AddPlaceModal({
  courseId,
  day,
  onClose,
  onAdded,
  onFailed,
}: {
  courseId: number;
  day: CourseDay;
  onClose: () => void;
  /** 추가에 성공했을 때, 서버가 알려준 가용시간 초과 여부와 함께 부른다. */
  onAdded: (overBudget: boolean) => void;
  /** 추가에 실패했을 때, 사용자에게 보여줄 사유와 함께 부른다. */
  onFailed: (reason: string) => void;
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
        onError: (err) => {
          onFailed(serverErrorText(err, "장소를 추가하지 못했어요. 잠시 후 다시 시도해 주세요."));
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

/**
 * 자연어로 코스 수정을 요청하는 대화 패널(명세 8번). 응답은 결과 설명 문구뿐이라,
 * 훅이 코스 상세를 재조회해서 옆 타임라인이 알아서 바뀐다.
 */
function ChatModifyPanel({ courseId, day, onClose }: { courseId: number; day: CourseDay; onClose: () => void }) {
  const [log, setLog] = useState<{ me: boolean; text: string }[]>([]);
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLDivElement | null>(null);
  const modify = useModifyCourse();

  // 서버는 장소를 이름으로 찾는다(정확히 일치해야 한다). 칩이 그 날의 실제 이름을
  // 그대로 넣어 보내므로, 사용자가 이름을 잘못 적어 조용히 무시되는 일이 없다.
  const places = day.items.map((it) => it.place.title);
  const suggestions = [
    { label: "처음부터 다시", message: "처음부터 다시 추천해줘" },
    ...places.map((title) => ({ label: `${title} 빼기`, message: `${title} 빼줘` })),
  ];

  // 모바일은 이 패널이 타임라인 아래에 붙어서, 열어도 화면 밖이라 아무 일도 안 난 것처럼 보인다.
  useEffect(() => {
    if (window.matchMedia("(max-width:960px)").matches) {
      logRef.current?.closest(".chat-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // 새 말풍선이 접힌 채로 남지 않게 항상 마지막까지 내린다.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log.length, modify.isPending]);

  function send(text: string) {
    const raw = text.trim();
    if (!raw || modify.isPending) return;
    setLog((l) => [...l, { me: true, text: raw }]);
    setDraft("");
    modify.mutate(
      { courseId, rawMessage: raw },
      {
        onSuccess: (res) => setLog((l) => [...l, { me: false, text: res.message }]),
        onError: (err) =>
          setLog((l) => [
            ...l,
            { me: false, text: serverErrorText(err, "수정 요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.") },
          ]),
      },
    );
  }

  return (
    <div className="side-card chat-panel">
      <div className="chat-panel-head">
        <h4>코스에 요청하기</h4>
        <button type="button" className="chat-panel-close" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </div>

      <div className="chat-log" ref={logRef}>
        <div className="chat-bubble">
          DAY {day.day_index}에 {places.length}곳이 있어요. 뺄 곳을 고르면 다른 곳으로 바꿔드려요.
        </div>
        {log.map((line, i) => (
          <div key={i} className={`chat-bubble${line.me ? " me" : ""}`}>
            {line.text}
          </div>
        ))}
        {modify.isPending && <div className="chat-bubble pending">코스를 다시 짜는 중이에요…</div>}
      </div>

      <div className="chat-chips">
        {suggestions.map(({ label, message }) => (
          <button
            key={label}
            type="button"
            className="chip"
            disabled={modify.isPending}
            onClick={() => send(message)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="chat-input-row">
        <input
          value={draft}
          disabled={modify.isPending}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(draft)}
          placeholder={places[0] ? `${places[0]} 그대로 둬` : "바꾸고 싶은 점을 적어주세요"}
        />
        <button
          type="button"
          className="chat-send"
          disabled={modify.isPending || !draft.trim()}
          onClick={() => send(draft)}
          aria-label="요청 보내기"
        >
          ↑
        </button>
      </div>
    </div>
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
  const [chatModifyOpen, setChatModifyOpen] = useState(false);
  // 모바일에서 편집·챗봇을 담는 하단 펼침 버튼. 웹에서는 .fab-actions가 아예 숨겨진다.
  const [fabOpen, setFabOpen] = useState(false);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  // 편집 모드. 꺼져 있으면 순서변경·삭제·추가 버튼을 아예 감춘다.
  const [editing, setEditing] = useState(false);
  // 마우스를 올린 타임라인 카드의 item.id. 우측 지도에서 그 장소 마커를 강조한다.
  const [hoverItemId, setHoverItemId] = useState<number | null>(null);
  // 편집 뒤 서버가 "가용시간 초과"라고 알려준 Day. 다른 Day로 옮기거나 다음 편집 결과가 오면 바뀐다.
  const [overBudgetDay, setOverBudgetDay] = useState<number | null>(null);
  // 삭제 확인 대상. 브라우저 confirm 대신 SavedPage와 같은 Modal을 쓴다.
  const [deleteTarget, setDeleteTarget] = useState<CourseItem | null>(null);
  // 지금 편집 요청이 걸려 있는 카드. 그 카드에만 진행 표시를 띄우고, 그동안 다른 카드 버튼은 막는다.
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  // 편집이 실패한 이유. 타임라인 위 배너로 보여준다.
  const [editError, setEditError] = useState<string | null>(null);
  const reorderItems = useReorderCourseItems();
  const deleteItem = useDeleteCourseItem();

  // 링 위치가 바뀌는 조건마다 다시 칠한다. hover 같은 잦은 렌더까지 물면
  // 마우스를 움직일 때마다 레이아웃을 재는 꼴이라, 높이가 변하는 것만 넣는다.
  // 글꼴 로딩처럼 렌더 뒤에 늦게 변하는 높이는 ResizeObserver가 맡는다.
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    paintTimelineDots(el);
    const ro = new ResizeObserver(() => paintTimelineDots(el));
    ro.observe(el);
    return () => ro.disconnect();
  }, [course, dayIdx, editing, busyItemId]);

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
    setBusyItemId(day.items[idx].id);
    reorderItems.mutate(
      { courseId, dayIndex: day.day_index, itemIds: ids },
      {
        onSuccess: (res) => {
          setEditError(null);
          setOverBudgetDay(res.over_budget ? day.day_index : null);
        },
        onError: (err) => setEditError(serverErrorText(err, "순서를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.")),
        onSettled: () => setBusyItemId(null),
      },
    );
  }

  function removeItem(item: CourseItem) {
    setDeleteTarget(null);
    setBusyItemId(item.id);
    // 장소가 줄면 시간이 늘지 않으므로 초과 경고는 걷는다.
    deleteItem.mutate(
      { courseId, itemId: item.id },
      {
        onSuccess: () => {
          setEditError(null);
          setOverBudgetDay(null);
        },
        onError: (err) => setEditError(serverErrorText(err, "장소를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.")),
        onSettled: () => setBusyItemId(null),
      },
    );
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

  // 같은 버튼이 웹에서는 Day 탭 오른쪽 한 줄에, 모바일에서는 Day 탭 위(지도·저장)와
  // 하단 펼침 버튼(편집·챗봇)으로 나뉘어 들어간다. 보이는 자리는 CSS가 고른다.
  const editBtn = (
    <button
      type="button"
      className="btn-outline"
      aria-pressed={editing}
      style={{ color: "var(--sunset)", borderColor: "var(--sunset)" }}
      onClick={() => {
        setEditing((v) => !v);
        setFabOpen(false);
      }}
    >
      {editing ? "✓ 편집 완료" : "✎ 코스 편집"}
    </button>
  );
  const chatBtn = (
    <button
      type="button"
      className="btn-outline"
      aria-pressed={chatModifyOpen}
      onClick={() => {
        setChatModifyOpen((v) => !v);
        setFabOpen(false);
      }}
    >
      ✦ 챗봇 수정
    </button>
  );
  // compact는 모바일 줄. 폭이 좁아 글자를 떼고 테두리만 남긴다.
  const mapBtn = (compact: boolean) => (
    <Link className={compact ? "btn-outline" : "btn-primary"} to={`/trip/${id}/map`}>
      {compact ? "지도" : "지도에서 열기"}
    </Link>
  );
  const saveBtn = (compact: boolean) =>
    user ? (
      <button
        type="button"
        className="btn-outline"
        aria-pressed={isSaved}
        // 글자가 "저장함"(또는 하트뿐)이라 무슨 동작인지 읽어줄 말이 없다.
        aria-label="저장함에 담기"
        disabled={toggleSaved.isPending}
        onClick={() => toggleSaved.mutate({ courseId, saved: isSaved })}
      >
        {compact ? (isSaved ? "♥" : "♡") : isSaved ? "♥ 저장됨" : "♡ 저장함"}
      </button>
    ) : null;

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
        {/* 고정 헤더 바깥이라 스크롤하면 Day 탭만 남고 이 줄은 같이 올라간다. */}
        <div className="head-actions-mobile">
          {mapBtn(true)}
          {saveBtn(true)}
        </div>

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
                      setEditError(null);
                    }}
                  >
                    <span className="day-tab-case">{dayCaseLabel(d.day_case)}</span>
                    <span className="day-tab-main">DAY {d.day_index}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="actions">
              {editBtn}
              {chatBtn}
              {mapBtn(false)}
              {saveBtn(false)}
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
            {editError ? (
              <EditBanner
                title="코스를 수정하지 못했어요"
                detail={editError}
                onClose={() => setEditError(null)}
              />
            ) : overBudgetDay === day.day_index ? (
              <EditBanner
                title={`DAY ${day.day_index} 일정이 가용 시간을 넘쳤어요`}
                detail={`가용 ${day.avail_hours}시간을 넘었어요. 장소를 빼거나 체류가 짧은 곳으로 바꾸면 맞출 수 있어요.`}
                onClose={() => setOverBudgetDay(null)}
              />
            ) : null}
            <div className="timeline" ref={timelineRef}>
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
                <div className="tl-row">
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
                {editing && (
                <div className="edit-item-actions">
                  {busyItemId === item.id ? (
                    <span className="mono" role="status" style={{ color: "var(--ink-soft)" }}>
                      {deleteItem.isPending ? "삭제 중…" : "이동 중…"}
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={idx === 0 || busyItemId !== null || mealMoveBlocked(day.items, idx, -1)}
                        onClick={() => moveItem(idx, -1)}
                      >
                        ↑ 위로
                      </button>
                      <button
                        type="button"
                        disabled={
                          idx === day.items.length - 1 ||
                          busyItemId !== null ||
                          mealMoveBlocked(day.items, idx, 1)
                        }
                        onClick={() => moveItem(idx, 1)}
                      >
                        ↓ 아래로
                      </button>
                      <button type="button" disabled={busyItemId !== null} onClick={() => setDeleteTarget(item)}>
                        ✕ 삭제
                      </button>
                      {item.slot_type === "RESTAURANT" && (
                        <span className="mono" style={{ color: "var(--ink-soft)" }}>
                          식사 시각 고정
                        </span>
                      )}
                    </>
                  )}
                </div>
                )}
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
                  <div className="tl-title">🛫 제주공항 도착 (탑승 수속 준비)</div>
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
                    <div className="tl-stay mono">{priceHintMain(day.lodging.price_hint)}</div>
                  </div>
                  <div className="tl-lodging-meta">
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
                        style={{ color: "#E07B1A" }}
                      >
                        트립닷컴에서 요금 확인 ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

            {editing && (
              <button
                type="button"
                className="btn-outline"
                style={{ marginTop: 16, padding: "9px 16px", fontSize: 12.5 }}
                onClick={() => setAddPlaceOpen(true)}
              >
                + 이 날에 장소 추가
              </button>
            )}
        </div>

        <aside>
          {chatModifyOpen && (
            <ChatModifyPanel courseId={courseId} day={day} onClose={() => setChatModifyOpen(false)} />
          )}
          <div className="side-card">
            <div className="side-card-head">
              <h4>코스 지도</h4>
              <div className="side-note">
                DAY {day.day_index} · {day.items.length}개 스팟 ·{" "}
                <Link to={`/trip/${id}/map`}>전체 지도 보기 →</Link>
              </div>
            </div>
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
          </div>
        </aside>
      </div>

      {fabOpen && <div className="fab-backdrop" onClick={() => setFabOpen(false)} />}
      <div className="fab-actions">
        {fabOpen && (
          <div className="fab-menu">
            {editBtn}
            {chatBtn}
          </div>
        )}
        <button
          type="button"
          className="fab-toggle"
          aria-expanded={fabOpen}
          aria-label="코스 수정 메뉴"
          onClick={() => setFabOpen((v) => !v)}
        >
          {fabOpen ? "✕" : "✎"}
        </button>
      </div>

      {selectedPlace && <PlaceDetailSheet place={selectedPlace} onClose={() => setSelectedPlace(null)} />}
      {addPlaceOpen && (
        <AddPlaceModal
          courseId={courseId}
          day={day}
          onClose={() => setAddPlaceOpen(false)}
          onAdded={(overBudget) => {
            setEditError(null);
            setOverBudgetDay(overBudget ? day.day_index : null);
          }}
          onFailed={setEditError}
        />
      )}
      {deleteTarget && (
        <Modal title="장소 삭제" onClose={() => setDeleteTarget(null)}>
          <p style={{ marginBottom: 20 }}>{deleteTarget.place.title}을(를) 이 코스에서 삭제할까요?</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setDeleteTarget(null)}>
              취소
            </button>
            <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={() => removeItem(deleteTarget)}>
              삭제
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
