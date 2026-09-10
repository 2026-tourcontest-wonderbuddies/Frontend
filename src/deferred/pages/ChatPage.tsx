import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTrip } from "../hooks/useTrip";
import { useSendChatMessage } from "../hooks/useChat";
import type { ChatMessageDTO, ConstraintViolationDTO, QuickFixCode, TripResponse } from "../api/types";

const QUICK_FIXES: { code: QuickFixCode; label: string }[] = [
  { code: "lock_place", label: "장소 고정" },
  { code: "swap_place", label: "장소 교체" },
  { code: "add_place", label: "장소 추가" },
  { code: "exclude_category", label: "유형 제외" },
  { code: "indoor_focus", label: "실내 중심" },
  { code: "outdoor_focus", label: "야외 중심" },
  { code: "walk_light", label: "도보 줄이기" },
  { code: "add_slack", label: "여유 시간 추가" },
];

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: initialTrip, isLoading, isError } = useTrip(id);
  const sendChat = useSendChatMessage(id ?? "");

  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [draft, setDraft] = useState("");
  const [violations, setViolations] = useState<ConstraintViolationDTO[]>([]);

  useEffect(() => {
    if (initialTrip && !trip) setTrip(initialTrip);
  }, [initialTrip, trip]);

  if (isLoading || !trip) {
    return (
      <div className="state-panel">
        <div className="spinner" />
        <span className="serif">코스를 불러오는 중이에요</span>
      </div>
    );
  }

  if (isError || !id) {
    return (
      <div className="state-panel">
        <span className="serif">코스를 찾을 수 없어요</span>
        <button className="btn-primary" onClick={() => navigate("/builder")}>
          다시 만들기 →
        </button>
      </div>
    );
  }

  const day = trip.days.find((d) => d.day_index === activeDay) ?? trip.days[0];

  function send(payload: { message?: string; quick_fix?: QuickFixCode }) {
    sendChat.mutate(
      { day_index: day.day_index, ...payload },
      {
        onSuccess: (res) => {
          setMessages((prev) => [...prev, ...res.messages]);
          if (res.trip) setTrip(res.trip);
          setViolations(res.violations);
        },
      },
    );
    setDraft("");
  }

  return (
    <div className="wrap" style={{ padding: "40px 32px 120px" }}>
      <div className="crumb" style={{ padding: 0, marginBottom: 20 }}>
        <Link to="/">홈</Link> / <Link to={`/trip/${id}`}>코스 상세</Link> / 챗봇 수정
      </div>

      <h1 className="page-title">코스 수정 요청</h1>
      <p className="page-sub">
        수정 대상: {trip.total_days > 1 ? `${activeDay}일차 · ` : ""}
        {day.items[0]?.place.title ?? "코스"} 외 {Math.max(0, day.items.length - 1)}곳
      </p>

      {trip.days.length > 1 && (
        <div className="day-tabs" style={{ marginTop: 16 }}>
          {trip.days.map((d) => (
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

      <div className="override-section">
        <div className="override-label">빠른 수정 항목</div>
        <div className="chip-row" style={{ marginLeft: 0 }}>
          {QUICK_FIXES.map((qf) => (
            <button
              type="button"
              key={qf.code}
              className="chip"
              onClick={() => send({ quick_fix: qf.code })}
              disabled={sendChat.isPending}
            >
              {qf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-thread">
        {messages.length === 0 && (
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
            빠른 수정 버튼을 누르거나, 아래에 원하는 변경사항을 자유롭게 적어보세요.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.role}`}>
            <div className="chat-bubble-text">{m.text}</div>
            {m.structured_intent && (
              <div className="chat-bubble-intent mono">구조화된 의도: {m.structured_intent.summary}</div>
            )}
          </div>
        ))}
        {sendChat.isPending && <div className="chat-bubble assistant">재계산 중…</div>}
      </div>

      {violations.length > 0 && (
        <div className="violation-banner">
          <span>⚠ {violations[0].detail}</span>
          <Link className="btn-outline" to={`/trip/${id}/edit`}>
            편집에서 확인
          </Link>
        </div>
      )}

      <div className="tag-input-row" style={{ marginLeft: 0, marginTop: 20 }}>
        <input
          type="text"
          placeholder="코스 변경 요청을 자유롭게 입력하세요"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault();
              send({ message: draft.trim() });
            }
          }}
        />
        <button
          type="button"
          className="btn-primary"
          onClick={() => draft.trim() && send({ message: draft.trim() })}
          disabled={sendChat.isPending || !draft.trim()}
        >
          전송
        </button>
      </div>

      <div style={{ marginTop: 30 }}>
        <Link className="btn-outline" to={`/trip/${id}`}>
          코스 상세로 돌아가기
        </Link>
      </div>
    </div>
  );
}
