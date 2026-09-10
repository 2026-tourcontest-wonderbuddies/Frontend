import type { LodgingCheck } from "../../api/types";
import type { StepProps } from "../../types/builderForm";
import { MOCK_LODGING_OPTIONS } from "./mockLodgingOptions";

const CHECK_MARK: Record<LodgingCheck["status"], string> = {
  yes: "✓",
  no: "✕",
  unknown: "?",
};

/**
 * 코스를 만들기 전에 추천 숙소를 고르는 단계.
 *
 * [백엔드 연결 이전] 아직 서버에 조건 기반 숙소 추천 API가 없어 목록은 더미(`mockLodgingOptions.ts`)다.
 * 고른 값도 아직 `POST /api/trips/`로 보내지 않는다 — 명세 1번에 대응 필드가 없다.
 * 자세한 내용은 BuilderPage의 buildPayload() 주석을 참고.
 */
export default function StepLodgingPick({ form, patch }: StepProps) {
  return (
    <div className="step">
      <div className="step-sub">
        입력하신 숙박 조건에 맞는 숙소예요. 고르시면 그 숙소를 기준으로 코스를 짜드려요.
      </div>

      <div className="nocon">
        <span className="nocon-tag">⚠ 백엔드 미연동</span>
        <p className="nocon-note" style={{ marginTop: 0 }}>
          지금 보이는 숙소 목록은 데모용 임시 데이터예요. 조건 기반 숙소 추천 API가 백엔드에
          연결되면 실제 데이터로 바뀝니다. 고른 숙소도 아직 코스 생성 요청에 담기지 않아요.
        </p>

        <div className="lodging-pick-list">
        {MOCK_LODGING_OPTIONS.map((card) => {
          const selected = form.lodgingContentId === card.content_id;
          return (
            <div className="candidate-card" key={card.content_id}>
              <div className="candidate-head">
                <div className="candidate-label">
                  {card.title}
                  {selected && (
                    <span className="meta-chip mono" style={{ marginLeft: 8 }}>
                      선택됨
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className={selected ? "btn-primary" : "btn-outline"}
                  onClick={() => patch({ lodgingContentId: selected ? "" : card.content_id })}
                >
                  {selected ? "선택 취소" : "선택"}
                </button>
              </div>

              <div className="lodging-meta">
                {card.category} · {card.address}
              </div>

              <div className="candidate-stats">
                <div className="candidate-stat">
                  <div className="k">참고 요금</div>
                  <div className="v">{card.price_hint || "확인 필요"}</div>
                </div>
                <div className="candidate-stat">
                  <div className="k">객실</div>
                  <div className="v">{card.room_type || "—"}</div>
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

              <div className="lodging-flags">
                {card.checks.map((chk) => (
                  <span className={`lodging-flag${chk.status === "yes" ? " on" : ""}`} key={chk.name}>
                    {CHECK_MARK[chk.status]} {chk.name} · {chk.detail}
                  </span>
                ))}
              </div>

              {card.query_fit && <p className="candidate-desc">{card.query_fit}</p>}

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
          );
        })}
        </div>
      </div>

      <p className="step-sub" style={{ marginTop: 16 }}>
        고르지 않고 넘어가도 돼요. 코스를 만든 뒤에도 숙소를 다시 고를 수 있어요.
      </p>
    </div>
  );
}
