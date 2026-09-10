import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTrip } from "../hooks/useTrip";
import { useApplyEdit, useCommitTrip } from "../hooks/useEdit";
import ConstraintViolationSheet from "../components/ConstraintViolationSheet";
import Modal from "../components/Modal";
import { hhmm } from "../utils/format";
import type { ConstraintViolationDTO, EditOpType, ItineraryItemDTO, TripResponse } from "../api/types";

export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: initialTrip, isLoading, isError } = useTrip(id);
  const applyEdit = useApplyEdit(id ?? "");
  const commitTrip = useCommitTrip(id ?? "");

  const [history, setHistory] = useState<TripResponse[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeDay, setActiveDay] = useState(1);
  const [violations, setViolations] = useState<ConstraintViolationDTO[]>([]);
  const [showViolations, setShowViolations] = useState(false);
  const [stayEditItem, setStayEditItem] = useState<ItineraryItemDTO | null>(null);
  const [stayDraft, setStayDraft] = useState(60);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initialTrip && history.length === 0) {
      setHistory([initialTrip]);
      setHistoryIndex(0);
    }
  }, [initialTrip, history.length]);

  if (isLoading || history.length === 0) {
    return (
      <div className="state-panel">
        <div className="spinner" />
        <span className="serif">코스를 불러오는 중이에요</span>
      </div>
    );
  }

  if (isError || !initialTrip) {
    return (
      <div className="state-panel">
        <span className="serif">코스를 찾을 수 없어요</span>
        <button className="btn-primary" onClick={() => navigate("/builder")}>
          다시 만들기 →
        </button>
      </div>
    );
  }

  const current = history[historyIndex];
  const day = current.days.find((d) => d.day_index === activeDay) ?? current.days[0];
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  function runOp(op: EditOpType, extra: Partial<{ item_order: number; direction: "up" | "down"; stay_min: number }> = {}) {
    applyEdit.mutate(
      { trip: current, day_index: day.day_index, op, ...extra },
      {
        onSuccess: (res) => {
          const truncated = history.slice(0, historyIndex + 1);
          const nextHistory = [...truncated, res.trip];
          setHistory(nextHistory);
          setHistoryIndex(nextHistory.length - 1);
          setViolations(res.violations);
          setSaved(false);
        },
      },
    );
  }

  function undo() {
    setHistoryIndex((i) => Math.max(0, i - 1));
    setViolations([]);
  }
  function redo() {
    setHistoryIndex((i) => Math.min(history.length - 1, i + 1));
    setViolations([]);
  }

  function openStayEdit(item: ItineraryItemDTO) {
    setStayEditItem(item);
    setStayDraft(item.stay_min);
  }

  function confirmStayEdit() {
    if (!stayEditItem) return;
    runOp("stay_time", { item_order: stayEditItem.order, stay_min: stayDraft });
    setStayEditItem(null);
  }

  function handleSaveChanges() {
    commitTrip.mutate(current, { onSuccess: () => setSaved(true) });
  }

  const totalStay = day.items.reduce((s, it) => s + it.stay_min, 0);
  const totalTravel = day.items.reduce((s, it) => s + (it.travel_min_from_prev ?? 0), 0);
  const slackMin = Math.max(0, Math.round(day.avail_hours * 60 - totalStay - totalTravel));

  return (
    <div className="wrap" style={{ padding: "40px 32px 120px" }}>
      <div className="crumb" style={{ padding: 0, marginBottom: 20 }}>
        <Link to="/">홈</Link> / <Link to={`/trip/${id}`}>코스 상세</Link> / 편집
      </div>

      <div className="results-head">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          코스 편집
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn-outline" onClick={undo} disabled={!canUndo}>
            ↶ 실행 취소
          </button>
          <button type="button" className="btn-outline" onClick={redo} disabled={!canRedo}>
            ↷ 다시 실행
          </button>
        </div>
      </div>

      {current.days.length > 1 && (
        <div className="day-tabs" style={{ marginTop: 20 }}>
          {current.days.map((d) => (
            <button
              type="button"
              key={d.day_index}
              className={`day-tab${activeDay === d.day_index ? " active" : ""}`}
              onClick={() => setActiveDay(d.day_index)}
            >
              {d.day_index}일차
            </button>
          ))}
        </div>
      )}

      <div className="candidate-stats" style={{ margin: "20px 0", maxWidth: 480 }}>
        <div className="candidate-stat">
          <div className="k">장소 수</div>
          <div className="v">{day.items.length}곳</div>
        </div>
        <div className="candidate-stat">
          <div className="k">총 체류</div>
          <div className="v">{Math.round(totalStay / 60)}h {totalStay % 60}m</div>
        </div>
        <div className="candidate-stat">
          <div className="k">이동 거리</div>
          <div className="v">{totalTravel}분</div>
        </div>
        <div className="candidate-stat">
          <div className="k">여유 시간</div>
          <div className="v">{slackMin}분</div>
        </div>
      </div>

      {violations.length > 0 && (
        <div className="violation-banner">
          <span>⚠ 제약 확인 필요 — {violations[0].detail}</span>
          <button type="button" className="btn-outline" onClick={() => setShowViolations(true)}>
            상세 확인
          </button>
        </div>
      )}

      <div className="edit-list">
        {day.items.map((item, idx) => (
          <div className="edit-item" key={item.order}>
            <div className="edit-item-order mono">{idx + 1}</div>
            <div className="edit-item-body">
              <div className="edit-item-top">
                <span className="edit-item-title">
                  {item.place.title}
                  {item.locked && <span title="고정됨"> 🔒</span>}
                </span>
                <span className="tl-stay mono">
                  {hhmm(item.arrive_at)} 도착 · 체류 {item.stay_min}분 · {hhmm(item.depart_at)} 출발
                </span>
              </div>
              <div className="edit-item-actions">
                <button type="button" onClick={() => runOp("reorder", { item_order: item.order, direction: "up" })} disabled={idx === 0 || item.locked}>
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => runOp("reorder", { item_order: item.order, direction: "down" })}
                  disabled={idx === day.items.length - 1 || item.locked}
                >
                  ↓
                </button>
                <button type="button" onClick={() => runOp("lock", { item_order: item.order })}>
                  {item.locked ? "고정 해제" : "고정"}
                </button>
                <button type="button" onClick={() => openStayEdit(item)}>
                  체류시간 변경
                </button>
                <button type="button" onClick={() => runOp("swap", { item_order: item.order })} disabled={item.locked}>
                  교체
                </button>
                <button type="button" onClick={() => runOp("remove", { item_order: item.order })} disabled={item.locked}>
                  삭제
                </button>
              </div>
            </div>
            {idx < day.items.length - 1 && (
              <div className="tl-transit" style={{ margin: "10px 0 0 44px" }}>
                이동 {day.items[idx + 1].travel_min_from_prev ?? 0}분 →
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" className="btn-outline" style={{ marginTop: 16 }} onClick={() => runOp("add")}>
        + 장소 추가
      </button>

      <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
        <Link className="btn-outline" to={`/trip/${id}`}>
          코스 상세로 돌아가기
        </Link>
        <button type="button" className="btn-primary" onClick={handleSaveChanges} disabled={commitTrip.isPending}>
          {commitTrip.isPending ? "저장 중…" : saved ? "저장됨 ✓" : "변경사항 저장"}
        </button>
      </div>

      {showViolations && <ConstraintViolationSheet violations={violations} onClose={() => setShowViolations(false)} />}

      {stayEditItem && (
        <Modal title="체류시간 변경" onClose={() => setStayEditItem(null)}>
          <p style={{ marginBottom: 16 }}>{stayEditItem.place.title}</p>
          <div className="time-box" style={{ display: "inline-flex" }}>
            <button type="button" className="stepper-btn" onClick={() => setStayDraft((v) => Math.max(15, v - 15))}>
              –
            </button>
            <span className="time-val mono">{stayDraft}분</span>
            <button type="button" className="stepper-btn" onClick={() => setStayDraft((v) => v + 15)}>
              +
            </button>
          </div>
          <p style={{ marginTop: 14, fontSize: 11.5 }}>변경 이후 일정이 자동으로 재계산됩니다.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setStayEditItem(null)}>
              취소
            </button>
            <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={confirmStayEdit}>
              적용
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
