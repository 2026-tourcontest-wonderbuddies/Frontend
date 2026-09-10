import { useNavigate, useParams } from "react-router-dom";
import {
  useCourse,
  useCourseLodgingOptions,
  useSelectCourse,
  useSelectCourseLodging,
} from "../hooks/useCourses";
import LoadingChecklist from "../components/LoadingChecklist";
import { PRIORITY_LABELS, type LodgingCard } from "../api/types";

const CHECK_MARK: Record<LodgingCard["checks"][number]["status"], string> = {
  yes: "✓",
  no: "✕",
  unknown: "?",
};

export default function LodgingPage() {
  const { tripId, courseId } = useParams<{ tripId: string; courseId: string }>();
  const navigate = useNavigate();

  const course = useCourse(courseId);
  const options = useCourseLodgingOptions(courseId);
  const selectLodging = useSelectCourseLodging();
  const selectCourse = useSelectCourse();

  const nights = course.data ? Math.max(0, course.data.days.length - 1) : 0;

  /** 숙소를 서버에 반영한 뒤 코스를 최종 확정한다(명세 7번 → 3번). */
  function chooseAndConfirm(contentId: string) {
    if (!courseId) return;
    selectLodging.mutate(
      { courseId, contentId },
      {
        onSuccess: () =>
          selectCourse.mutate(courseId, { onSuccess: () => navigate(`/trip/${courseId}`) }),
      },
    );
  }

  /** 숙소를 고르지 않고 확정. 서버가 이미 넣어 둔 기본 숙소 스냅샷이 유지된다. */
  function confirmWithoutChoosing() {
    if (!courseId) return;
    selectCourse.mutate(courseId, { onSuccess: () => navigate(`/trip/${courseId}`) });
  }

  if (course.isLoading || options.isLoading || selectLodging.isPending || selectCourse.isPending) {
    return <LoadingChecklist />;
  }

  if (course.isError || !course.data) {
    return (
      <div className="state-panel">
        <span className="serif">코스를 찾을 수 없어요</span>
        <p>링크가 잘못되었거나 만료됐을 수 있어요.</p>
        <button className="btn-primary" onClick={() => navigate("/builder")}>
          다시 만들기 →
        </button>
      </div>
    );
  }

  const cards = options.data?.lodging_options ?? [];
  const currentId = options.data?.current_selected?.content_id;

  return (
    <div className="candidates-page wrap">
      <div className="page-eyebrow">LODGING</div>
      <h1 className="page-title">어디서 묵을까요?</h1>
      <p className="page-sub">
        {nights}박 일정이에요. 입력하신 숙박 조건과 코스 동선을 함께 보고 골랐어요. 숙소를 고르면 코스가 확정됩니다.
      </p>
      <div className="candidates-summary">
        <span>📅 {course.data.days.length}일 일정</span>
        <span>🛏 {nights}박 · 전체 동일 숙소</span>
        <span>🎯 {PRIORITY_LABELS[course.data.mode]}</span>
      </div>

      {cards.length === 0 ? (
        <>
          <div className="side-card" style={{ marginTop: 24, maxWidth: 520 }}>
            <h4>조건에 맞는 숙소를 찾지 못했어요</h4>
            <ul style={{ paddingLeft: 18, color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.9 }}>
              <li>숙소 유형을 "상관없음"으로 넓혀보세요.</li>
              <li>취사 조건을 "무관"으로 바꿔보세요.</li>
              <li>선택한 권역 주변에 등록된 숙소가 적을 수 있어요.</li>
            </ul>
          </div>
          <div className="lodging-actions">
            <button className="btn-outline" onClick={() => navigate("/builder")}>
              조건 다시 입력
            </button>
            <button className="btn-primary" onClick={confirmWithoutChoosing}>
              숙소 없이 코스 확정 →
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="candidate-grid">
            {cards.map((card) => (
              <div className="candidate-card" key={card.content_id}>
                <div className="candidate-head">
                  <div className="candidate-label">
                    {card.title}
                    {card.content_id === currentId && (
                      <span className="meta-chip mono" style={{ marginLeft: 8 }}>
                        현재 선택
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => chooseAndConfirm(card.content_id)}
                    disabled={selectLodging.isPending}
                  >
                    선택
                  </button>
                </div>

                <div className="lodging-meta mono">
                  {card.category} · {card.address}
                </div>

                <div className="candidate-stats">
                  <div className="candidate-stat">
                    <div className="k">참고 요금</div>
                    <div className="v">{card.price_hint || "확인 필요"}</div>
                  </div>
                  <div className="candidate-stat">
                    <div className="k">동선에서</div>
                    <div className="v">{card.travel_min != null ? `${card.travel_min}분` : "—"}</div>
                  </div>
                  <div className="candidate-stat">
                    <div className="k">체크인</div>
                    <div className="v">{card.check_in_time || "—"}</div>
                  </div>
                  <div className="candidate-stat">
                    <div className="k">체크아웃</div>
                    <div className="v">{card.check_out_time || "—"}</div>
                  </div>
                </div>

                {card.room_type && (
                  <p className="candidate-desc">
                    객실 {card.room_type}
                    {card.room_count != null ? ` · ${card.room_count}실` : ""}
                    {card.max_guests != null ? ` · 최대 ${card.max_guests}명` : ""}
                  </p>
                )}

                <div className="lodging-checks">
                  {card.checks.map((chk) => (
                    <div className={`lodging-check ${chk.status}`} key={chk.name}>
                      <b>
                        {CHECK_MARK[chk.status]} {chk.name}
                      </b>
                      <span>{chk.detail}</span>
                    </div>
                  ))}
                </div>

                {card.needs_check && card.unknown_fields.length > 0 && (
                  <div className="lodging-warn">⚠ 확인 필요: {card.unknown_fields.join(", ")}</div>
                )}

                {card.tripcom_link && (
                  <a
                    className="btn-outline"
                    style={{ display: "block", textAlign: "center", marginTop: 12 }}
                    href={card.tripcom_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    트립닷컴에서 요금 확인 ↗
                  </a>
                )}
              </div>
            ))}
          </div>

          <p className="side-note" style={{ marginTop: 12 }}>
            표시된 요금은 참고가이며 실시간 가격이 아니에요. 예약과 결제는 트립닷컴에서 진행됩니다.
          </p>

          <div className="lodging-actions">
            <button className="btn-outline" onClick={() => navigate(`/trips/${tripId}/courses`)}>
              ← 다른 코스 보기
            </button>
            <button className="btn-outline" onClick={confirmWithoutChoosing} disabled={selectCourse.isPending}>
              추천 숙소 그대로 진행
            </button>
          </div>
        </>
      )}

      {(selectLodging.isError || selectCourse.isError || options.isError) && (
        <div className="form-error" style={{ marginTop: 20 }}>
          숙소 정보를 처리하는 중 문제가 발생했어요. 다시 시도해주세요.
        </div>
      )}
    </div>
  );
}
