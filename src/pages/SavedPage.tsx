import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Modal from "../components/Modal";
import PlaceDetailSheet from "../components/PlaceDetailSheet";
import type { CourseDetail, PlaceSummary, SearchPlace } from "../api/types";
import { useSavedPlaces, useToggleSavedPlace } from "../hooks/useSavedPlaces";
import { useSavedCourses, useToggleSavedCourse } from "../hooks/useSavedCourses";
import { useCourseDetails } from "../hooks/useCourses";
import { courseStats, courseTitle } from "../utils/course";

/** 저장 코스 요약 줄. 체류+이동을 합쳐 시간 단위로 보여준다. */
function courseSummaryText(course: CourseDetail): string {
  const stats = courseStats(course);
  return `${stats.visitCount}곳 · 총 ${Math.round(stats.totalMin / 60)}시간`;
}

type DeleteTarget = { kind: "place"; item: PlaceSummary } | { kind: "course"; item: CourseDetail };

/** 장소·코스 모두 계정에 저장된다(GET /api/places/saved/, GET /api/courses/saved/). */
export default function SavedPage() {
  const { user } = useAuth();
  const { data: places = [] } = useSavedPlaces(Boolean(user));
  const { data: savedCourses = [] } = useSavedCourses(Boolean(user));
  // 목록 응답에는 코스 이름이 없어 상세(명세 4번)로 제목·요약을 만든다(CoursesPage와 같은 방식).
  const { courses } = useCourseDetails(savedCourses.map((c) => c.id));
  const toggleSaved = useToggleSavedPlace();
  const toggleSavedCourse = useToggleSavedCourse();
  const [target, setTarget] = useState<DeleteTarget | null>(null);
  const [selected, setSelected] = useState<SearchPlace | null>(null);

  function confirmDelete() {
    if (!target || !user) return;
    if (target.kind === "place") toggleSaved.mutate({ contentId: target.item.content_id, saved: true });
    else toggleSavedCourse.mutate({ courseId: target.item.id, saved: true });
    setTarget(null);
  }

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

  const isEmpty = places.length === 0 && courses.length === 0;

  return (
    <div className="wrap" style={{ padding: "40px 32px 90px" }}>
      <div className="results-head">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          저장함
        </h1>
        <Link className="btn-outline" to="/saved/map">
          지도에서 보기
        </Link>
      </div>

      {isEmpty && (
        <div className="empty-state" style={{ padding: "70px 20px" }}>
          <span className="serif">아직 저장한 장소나 코스가 없어요</span>
          <p style={{ marginTop: 8 }}>
            <Link to="/search">장소 검색</Link>에서 마음에 드는 장소를 담거나,{" "}
            <Link to="/builder">코스 만들기</Link>로 만든 코스를 저장해보세요.
          </p>
        </div>
      )}

      {places.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <h2 className="section-title serif" style={{ fontSize: 19, marginBottom: 16 }}>
            저장한 장소
          </h2>
          <div className="saved-list">
            {places.map((place) => (
              <div className="saved-row" key={place.content_id}>
                <button type="button" className="saved-row-link" onClick={() => setSelected(place)}>
                  <div className="saved-row-title">{place.title}</div>
                  <div className="saved-row-sub mono">
                    {place.content_type_name} · {place.address}
                  </div>
                </button>
                <button type="button" className="btn-outline" onClick={() => setTarget({ kind: "place", item: place })}>
                  삭제
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {courses.length > 0 && (
        <section style={{ marginTop: 36 }}>
          <h2 className="section-title serif" style={{ fontSize: 19, marginBottom: 16 }}>
            저장한 코스
          </h2>
          <div className="saved-list">
            {courses.map((sc) => (
              <div className="saved-row" key={sc.id}>
                <Link className="saved-row-link" to={`/trip/${sc.id}`}>
                  <div className="saved-row-title">{courseTitle(sc)}</div>
                  <div className="saved-row-sub mono">{courseSummaryText(sc)}</div>
                </Link>
                <button type="button" className="btn-outline" onClick={() => setTarget({ kind: "course", item: sc })}>
                  삭제
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {target && (
        <Modal title={target.kind === "place" ? "장소 삭제" : "코스 삭제"} onClose={() => setTarget(null)}>
          <p style={{ marginBottom: 20 }}>
            {target.kind === "place" ? target.item.title : courseTitle(target.item)}을(를) 저장 목록에서
            삭제하시겠습니까?
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setTarget(null)}>
              취소
            </button>
            <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={confirmDelete}>
              삭제
            </button>
          </div>
        </Modal>
      )}

      {selected && <PlaceDetailSheet place={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
