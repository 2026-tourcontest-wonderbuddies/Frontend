import { useNavigate, useParams } from "react-router-dom";
import { useCourseDetails, useSelectCourse, useTripCourses } from "../hooks/useCourses";
import LoadingChecklist from "../components/LoadingChecklist";
import { PRIORITY_LABELS, type CourseDetail } from "../api/types";
import { courseStats } from "../utils/course";

function fmtMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/**
 * 명세 2번으로 코스 3개의 id를 받고, 명세 4번으로 각 상세를 받아 카드를 만든다.
 * (백엔드는 후보 요약 지표를 따로 주지 않아 일정에서 계산한다.)
 */
export default function CoursesPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const list = useTripCourses(tripId);
  const courseIds = (list.data?.courses ?? []).map((c) => c.id);
  const details = useCourseDetails(courseIds);
  const selectCourse = useSelectCourse();

  if (list.isLoading || (courseIds.length > 0 && details.isLoading) || selectCourse.isPending) {
    return <LoadingChecklist onCancel={() => navigate("/builder")} />;
  }

  if (list.isError || !list.data) {
    return (
      <div className="state-panel">
        <span className="serif">추천 요청을 찾을 수 없어요</span>
        <p>링크가 잘못되었거나 만료됐을 수 있어요.</p>
        <button className="btn-primary" onClick={() => navigate("/builder")}>
          다시 만들기 →
        </button>
      </div>
    );
  }

  const courses = details.courses;

  if (courses.length === 0) {
    return (
      <div className="candidates-page wrap">
        <div className="page-eyebrow">RECOMMENDATION</div>
        <h1 className="page-title">코스를 찾지 못했어요</h1>
        <p className="page-sub">입력하신 조건으로는 실행 가능한 코스를 만들 수 없어요.</p>

        <div className="side-card" style={{ marginTop: 24, maxWidth: 520 }}>
          <h4>확인할 사항</h4>
          <ul style={{ paddingLeft: 18, color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.9 }}>
            <li>출발 시간과 도착 시간 사이에 충분한 여유가 있는지 확인하세요.</li>
            <li>선택한 권역에 조건에 맞는 장소가 있는지 확인하세요.</li>
            <li>숙박 유형을 "상관없음"으로 넓혀보세요.</li>
          </ul>
        </div>

        <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => navigate("/builder")}>
          조건 다시 입력 →
        </button>
      </div>
    );
  }

  const totalDays = courses[0].days.length;
  // 코스 상세에 더 이상 숙소 스냅샷이 없어서 숙박 여부는 일정 길이로 판단한다(1박 이상이면 숙소 단계).
  const hasLodging = totalDays > 1;

  function handleSelect(course: CourseDetail) {
    // 숙박이 있는 코스는 확정 전에 숙소를 먼저 고른다(명세 6·7번).
    if (course.days.length > 1) {
      navigate(`/trips/${tripId}/courses/${course.id}/lodging`);
      return;
    }
    selectCourse.mutate(course.id, {
      onSuccess: () => navigate(`/trip/${course.id}`),
    });
  }

  return (
    <div className="candidates-page wrap">
      <div className="page-eyebrow">RECOMMENDATION</div>
      <h1 className="page-title">추천 코스 목록</h1>
      <p className="page-sub">
        조건에 맞는 코스 {courses.length}개를 만들었어요. 마음에 드는 코스를 선택하세요.
      </p>
      <div className="candidates-summary">
        <span>📅 {totalDays}일 일정</span>
        <span>🎯 총 {courses.length}개 코스 생성됨</span>
      </div>

      <div className="candidate-grid">
        {courses.map((c) => {
          const stats = courseStats(c);
          return (
            <div className="candidate-card" key={c.id}>
              <div className="candidate-head">
                <div className="candidate-label">{PRIORITY_LABELS[c.mode]}</div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleSelect(c)}
                  disabled={selectCourse.isPending}
                >
                  {hasLodging ? "선택하고 숙소 고르기" : "선택"}
                </button>
              </div>

              <div className="candidate-stats">
                <div className="candidate-stat">
                  <div className="k">방문 장소</div>
                  <div className="v">{stats.visitCount}곳</div>
                </div>
                <div className="candidate-stat">
                  <div className="k">총 소요시간</div>
                  <div className="v">{fmtMin(stats.totalMin)}</div>
                </div>
                <div className="candidate-stat">
                  <div className="k">이동시간</div>
                  <div className="v">{fmtMin(stats.travelMin)}</div>
                </div>
                <div className="candidate-stat">
                  <div className="k">추천 점수</div>
                  <div className="v">{c.final_score === null ? "—" : c.final_score.toFixed(1)}</div>
                </div>
              </div>

              <div className="candidate-day-list">
                {c.days.map((d) => (
                  <div className="candidate-day-row" key={d.day_index}>
                    <span>Day {d.day_index}</span>
                    <span className="mono">
                      {d.items.length > 0 ? `${d.items.length}곳 · 가용 ${d.avail_hours}시간` : "일정 없음"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {(selectCourse.isError || details.isError) && (
        <div className="form-error" style={{ marginTop: 20 }}>
          코스를 불러오거나 선택하는 중 문제가 발생했어요. 다시 시도해주세요.
        </div>
      )}
    </div>
  );
}
