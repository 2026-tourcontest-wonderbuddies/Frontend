import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import MapPin from "../components/MapPin";
import KakaoMap, { type KakaoMapPoint } from "../components/KakaoMap";
import { kakaoPlaceUrl } from "../utils/kakao";
import { courseSummaryText, useSavedCourses, useSavedPlaces } from "../store/saved";

const PIN_POSITIONS = [
  { top: "20%", left: "58%" },
  { top: "35%", left: "30%" },
  { top: "50%", left: "70%" },
  { top: "62%", left: "45%" },
  { top: "75%", left: "22%" },
  { top: "28%", left: "80%" },
];

/** [백엔드 연결 이전] 저장 목록은 localStorage 에만 있다. src/store/saved.ts 참고. */
export default function SavedMapPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"places" | "courses">("places");
  const places = useSavedPlaces(user?.id);
  const courses = useSavedCourses(user?.id);

  if (!user) {
    return (
      <div className="state-panel">
        <span className="serif">로그인이 필요해요</span>
        <p>저장함은 로그인한 뒤에 볼 수 있어요.</p>
        <Link className="btn-primary" to="/login">
          로그인하러 가기 →
        </Link>
      </div>
    );
  }

  const placePoints: KakaoMapPoint[] = places.map((sp) => ({
    id: sp.id,
    title: sp.place.title,
    latitude: sp.place.latitude,
    longitude: sp.place.longitude,
    label: "♥",
  }));

  // 코스 마커는 그 코스의 첫 장소를 대표 좌표로 삼는다.
  const coursePoints: KakaoMapPoint[] = courses.flatMap((sc) =>
    sc.first_place
      ? [{ id: sc.id, title: sc.title, latitude: sc.first_place.latitude, longitude: sc.first_place.longitude }]
      : [],
  );

  return (
    <div className="wrap" style={{ padding: "40px 32px 90px" }}>
      <div className="crumb" style={{ padding: 0, marginBottom: 20 }}>
        <Link to="/saved">저장 목록으로 돌아가기</Link>
      </div>
      <h1 className="page-title">저장 지도 보기</h1>

      <div className="nocon-banner" style={{ marginTop: 12 }}>
        ⚠ 백엔드 미연동 — 저장 API가 아직 서버에 없어요. 이 지도에 찍히는 건 이 브라우저에 저장된
        목록뿐이에요.
      </div>

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

      {tab === "places" ? (
        <>
          <KakaoMap
            points={placePoints}
            fallback={
              <div className="map-placeholder big">
                {places.slice(0, 6).map((sp, i) => (
                  <MapPin key={sp.id} place={sp.place} style={PIN_POSITIONS[i]} />
                ))}
              </div>
            }
          />
          <div className="saved-list" style={{ marginTop: 20 }}>
            {places.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>저장한 장소가 없어요.</p>}
            {places.map((sp) => (
              <div className="saved-row" key={sp.id}>
                <div>
                  <div className="saved-row-title">📍 {sp.place.title}</div>
                  <div className="saved-row-sub mono">
                    {sp.place.address} · {sp.place.content_type_name}
                  </div>
                </div>
                <a
                  className="btn-outline"
                  href={kakaoPlaceUrl(sp.place)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flexShrink: 0 }}
                >
                  카카오맵 ↗
                </a>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <KakaoMap
            points={coursePoints}
            fallback={
              <div className="map-placeholder big">
                {courses.slice(0, 6).map((sc, i) =>
                  sc.first_place ? (
                    <MapPin key={sc.id} place={sc.first_place} style={PIN_POSITIONS[i]} label={sc.title} />
                  ) : (
                    <div className="map-pin" key={sc.id} style={PIN_POSITIONS[i]} title={sc.title} />
                  ),
                )}
              </div>
            }
          />
          <div className="saved-list" style={{ marginTop: 20 }}>
            {courses.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>저장한 코스가 없어요.</p>}
            {courses.map((sc) => (
              <Link className="saved-row saved-row-link" key={sc.id} to={`/trip/${sc.course_id}`}>
                <div>
                  <div className="saved-row-title">🗺️ {sc.title}</div>
                  <div className="saved-row-sub mono">{courseSummaryText(sc)}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
