import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTrip } from "../hooks/useTrip";
import MapPin from "../components/MapPin";
import { hhmm } from "../utils/format";

const PIN_POSITIONS = [
  { top: "18%", left: "55%" },
  { top: "30%", left: "72%" },
  { top: "48%", left: "62%" },
  { top: "40%", left: "38%" },
  { top: "58%", left: "25%" },
  { top: "70%", left: "48%" },
  { top: "80%", left: "68%" },
  { top: "22%", left: "20%" },
];

export default function MapPage() {
  const { id } = useParams<{ id: string }>();
  const { data: trip, isLoading, isError } = useTrip(id);
  const [tab, setTab] = useState<"map" | "timeline">("map");

  if (isLoading) {
    return (
      <div className="state-panel">
        <div className="spinner" />
        <span className="serif">지도를 불러오는 중이에요</span>
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="state-panel">
        <span className="serif">코스를 찾을 수 없어요</span>
        <Link className="btn-primary" to="/builder">
          다시 만들기 →
        </Link>
      </div>
    );
  }

  const allItems = trip.days.flatMap((d) => d.items);
  const totalStay = allItems.reduce((s, it) => s + it.stay_min, 0);
  const totalTravel = allItems.reduce((s, it) => s + (it.travel_min_from_prev ?? 0), 0);

  return (
    <div>
      <div className="crumb">
        <Link to="/">홈</Link> / <Link to={`/trip/${id}`}>코스 상세</Link> / 지도
      </div>
      <header className="page-head wrap">
        <div className="page-eyebrow">MAP</div>
        <h1 className="page-title">코스 지도</h1>
        <p className="page-sub">
          {trip.total_days}일 코스 · 총 {allItems.length}곳 · 체류 {Math.round(totalStay / 60)}h {totalStay % 60}m · 이동{" "}
          {totalTravel}분
        </p>
      </header>

      <div className="wrap" style={{ paddingTop: 20 }}>
        <div className="day-tabs">
          <button type="button" className={`day-tab${tab === "map" ? " active" : ""}`} onClick={() => setTab("map")}>
            지도
          </button>
          <button
            type="button"
            className={`day-tab${tab === "timeline" ? " active" : ""}`}
            onClick={() => setTab("timeline")}
          >
            타임라인
          </button>
        </div>

        {tab === "map" ? (
          <>
            <div className="map-legend">
              <span>🔵 출발지</span>
              <span>🟢 방문지</span>
              <span>🟠 숙소</span>
              <span>🔴 도착지</span>
            </div>
            <div className="map-placeholder big">
              {allItems.slice(0, 8).map((item, i) => (
                <MapPin key={item.place.content_id} place={item.place} style={PIN_POSITIONS[i]} />
              ))}
            </div>
            <p className="side-note" style={{ marginTop: 12 }}>
              지도 자체는 아직 카카오맵 SDK가 아니라 미리보기예요. 마커를 누르면 카카오맵에서 그 장소를 바로 열 수
              있어요.
            </p>
          </>
        ) : (
          <div style={{ maxWidth: 640 }}>
            {trip.days.map((day) => (
              <div key={day.day_index}>
                {trip.days.length > 1 && <div className="day-heading serif">Day {day.day_index}</div>}
                <div className="timeline">
                  {day.items.map((item, idx) => (
                    <div className="tl-item" key={item.order}>
                      <div className="tl-dot mono">{idx + 1}</div>
                      <div className="tl-card">
                        <div className="tl-top">
                          <div className="tl-title">{item.place.title}</div>
                          <div className="tl-stay mono">{hhmm(item.arrive_at)} 도착</div>
                        </div>
                        <div className="tl-desc">{item.place.overview}</div>
                      </div>
                      {idx < day.items.length - 1 && (
                        <div className="tl-transit">
                          <span className="line" />
                          {item.place.title} → {day.items[idx + 1].place.title} · 차량{" "}
                          {day.items[idx + 1].travel_min_from_prev ?? 0}분
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sticky-actions">
        <Link className="btn-outline" to={`/trip/${id}`}>
          타임라인으로
        </Link>
        <Link className="btn-primary" to={`/trip/${id}/edit`}>
          코스 편집
        </Link>
      </div>
    </div>
  );
}
