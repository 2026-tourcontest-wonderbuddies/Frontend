import { useNavigate, useParams } from "react-router-dom";
import { useCandidates, useSelectCandidate } from "../hooks/useCandidates";
import { useLodgingRecommendations } from "../hooks/useLodging";
import LoadingChecklist from "../components/LoadingChecklist";
import type { LodgingRecommendationDTO } from "../api/types";

function fmtPrice(won: number | null | undefined): string {
  if (won == null) return "요금 미확인";
  return `${Math.round(won / 10000)}만원 / 박`;
}

export default function LodgingPage() {
  const { requestId, candidateId } = useParams<{ requestId: string; candidateId: string }>();
  const navigate = useNavigate();

  const candidates = useCandidates(requestId);
  const recommendations = useLodgingRecommendations(candidateId);
  const selectCandidate = useSelectCandidate();

  const candidate = candidates.data?.candidates.find((c) => c.id === candidateId);
  const nights = candidate ? Math.max(0, candidate.days.length - 1) : 0;

  function confirm(lodgingContentId?: string) {
    if (!candidateId) return;
    selectCandidate.mutate(
      { candidateId, lodgingContentId },
      { onSuccess: (trip) => navigate(`/trip/${trip.id}`) },
    );
  }

  if (candidates.isLoading || recommendations.isLoading || selectCandidate.isPending) {
    return <LoadingChecklist />;
  }

  if (candidates.isError || !candidate) {
    return (
      <div className="state-panel">
        <span className="serif">코스 후보를 찾을 수 없어요</span>
        <p>링크가 잘못되었거나 만료됐을 수 있어요.</p>
        <button className="btn-primary" onClick={() => navigate("/builder")}>
          다시 만들기 →
        </button>
      </div>
    );
  }

  const recs: LodgingRecommendationDTO[] = recommendations.data?.recommendations ?? [];

  return (
    <div className="candidates-page wrap">
      <div className="page-eyebrow">LODGING</div>
      <h1 className="page-title">어디서 묵을까요?</h1>
      <p className="page-sub">
        {nights}박 일정이에요. 입력하신 숙박 조건과 코스 동선을 함께 보고 골랐어요. 숙소를 고르면 코스가 확정됩니다.
      </p>
      <div className="candidates-summary">
        <span>📅 {candidate.days.length}일 일정</span>
        <span>🛏 {nights}박 · 전체 동일 숙소</span>
        <span>🎯 {candidate.label}</span>
      </div>

      {recs.length === 0 ? (
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
            <button className="btn-primary" onClick={() => confirm()}>
              숙소 없이 코스 확정 →
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="candidate-grid">
            {recs.map(({ lodging, travel_min_from_last_stop, match_reason, missing_fields }) => (
              <div className="candidate-card" key={lodging.content_id}>
                <div className="candidate-head">
                  <div className="candidate-label">{lodging.title}</div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => confirm(lodging.content_id)}
                    disabled={selectCandidate.isPending}
                  >
                    선택
                  </button>
                </div>

                <div className="lodging-meta mono">
                  {lodging.small_category_name} · {lodging.address}
                </div>

                <div className="candidate-stats">
                  <div className="candidate-stat">
                    <div className="k">1박 요금</div>
                    <div className="v">{fmtPrice(lodging.price_per_night)}</div>
                  </div>
                  <div className="candidate-stat">
                    <div className="k">동선에서</div>
                    <div className="v">{travel_min_from_last_stop}분</div>
                  </div>
                  <div className="candidate-stat">
                    <div className="k">체크인</div>
                    <div className="v">{lodging.check_in_time ?? "—"}</div>
                  </div>
                  <div className="candidate-stat">
                    <div className="k">체크아웃</div>
                    <div className="v">{lodging.check_out_time ?? "—"}</div>
                  </div>
                </div>

                <div className="lodging-flags">
                  <span className={`lodging-flag${lodging.cooking ? " on" : ""}`}>
                    {lodging.cooking ? "취사 가능" : "취사 불가"}
                  </span>
                  <span className={`lodging-flag${lodging.parking ? " on" : ""}`}>
                    {lodging.parking ? "주차 가능" : "주차 불가"}
                  </span>
                </div>

                {match_reason && <p className="candidate-desc">{match_reason}</p>}

                <div className="candidate-badges">
                  {lodging.facilities.map((f) => (
                    <span className="candidate-badge" key={f}>
                      {f}
                    </span>
                  ))}
                </div>

                {missing_fields.length > 0 && (
                  <div className="lodging-warn">⚠ 확인 필요: {missing_fields.join(", ")}</div>
                )}
              </div>
            ))}
          </div>

          <div className="lodging-actions">
            <button className="btn-outline" onClick={() => navigate(-1)}>
              ← 다른 코스 보기
            </button>
            <button className="btn-outline" onClick={() => confirm()} disabled={selectCandidate.isPending}>
              숙소 없이 진행
            </button>
          </div>
        </>
      )}

      {(selectCandidate.isError || recommendations.isError) && (
        <div className="form-error" style={{ marginTop: 20 }}>
          숙소 정보를 불러오는 중 문제가 발생했어요. 다시 시도해주세요.
        </div>
      )}
    </div>
  );
}
