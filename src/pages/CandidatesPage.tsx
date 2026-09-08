import { useNavigate, useParams } from "react-router-dom";
import { useCandidates, useSelectCandidate } from "../hooks/useCandidates";
import LoadingChecklist from "../components/LoadingChecklist";
import type { CandidateScores, TripCandidateDTO } from "../api/types";

function fmtMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

function stars(n: number): string {
  return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
}

const SCORE_LABELS: { key: keyof CandidateScores; label: string }[] = [
  { key: "move_eff", label: "동선 효율" },
  { key: "pref_fit", label: "취향 적합" },
  { key: "slack", label: "여유도" },
];

export default function CandidatesPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCandidates(requestId);
  const selectCandidate = useSelectCandidate();

  if (isLoading) {
    return <LoadingChecklist onCancel={() => navigate("/builder")} />;
  }

  if (isError || !data) {
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

  if (data.candidates.length === 0) {
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
            <li>제외한 카테고리가 너무 많지는 않은지 확인하세요.</li>
          </ul>
        </div>

        <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => navigate("/builder")}>
          조건 다시 입력 →
        </button>
      </div>
    );
  }

  const first = data.candidates[0];
  const isMultiDay = first.days.length > 1;

  function handleSelect(candidate: TripCandidateDTO) {
    // 다일 여행은 확정 전에 숙소를 먼저 고른다. 당일치기는 숙박이 없어 바로 확정.
    if (candidate.days.length > 1) {
      navigate(`/trips/candidates/${requestId}/lodging/${candidate.id}`);
      return;
    }
    selectCandidate.mutate(
      { candidateId: candidate.id },
      { onSuccess: (trip) => navigate(`/trip/${trip.id}`) },
    );
  }

  return (
    <div className="candidates-page wrap">
      <div className="page-eyebrow">RECOMMENDATION</div>
      <h1 className="page-title">추천 코스 목록</h1>
      <p className="page-sub">조건에 맞는 코스 후보 {data.candidates.length}개를 만들었어요. 마음에 드는 코스를 선택하세요.</p>
      <div className="candidates-summary">
        <span>📅 {first.days.length}일 일정</span>
        <span>🎯 총 {data.candidates.length}개 코스 생성됨</span>
      </div>

      <div className="candidate-grid">
        {data.candidates.map((c) => (
          <div className="candidate-card" key={c.id}>
            <div className="candidate-head">
              <div className="candidate-label">{c.label}</div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleSelect(c)}
                disabled={selectCandidate.isPending}
              >
                {isMultiDay ? "선택하고 숙소 고르기" : "선택"}
              </button>
            </div>

            <div className="candidate-stats">
              <div className="candidate-stat">
                <div className="k">방문 장소</div>
                <div className="v">{c.visit_count}곳</div>
              </div>
              <div className="candidate-stat">
                <div className="k">총 소요시간</div>
                <div className="v">{fmtMin(c.total_duration_min)}</div>
              </div>
              <div className="candidate-stat">
                <div className="k">이동거리</div>
                <div className="v">{c.total_distance_km}km</div>
              </div>
              <div className="candidate-stat">
                <div className="k">여유시간</div>
                <div className="v">{fmtMin(c.slack_min)}</div>
              </div>
            </div>

            <div className="candidate-scores">
              {SCORE_LABELS.map(({ key, label }) => (
                <div className="candidate-score-row" key={key}>
                  <span>{label}</span>
                  <span className="candidate-stars">{stars(c.scores[key])}</span>
                </div>
              ))}
            </div>

            <p className="candidate-desc">{c.description}</p>

            <div className="candidate-badges">
              {c.badges.map((b) => (
                <span className="candidate-badge" key={b}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {selectCandidate.isError && (
        <div className="form-error" style={{ marginTop: 20 }}>
          코스를 선택하는 중 문제가 발생했어요. 다시 시도해주세요.
        </div>
      )}
    </div>
  );
}
