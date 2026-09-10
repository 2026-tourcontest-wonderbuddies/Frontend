import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Modal from "../components/Modal";
import {
  courseSummaryText,
  removeSavedCourse,
  removeSavedPlace,
  useSavedCourses,
  useSavedPlaces,
  type SavedCourseRecord,
  type SavedPlaceRecord,
} from "../store/saved";

type DeleteTarget = { kind: "place"; item: SavedPlaceRecord } | { kind: "course"; item: SavedCourseRecord };

/**
 * [백엔드 연결 이전] 저장 API 가 아직 서버에 없어 목록은 이 브라우저(localStorage)에만 있다.
 */
export default function SavedPage() {
  const { user } = useAuth();
  const places = useSavedPlaces(user?.id);
  const courses = useSavedCourses(user?.id);
  const [target, setTarget] = useState<DeleteTarget | null>(null);

  function confirmDelete() {
    if (!target || !user) return;
    if (target.kind === "place") removeSavedPlace(user.id, target.item.id);
    else removeSavedCourse(user.id, target.item.id);
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

      <div className="nocon-banner" style={{ marginTop: 12 }}>
        ⚠ 백엔드 미연동 — 저장 API가 아직 서버에 없어요. 저장한 장소·코스는 이 브라우저에만 남고,
        다른 기기에서는 보이지 않아요.
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
            {places.map((sp) => (
              <div className="saved-row" key={sp.id}>
                <div>
                  <div className="saved-row-title">{sp.place.title}</div>
                  <div className="saved-row-sub mono">
                    {sp.place.content_type_name} · {sp.place.address}
                  </div>
                </div>
                <button type="button" className="btn-outline" onClick={() => setTarget({ kind: "place", item: sp })}>
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
                <Link className="saved-row-link" to={`/trip/${sc.course_id}`}>
                  <div className="saved-row-title">{sc.title}</div>
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
            {target.kind === "place" ? target.item.place.title : target.item.title}을(를) 저장 목록에서
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
    </div>
  );
}
