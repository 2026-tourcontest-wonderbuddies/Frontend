import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSavedCourses, useSavedPlaces } from "../hooks/useSaved";
import { useAuth } from "../auth/AuthContext";
import MapPin from "../components/MapPin";
import { commitTrip } from "../api/edit";
import { kakaoPlaceUrl } from "../utils/kakao";
import type { SavedCourseDTO } from "../api/types";

const PIN_POSITIONS = [
  { top: "20%", left: "58%" },
  { top: "35%", left: "30%" },
  { top: "50%", left: "70%" },
  { top: "62%", left: "45%" },
  { top: "75%", left: "22%" },
  { top: "28%", left: "80%" },
];

export default function SavedMapPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"places" | "courses">("places");
  const { data: places, isLoading: placesLoading } = useSavedPlaces(isAuthenticated);
  const { data: courses, isLoading: coursesLoading } = useSavedCourses(isAuthenticated);

  async function openCourse(course: SavedCourseDTO) {
    await commitTrip(course.trip.id, course.trip);
    navigate(`/trip/${course.trip.id}`);
  }

  const isLoading = tab === "places" ? placesLoading : coursesLoading;

  return (
    <div className="wrap" style={{ padding: "40px 32px 90px" }}>
      <div className="crumb" style={{ padding: 0, marginBottom: 20 }}>
        <Link to="/saved">저장 목록으로 돌아가기</Link>
      </div>
      <h1 className="page-title">저장 지도 보기</h1>

      <div className="day-tabs" style={{ marginTop: 20 }}>
        <button type="button" className={`day-tab${tab === "places" ? " active" : ""}`} onClick={() => setTab("places")}>
          장소
        </button>
        <button type="button" className={`day-tab${tab === "courses" ? " active" : ""}`} onClick={() => setTab("courses")}>
          코스
        </button>
      </div>

      <div className="map-legend">
        <span>📍 저장 장소</span>
        <span>🗺️ 저장 코스</span>
      </div>

      {isLoading ? (
        <div className="state-panel">
          <div className="spinner" />
        </div>
      ) : tab === "places" ? (
        <>
          <div className="map-placeholder big">
            {(places ?? []).slice(0, 6).map((sp, i) => (
              <MapPin key={sp.id} place={sp.place} style={PIN_POSITIONS[i]} />
            ))}
          </div>
          <div className="saved-list" style={{ marginTop: 20 }}>
            {(places ?? []).length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>저장한 장소가 없어요.</p>}
            {(places ?? []).map((sp) => (
              <div className="saved-row" key={sp.id}>
                <div>
                  <div className="saved-row-title">📍 {sp.place.title}</div>
                  <div className="saved-row-sub mono">
                    {sp.place.address} · {sp.place.content_type_name}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span className="meta-chip mono">운영 중</span>
                  <a className="btn-outline" href={kakaoPlaceUrl(sp.place)} target="_blank" rel="noopener noreferrer">
                    카카오맵 ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="map-placeholder big">
            {(courses ?? []).slice(0, 6).map((sc, i) => {
              // 코스 마커는 그 코스의 첫 장소를 대표로 가리킨다.
              const firstPlace = sc.trip.days[0]?.items[0]?.place;
              if (!firstPlace) return <div className="map-pin" key={sc.id} style={PIN_POSITIONS[i]} title={sc.title} />;
              return <MapPin key={sc.id} place={firstPlace} style={PIN_POSITIONS[i]} label={sc.title} />;
            })}
          </div>
          <div className="saved-list" style={{ marginTop: 20 }}>
            {(courses ?? []).length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>저장한 코스가 없어요.</p>}
            {(courses ?? []).map((sc) => {
              const spotCount = sc.trip.days.flatMap((d) => d.items).length;
              const hours = Math.round(sc.trip.days.reduce((s, d) => s + d.avail_hours, 0));
              return (
                <button type="button" className="saved-row saved-row-link" key={sc.id} onClick={() => openCourse(sc)}>
                  <div>
                    <div className="saved-row-title">🗺️ {sc.title}</div>
                    <div className="saved-row-sub mono">
                      {spotCount}곳 · 총 이동 {hours}시간
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
