import Modal from "./Modal";
import type { ConstraintViolationDTO } from "../api/types";

const TYPE_LABEL: Record<ConstraintViolationDTO["type"], string> = {
  hours_exceeded: "운영시간 초과",
  schedule_overrun: "일정 종료 시간 초과",
  travel_time_insufficient: "이동시간 부족",
};

interface ConstraintViolationSheetProps {
  violations: ConstraintViolationDTO[];
  onClose: () => void;
}

export default function ConstraintViolationSheet({ violations, onClose }: ConstraintViolationSheetProps) {
  return (
    <Modal title="일정에 문제가 생겼어요" onClose={onClose} wide>
      <p style={{ marginBottom: 20 }}>아래 항목을 확인하고 조치 방법을 선택해 주세요.</p>

      <div className="override-summary" style={{ marginBottom: 20 }}>
        <div className="sum-row">
          <span>위반 항목</span>
          <b className="mono">{violations.length}건</b>
        </div>
        <div className="sum-row">
          <span>영향 받는 장소</span>
          <b className="mono">{new Set(violations.map((v) => v.place_title).filter(Boolean)).size}곳</b>
        </div>
      </div>

      {violations.map((v, i) => (
        <div key={i} className="violation-item">
          <div className="violation-type">{TYPE_LABEL[v.type]}</div>
          <p>{v.detail}</p>
        </div>
      ))}

      <p style={{ marginTop: 20, fontSize: 12 }}>
        코스 편집 화면으로 돌아가 장소를 교체·삭제하거나 체류시간을 조정하면 문제를 해결할 수 있어요.
      </p>
      <button type="button" className="btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={onClose}>
        편집 화면으로 돌아가기
      </button>
    </Modal>
  );
}
