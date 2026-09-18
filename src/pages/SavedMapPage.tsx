import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import MapPin from "../components/MapPin";
import KakaoMap, { type KakaoMapPoint } from "../components/KakaoMap";
import { kakaoPlaceUrl } from "../utils/kakao";
import { useSavedPlaces } from "../hooks/useSavedPlaces";
import { useSavedCourses } from "../hooks/useSavedCourses";
import { useCourseDetails } from "../hooks/useCourses";
import { courseItems, courseStats, courseTitle } from "../utils/course";

const PIN_POSITIONS = [
  { top: "20%", left: "58%" },
  { top: "35%", left: "30%" },
  { top: "50%", left: "70%" },
  { top: "62%", left: "45%" },
  { top: "75%", left: "22%" },
  { top: "28%", left: "80%" },
];

/** 장소·코스 모두 서버 저장분이다(GET /api/places/saved/, GET /api/courses/saved/). */
export default function SavedMapPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"places" | "courses">("places");
  const { data: places = [] } = useSavedPlaces(Boolean(user));
  const { data: savedCourses = [] } = useSavedCourses(Boolean(user));
  // 목록 응답에는 좌표·이름이 없어 상세(명세 4번)로 채운다(CoursesPage와 같은 방식).
  const { courses } = useCourseDetails(savedCourses.map((c) => c.id));

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

  const placePoints: KakaoMapPoint[] = places.map((place) => ({
    id: place.content_id,
    title: place.title,
    latitude: place.latitude,
    longitude: place.longitude,
    label: "♥",
  }));

  // 코스 마커는 그 코스의 첫 장소를 대표 좌표로 삼는다.
  const coursePoints: KakaoMapPoint[] = courses.flatMap((sc) => {
    const first = courseItems(sc)[0]?.place;
    return first
      ? [{ id: String(sc.id), title: courseTitle(sc), latitude: first.latitude, longitude: first.longitude }]
      : [];
  });

  return (
    <div className="wrap page-pad">
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

      {tab === "places" ? (
        <>
          <KakaoMap
            points={placePoints}
            fallback={
              <div className="map-placeholder big">
                {places.slice(0, 6).map((place, i) => (
                  <MapPin key={place.content_id} place={place} style={PIN_POSITIONS[i]} />
                ))}
              </div>
            }
          />
          <div className="saved-list" style={{ marginTop: 20 }}>
            {places.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>저장한 장소가 없어요.</p>}
            {places.map((place) => (
              <div className="saved-row" key={place.content_id}>
                <div>
                  <div className="saved-row-title">📍 {place.title}</div>
                  <div className="saved-row-sub mono">
                    {place.address} · {place.content_type_name}
                  </div>
                </div>
                <a
                  className="btn-outline"
                  href={kakaoPlaceUrl(place)}
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
                {courses.slice(0, 6).map((sc, i) => {
                  const first = courseItems(sc)[0]?.place;
                  return first ? (
                    <MapPin key={sc.id} place={first} style={PIN_POSITIONS[i]} label={courseTitle(sc)} />
                  ) : (
                    <div className="map-pin" key={sc.id} style={PIN_POSITIONS[i]} title={courseTitle(sc)} />
                  );
                })}
              </div>
            }
          />
          <div className="saved-list" style={{ marginTop: 20 }}>
            {courses.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>저장한 코스가 없어요.</p>}
            {courses.map((sc) => {
              const stats = courseStats(sc);
              return (
                <Link className="saved-row saved-row-link" key={sc.id} to={`/trip/${sc.id}`}>
                  <div>
                    <div className="saved-row-title">🗺️ {courseTitle(sc)}</div>
                    <div className="saved-row-sub mono">
                      {stats.visitCount}곳 · 총 {Math.round(stats.totalMin / 60)}시간
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
