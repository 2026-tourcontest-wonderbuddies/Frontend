import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCourse } from "../hooks/useCourses";
import MapPin from "../components/MapPin";
import KakaoMap, { type KakaoMapPoint } from "../components/KakaoMap";
import { hhmm } from "../utils/format";
import { courseItems, courseLodging, courseStats } from "../utils/course";

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
  const { data: course, isLoading, isError } = useCourse(id);
  const [tab, setTab] = useState<"map" | "timeline">("map");

  if (isLoading) {
    return (
      <div className="state-panel">
        <div className="spinner" />
        <span className="serif">지도를 불러오는 중이에요</span>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="state-panel">
        <span className="serif">코스를 찾을 수 없어요</span>
        <Link className="btn-primary" to="/builder">
          다시 만들기 →
        </Link>
      </div>
    );
  }

  const allItems = courseItems(course);
  const stats = courseStats(course);
  // 실제 지도에 찍을 점들. 번호는 아래 "타임라인" 탭의 번호와 일치시킨다.
  // 타임라인은 하루 단위로 1부터 다시 세므로, 여러 날 코스는 "2-3"(Day 2의 3번째)으로 표기한다.
  const isMultiDay = course.days.length > 1;
  const visitPoints: KakaoMapPoint[] = course.days.flatMap((day) =>
    day.items.map((item, idx) => ({
      id: String(item.id),
      title: item.place.title,
      latitude: item.place.latitude,
      longitude: item.place.longitude,
      label: isMultiDay ? `${day.day_index}-${idx + 1}` : String(idx + 1),
      kind: "visit" as const,
    })),
  );
  // 첫 방문지 = 출발지, 마지막 방문지 = 도착지. 숙소는 여행 전체에 하나뿐이라 따로 붙인다.
  if (visitPoints.length > 0) {
    visitPoints[0] = { ...visitPoints[0], kind: "start" };
    visitPoints[visitPoints.length - 1] = { ...visitPoints[visitPoints.length - 1], kind: "end" };
  }
  const lodging = courseLodging(course);
  const mapPoints: KakaoMapPoint[] = lodging
    ? [
        ...visitPoints,
        {
          id: `lodging-${lodging.content_id}`,
          title: lodging.title,
          latitude: lodging.lat,
          longitude: lodging.lon,
          label: "숙소",
          kind: "lodging",
        },
      ]
    : visitPoints;

  return (
    <div>
      <div className="crumb">
        <Link to="/">홈</Link> / <Link to={`/trip/${id}`}>코스 상세</Link> / 지도
      </div>
      <header className="page-head wrap">
        <div className="page-eyebrow">MAP</div>
        <h1 className="page-title">코스 지도</h1>
        <p className="page-sub">
          {course.days.length}일 코스 · 총 {allItems.length}곳 · 체류 {Math.round(stats.stayMin / 60)}h{" "}
          {stats.stayMin % 60}m · 이동 {stats.travelMin}분
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
            <KakaoMap
              points={mapPoints}
              showRoute
              fallback={
                <div className="map-placeholder big">
                  {allItems.slice(0, 8).map((item, i, arr) => (
                    <MapPin
                      key={item.id}
                      place={item.place}
                      style={PIN_POSITIONS[i]}
                      kind={i === 0 ? "start" : i === arr.length - 1 ? "end" : "visit"}
                    />
                  ))}
                </div>
              }
            />
            <p className="side-note" style={{ marginTop: 12 }}>
              마커를 누르면 카카오맵에서 그 장소를 바로 열 수 있어요. 선은 방문 순서를 나타내며, 실제 주행 경로는
              아니에요.
            </p>
          </>
        ) : (
          <div style={{ maxWidth: 640 }}>
            {course.days.map((day) => (
              <div key={day.day_index}>
                {course.days.length > 1 && <div className="day-heading serif">Day {day.day_index}</div>}
                <div className="timeline">
                  {day.items.map((item, idx) => (
                    <div className="tl-item" key={item.id}>
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
        <Link className="btn-primary" to={`/trip/${id}`}>
          코스 상세로
        </Link>
      </div>
    </div>
  );
}
