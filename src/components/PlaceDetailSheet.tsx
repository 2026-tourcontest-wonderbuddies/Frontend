import Modal from "./Modal";
import type { PlaceSummary } from "../api/types";

interface PlaceDetailSheetProps {
  place: PlaceSummary;
  onClose: () => void;
}

/** 운영시간 원문은 " / " 로 여러 줄이 이어져 오므로 줄 단위로 끊어 보여준다. */
function hoursLines(raw: string): string[] {
  return raw
    .split(/\s*\/\s*/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function PlaceDetailSheet({ place, onClose }: PlaceDetailSheetProps) {
  const hours = hoursLines(place.hours_raw);

  return (
    <Modal title={place.title} onClose={onClose}>
      <div className="place-sheet-photo" />

      <p style={{ marginBottom: 16 }}>
        {place.address} · {place.content_type_name}
      </p>

      <div className="place-fact-grid">
        <div>
          <div className="override-label">이용요금</div>
          <div>{place.fees || "확인 필요"}</div>
        </div>
        <div>
          <div className="override-label">주차</div>
          <div>{place.parking || "확인 필요"}</div>
        </div>
        <div>
          <div className="override-label">권장 체류</div>
          <div>{place.stay_time_minutes}분</div>
        </div>
        <div>
          <div className="override-label">좌표</div>
          <div className="mono">
            {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
          </div>
        </div>
      </div>

      <div className="override-section">
        <div className="override-label">운영시간</div>
        {hours.length > 0 ? (
          hours.map((line) => (
            <p key={line} style={{ marginBottom: 2 }}>
              {line}
            </p>
          ))
        ) : (
          <p>확인 필요</p>
        )}
      </div>

      <div className="override-section">
        <div className="override-label">장소 소개</div>
        <p>{place.overview || "이 장소에 대한 설명이 아직 없어요."}</p>
      </div>

      <div className="auth-error-banner" style={{ background: "var(--paper-deep)", borderColor: "var(--line)" }}>
        <b style={{ color: "var(--ink)" }}>확인 필요 정보</b>
        <p>데이터 최신성을 보장하지 않습니다. 실제 방문 전 운영 여부를 공식 채널에서 확인하세요.</p>
      </div>
    </Modal>
  );
}
