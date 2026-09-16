import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCourse } from "../hooks/useCourses";
import { useAuth } from "../auth/AuthContext";
import { useSavedCourses, useToggleSavedCourse } from "../hooks/useSavedCourses";
import { PRIORITY_LABELS } from "../api/types";
import { dayCaseLabel, dayDateLabel, hhmm, slotLabel } from "../utils/format";
import type { PlaceSummary } from "../api/types";
import {
  courseItems,
  courseLodging,
  courseStartIso,
  courseStats,
  dayAirport,
  dayLodgingStart,
  diffMin,
} from "../utils/course";
import PlaceDetailSheet from "../components/PlaceDetailSheet";

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
        <div>
          <div className="section-label">TIMELINE</div>
          <div className="section-title serif">시간 순서대로 보는 코스</div>

          <div className="day-summary mono" style={{ margin: "10px 0 16px", color: "var(--ink-soft)" }}>
            {startIso ? `${dayDateLabel(startIso, day.day_index)} · ` : ""}
            {dayStart && dayEnd
              ? `${hhmm(dayStart)}–${hhmm(dayEnd)} · ${day.items.length}곳 방문`
              : "방문지 없음"}
          </div>

          {course.days.length > 1 && (
            <div className="day-tabs day-tabs-full">
              {course.days.map((d, i) => (
                <button
                  key={d.day_index}
                  type="button"
                  className={`day-tab${i === dayIdx ? " active" : ""}`}
                  aria-pressed={i === dayIdx}
                  onClick={() => setDayIdx(i)}
                >
                  <span className="day-tab-case">{dayCaseLabel(d.day_case)}</span>
                  <span className="day-tab-main">DAY {d.day_index}</span>
                </button>
              ))}
            </div>
          )}

          <div className="day-subheading mono">
            가용 {day.avail_hours}시간 · 목표 {day.target_slots}곳
          </div>
          {day.items.length === 0 && (
            <div className="day-subheading mono">
              이 조건에 맞는 장소를 더 찾지 못했어요. 권역을 넓혀보세요.
            </div>
          )}
          <div className="timeline">
            {airport.depart && (
              <div className="tl-item">
                <div className="tl-dot mono">{hhmm(airport.depart)}</div>
                <div className="tl-card tl-airport">
                  <div className="tl-title">🛬 제주공항 밖 출발 (수하물 수령 완료)</div>
                </div>
                {airport.departTravelMin ? (
                  <div className="tl-transit">
                    <span className="line" />
                    🚗 차량 {airport.departTravelMin}분 이동
                  </div>
                ) : null}
              </div>
            )}

            {lodgingStart.time && (
              <div className="tl-item">
                <div className="tl-dot mono">{hhmm(lodgingStart.time)}</div>
                <div className="tl-card tl-lodging">
                  <div className="tl-title">🛏 {lodgingStart.lodging?.title} 출발</div>
                </div>
                {lodgingStart.travelMin ? (
                  <div className="tl-transit">
                    <span className="line" />
                    🚗 차량 {lodgingStart.travelMin}분 이동
                  </div>
                ) : null}
              </div>
            )}

            {day.items.map((item, idx) => (
              <div className="tl-item" key={item.id}>
                <div className="tl-dot mono">{hhmm(item.arrive_at)}</div>
                <div
                  className="tl-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPlace(item.place)}
                >
                  <div className="tl-top">
                    <div className="tl-title">
                      {item.place.title}
                      {slotLabel(item.slot_type) && (
                        <span className="meta-chip mono" style={{ marginLeft: 8 }}>
                          {slotLabel(item.slot_type)}
                        </span>
                      )}
                      {item.hours_uncertain && (
                        <span className="meta-chip mono" style={{ marginLeft: 8 }}>
                          운영시간 확인 필요
                        </span>
                      )}
                    </div>
                    <div className="tl-stay mono">체류 {diffMin(item.arrive_at, item.depart_at)}분</div>
                  </div>
                  <div className="tl-desc">
                    {item.place.overview || `${item.place.content_type_name} · ${item.place.address}`}
                  </div>
                </div>
                {idx < day.items.length - 1 ? (
                  <div className="tl-transit">
                    <span className="line" />
                    🚗 차량 {day.items[idx + 1].travel_min_from_prev ?? 0}분 이동
                  </div>
                ) : airport.arriveTravelMin ? (
                  <div className="tl-transit">
                    <span className="line" />
                    🚗 차량 {airport.arriveTravelMin}분 이동
                  </div>
                ) : day.lodging && day.travel_to_next_min != null ? (
                  <div className="tl-transit">
                    <span className="line" />
                    🚗 차량 {day.travel_to_next_min}분 이동
                  </div>
                ) : null}
              </div>
            ))}

            {airport.arrive && (
              <div className="tl-item">
                <div className="tl-dot mono">{hhmm(airport.arrive)}</div>
                <div className="tl-card tl-airport">
                  <div className="tl-title">🛫 제주공항 도착 (탑승 수속)</div>
                </div>
              </div>
            )}

            {day.lodging && (
              <div className="tl-item">
                <div className="tl-dot mono">{lodgingArriveAt}</div>
                <div className="tl-card tl-lodging">
                  <div className="tl-top">
                    <div className="tl-title">
                      🛏 {day.lodging.title}
                      <span className="meta-chip mono" style={{ marginLeft: 8 }}>
                        {day.lodging.category}
                      </span>
                    </div>
                    <div className="tl-stay mono">{day.lodging.price_hint}</div>
                  </div>
                  <div className="tl-desc">
                    {day.lodging.address}
                    {day.lodging.room_type ? ` · ${day.lodging.room_type}` : ""}
                    {day.lodging.check_in_time
                      ? ` · 체크인 ${day.lodging.check_in_time}부터`
                      : ""}
                    {day.lodging.check_out_time
                      ? ` · 체크아웃 ${day.lodging.check_out_time}`
                      : ""}
                  </div>
                  {day.lodging.tripcom_link && (
                    <a
                      href={day.lodging.tripcom_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="side-note"
                      style={{ display: "inline-block", marginTop: 6 }}
                    >
                      트립닷컴에서 요금 확인 ↗
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside>
          <div className="side-card">
            <h4>코스 지도</h4>
            <Link to={`/trip/${id}/map`} style={{ display: "block" }}>
              <div className="map-placeholder">
                {allItems.slice(0, 8).map((item, i) => (
                  <div className="map-pin" key={item.id} style={PIN_POSITIONS[i]} />
                ))}
              </div>
            </Link>
            <div className="side-note">
              {allItems.length}개 스팟 · <Link to={`/trip/${id}/map`}>전체 지도 보기 →</Link>
            </div>
          </div>
        </aside>
      </div>

      <div className="sticky-actions">
        <Link className="btn-primary" to={`/trip/${id}/map`}>
          지도에서 열기
        </Link>
      </div>

      {selectedPlace && <PlaceDetailSheet place={selectedPlace} onClose={() => setSelectedPlace(null)} />}
    </div>
  );
}
