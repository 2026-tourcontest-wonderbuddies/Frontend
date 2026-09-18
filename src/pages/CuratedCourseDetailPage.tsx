import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCuratedCourseDetail } from "../hooks/useCuratedCourses";
import PlaceDetailSheet from "../components/PlaceDetailSheet";
import type { PlaceSummary } from "../api/types";

/** 라우트의 :id 는 추천 코스(CuratedCourse)의 id다. */
export default function CuratedCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const courseId = Number(id);
  const { data: course, isLoading, isError } = useCuratedCourseDetail(
    Number.isFinite(courseId) ? courseId : null,
  );
  const [selectedPlace, setSelectedPlace] = useState<PlaceSummary | null>(null);

  if (isLoading) {
    return (
      <div className="state-panel">
        <div className="spinner" />
        <span className="serif">코스를 불러오는 중이에요</span>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="state-panel">
        <span className="serif">코스를 찾을 수 없어요</span>
        <p>링크가 잘못됐거나 삭제된 코스일 수 있어요.</p>
        <button className="btn-primary" onClick={() => navigate("/list")}>
          목록으로 →
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="crumb">
        <Link to="/">홈</Link> / <Link to="/list">추천 코스</Link> / {course.title}
      </div>

      <header className="page-head wrap">
        <h1 className="page-title">{course.title}</h1>
        <div className="meta-row" style={{ marginTop: 12 }}>
          <span className="meta-chip mono">{course.badge}</span>
          {course.meta_chips.map((m) => (
            <span className="meta-chip mono" key={m}>
              {m}
            </span>
          ))}
        </div>
      </header>

      <div className="main-detail wrap">
        <div>
          <div className="section-label">TIMELINE</div>
          <div className="section-title serif">방문 순서대로 보는 코스</div>

          <div className="timeline" style={{ marginTop: 20 }}>
            {course.items.map((item, idx) => (
              <div className="tl-item" key={item.place.content_id}>
                <div className="tl-dot mono">{idx + 1}</div>
                <div
                  className="tl-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPlace(item.place)}
                >
                  <div className="tl-top">
                    <div className="tl-title">{item.place.title}</div>
                  </div>
                  <div className="tl-desc">
                    {item.place.overview || `${item.place.content_type_name} · ${item.place.address}`}
                  </div>
                </div>
                {idx < course.items.length - 1 && (
                  <div className="tl-transit">
                    <span className="line" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="side-note" style={{ marginTop: 16 }}>
            이 코스는 미리 골라둔 추천 조합이에요. 정확한 이동·체류 시간이 궁금하면{" "}
            <Link to="/builder">나만의 코스 만들기</Link>로 직접 일정을 짜보세요.
          </p>
        </div>
      </div>

      {selectedPlace && <PlaceDetailSheet place={selectedPlace} onClose={() => setSelectedPlace(null)} />}
    </div>
  );
}
