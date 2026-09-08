import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTrip } from "../hooks/useTrip";
import { PURPOSE_LABELS, REGION_LABELS } from "../api/types";
import { dayDateLabel, hhmm, slotLabel } from "../utils/format";
import type { ItineraryDayDTO, PlaceDTO, TripResponse } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { useSaveCourse } from "../hooks/useSaved";
import Modal from "../components/Modal";
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

function totalHours(days: ItineraryDayDTO[]): number {
  return Math.round(days.reduce((sum, d) => sum + d.avail_hours, 0));
}

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: trip, isLoading, isError } = useTrip(id);
  const { isAuthenticated } = useAuth();
  const saveCourse = useSaveCourse();
  const [selectedPlace, setSelectedPlace] = useState<PlaceDTO | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="state-panel">
        <div className="spinner" />
        <span className="serif">코스를 불러오는 중이에요</span>
        <p>가장 잘 맞는 순서로 정리하고 있어요, 잠시만 기다려주세요.</p>
      </div>
    );
  }

  if (isError || !trip) {
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

  const firstDay = trip.days[0];
  const allItems = trip.days.flatMap((d) => d.items);
  const purposeText = PURPOSE_LABELS[trip.request.purpose_main];
  const regionText = trip.request.region_preference ? REGION_LABELS[trip.request.region_preference] : "제주 전역";
  const titleFirst = allItems[0]?.place.title ?? "";
  const titleLast = allItems[allItems.length - 1]?.place.title ?? "";
  const courseTitle = titleLast && titleFirst !== titleLast ? `${titleFirst}에서 ${titleLast}까지` : titleFirst;

  function handleSaveClick() {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/trip/${id}` } });
      return;
    }
    saveCourse.reset();
    setShowSaveConfirm(true);
  }

  function confirmSave(t: TripResponse) {
    saveCourse.mutate({ trip: t, title: courseTitle });
  }

  return (
    <div>
      <div className="crumb">
        <Link to="/">홈</Link> / <Link to="/builder">코스 매칭</Link> / {regionText}
      </div>

      <header className="result-header">
        <div>
          <div className="match-badge">
            ✓ {trip.total_days}일 코스 · {purposeText} 조건과 매칭됨
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
            <span className="meta-chip mono">⏱ 총 {totalHours(trip.days)}시간</span>
            <span className="meta-chip mono">📅 {trip.total_days}일 일정</span>
            {firstDay && <span className="meta-chip mono">🎯 목표 {firstDay.target_slots}곳/일</span>}
          </div>
          <div className="actions">
            <button type="button" className="btn-primary" onClick={handleSaveClick}>
              이 코스 저장하기
            </button>
            <Link className="btn-outline" to={`/trip/${id}/map`}>
              지도에서 열기
            </Link>
            <Link className="btn-outline" to={`/trip/${id}/edit`}>
              코스 편집
            </Link>
          </div>
        </div>
        <div>
          <div className="mini-dial-wrap">
            <div className="mini-dial" />
            <div className="mini-face" />
            {(firstDay?.items ?? []).slice(0, 8).map((item, i) => (
              <div
                key={item.order}
                className="mini-stop"
                style={{
                  transform: `translate(-50%,-50%) translate(${STOP_ANGLES[i].x}px,${STOP_ANGLES[i].y}px)`,
                }}
              />
            ))}
            <div className="mini-center">
              <div className="t">{regionText.split(" ")[0]}</div>
              <div className="s">
                {firstDay ? `${hhmm(firstDay.items[0]?.arrive_at ?? trip.request.start_datetime)} → ${hhmm(
                  firstDay.items[firstDay.items.length - 1]?.depart_at ?? trip.request.end_datetime,
                )}` : ""}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="best-time">
        <div className="wrap best-time-inner">
          <div className="best-time-label">
            이 코스, 언제 가면
            <br />
            가장 좋을까요?
          </div>
          <div className="months">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <div key={m} className={`month${[4, 5, 9, 10].includes(m) ? " best" : ""}`}>
                {m}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="main-detail wrap">
        <div>
          <div className="section-label">TIMELINE</div>
          <div className="section-title serif">시간 순서대로 보는 코스</div>

          {trip.days.map((day) => (
            <div key={day.day_index}>
              {trip.days.length > 1 && (
                <>
                  <div className="day-heading serif">
                    Day {day.day_index} · {dayDateLabel(trip.request.start_datetime, day.day_index)}
                  </div>
                  <div className="day-subheading mono">가용 {day.avail_hours}시간 · 목표 {day.target_slots}곳</div>
                </>
              )}
              {day.items.length === 0 && (
                <div className="day-subheading mono">이 조건에 맞는 장소를 더 찾지 못했어요. 권역을 넓혀보세요.</div>
              )}
              <div className="timeline">
                {day.items.map((item, idx) => (
                  <div className="tl-item" key={item.order}>
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
                        </div>
                        <div className="tl-stay mono">체류 {item.stay_min}분</div>
                      </div>
                      <div className="tl-desc">{item.place.overview || `${item.place.content_type_name} · ${item.place.address}`}</div>
                    </div>
                    {idx < day.items.length - 1 && (
                      <div className="tl-transit">
                        <span className="line" />
                        🚗 차량 {day.items[idx + 1].travel_min_from_prev ?? 0}분 이동
                      </div>
                    )}
                  </div>
                ))}

                {day.lodging && (
                  <div className="tl-item">
                    <div className="tl-dot mono">{day.lodging.check_in_time ?? "숙박"}</div>
                    <div className="tl-card tl-lodging">
                      <div className="tl-top">
                        <div className="tl-title">
                          🛏 {day.lodging.title}
                          <span className="meta-chip mono" style={{ marginLeft: 8 }}>
                            {day.lodging.small_category_name}
                          </span>
                        </div>
                        {day.lodging.price_per_night != null && (
                          <div className="tl-stay mono">
                            {Math.round(day.lodging.price_per_night / 10000)}만원/박
                          </div>
                        )}
                      </div>
                      <div className="tl-desc">
                        {day.lodging.address}
                        {day.lodging.cooking ? " · 취사 가능" : ""}
                        {day.lodging.parking ? " · 주차 가능" : ""}
                        {day.lodging.check_out_time ? ` · 체크아웃 ${day.lodging.check_out_time}` : ""}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <aside>
          <div className="side-card">
            <h4>코스 지도</h4>
            <Link to={`/trip/${id}/map`} style={{ display: "block" }}>
              <div className="map-placeholder">
                {allItems.slice(0, 8).map((item, i) => (
                  <div className="map-pin" key={item.place.content_id} style={PIN_POSITIONS[i]} />
                ))}
              </div>
            </Link>
            <div className="side-note">{allItems.length}개 스팟 · <Link to={`/trip/${id}/map`}>전체 지도 보기 →</Link></div>
          </div>
          <div className="side-card">
            <h4>함께 보면 좋은 코스</h4>
            <Link className="reco-item" to="/list" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="reco-thumb" />
              <div className="reco-text">
                <div className="rt">동문재래 야시장, 딱 4시간 코스</div>
                <div className="rm mono">밤 · 도보</div>
              </div>
            </Link>
            <Link className="reco-item" to="/list" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="reco-thumb" />
              <div className="reco-text">
                <div className="rt">협재 아침 바다에서 애월 밤 카페까지</div>
                <div className="rm mono">아침+밤 · 숙박 1회</div>
              </div>
            </Link>
          </div>
        </aside>
      </div>

      <div className="sticky-actions">
        <Link className="btn-outline" to={`/trip/${id}/map`}>
          지도에서 열기
        </Link>
        <button type="button" className="btn-primary" onClick={handleSaveClick}>
          이 코스 저장하기
        </button>
      </div>

      {selectedPlace && <PlaceDetailSheet place={selectedPlace} onClose={() => setSelectedPlace(null)} />}

      {showSaveConfirm && (
        <Modal title="코스를 저장하시겠습니까?" onClose={() => setShowSaveConfirm(false)}>
          <p style={{ marginBottom: 20 }}>저장한 코스는 저장 목록에서 다시 열 수 있습니다.</p>
          {saveCourse.isError && (
            <div className="form-error" style={{ marginBottom: 14 }}>
              저장에 실패했어요. 다시 시도해주세요.
            </div>
          )}
          {saveCourse.isSuccess ? (
            <div style={{ display: "flex", gap: 10 }}>
              <Link className="btn-outline" to="/saved" style={{ flex: 1, textAlign: "center" }}>
                저장 목록에서 확인
              </Link>
              <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={() => setShowSaveConfirm(false)}>
                닫기
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn-outline"
                style={{ flex: 1 }}
                onClick={() => setShowSaveConfirm(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => confirmSave(trip)}
                disabled={saveCourse.isPending}
              >
                {saveCourse.isPending ? "저장 중…" : "저장"}
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
