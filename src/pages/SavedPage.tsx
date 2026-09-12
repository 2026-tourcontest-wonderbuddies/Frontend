import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Modal from "../components/Modal";
import PlaceDetailSheet from "../components/PlaceDetailSheet";
import type { PlaceSummary, SearchPlace } from "../api/types";
import { useSavedPlaces, useToggleSavedPlace } from "../hooks/useSavedPlaces";
import {
  courseSummaryText,
  removeSavedCourse,
  useSavedCourses,
  type SavedCourseRecord,
} from "../store/saved";

type DeleteTarget = { kind: "place"; item: PlaceSummary } | { kind: "course"; item: SavedCourseRecord };

/**
 * 장소는 계정에 저장된다(명세 신규 · GET /api/places/saved/).
 * [백엔드 연결 이전] 코스 저장만 대응 엔드포인트가 없어 localStorage 에 남아 있다.
 */
export default function SavedPage() {
  const { user } = useAuth();
  const { data: places = [] } = useSavedPlaces(Boolean(user));
  const courses = useSavedCourses(user?.id);
  const toggleSaved = useToggleSavedPlace();
  const [target, setTarget] = useState<DeleteTarget | null>(null);
  const [selected, setSelected] = useState<SearchPlace | null>(null);

  function confirmDelete() {
    if (!target || !user) return;
    if (target.kind === "place") toggleSaved.mutate({ contentId: target.item.content_id, saved: true });
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
        ⚠ 저장한 코스는 아직 백엔드 미연동이에요. 코스는 이 브라우저에만 남고 다른 기기에서는
        보이지 않아요. (장소는 계정에 저장돼요)
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
            {target.item.title}을(를) 저장 목록에서
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
