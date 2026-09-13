import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Modal from "./Modal";
import { askPlace, getPlaceDetail } from "../api/places";
import type { AskPlaceResponse, PlaceDetail, SearchPlace } from "../api/types";

interface PlaceDetailSheetProps {
  /** 코스 상세(PlaceSummary)에서 열 때는 stay_time_minutes(권장 체류시간)도 같이 온다. */
  place: SearchPlace & Partial<PlaceDetail>;
  onClose: () => void;
}

/** DB에 값이 없으면 빈 문자열 대신 "Unknown" 문자열로 들어오는 경우가 있어, 둘 다 "값 없음"으로 취급한다. */
function hasValue(v: string): boolean {
  return Boolean(v) && v.trim().toLowerCase() !== "unknown";
}

/** 운영시간 원문은 " / " 로 여러 줄이 이어져 오므로 줄 단위로 끊어 보여준다. */
function hoursLines(raw: string): string[] {
  return raw
    .split(/\s*\/\s*/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** 장소 소개는 문장(온점) 단위로 최대 3문장, 대략 100자 내로 줄여서 보여준다. */
function summarizeOverview(overview: string): string {
  if (!overview) return "";
  const sentences = overview
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  let text = sentences.join(". ");
  if (text && !/[.!?]$/.test(text)) text += ".";
  if (text.length > 100) text = `${text.slice(0, 100).trim()}…`;
  return text;
}

interface FactField {
  key: string;
  icon: string;
  label: string;
  value: string;
}

export default function PlaceDetailSheet({ place, onClose }: PlaceDetailSheetProps) {
  // 목록에서 넘어온 값으로 즉시 그리고, 상세가 도착하면 그 위에 덮는다.
  // 실패해도 목록 값이 남으므로 로딩·에러 UI가 필요 없다.
  const { data: detail } = useQuery({
    queryKey: ["place", place.content_id],
    queryFn: () => getPlaceDetail(place.content_id),
    // 전역 default에 staleTime이 없어, 안 주면 창 포커스마다 다시 부른다. 장소 정보는 안 변한다.
    staleTime: Infinity,
  });
  // 상세엔 menu/featured_menu가 없어 목록에서 받은 값이 그대로 살아남는다.
  const p: SearchPlace & Partial<PlaceDetail> = { ...place, ...detail };

  // 원본으로 확대해 보고 있는 사진. 빈 문자열이면 안 띄운다.
  const [zoomed, setZoomed] = useState("");

  // 서버가 같은 사진 URL을 두 번씩 담아 보내서 중복을 걷어낸다. 사진이 없는 장소는 빈 배열이다.
  const photos = [...new Set(p.images ?? [])];

  const hours = hasValue(p.hours_raw) ? hoursLines(p.hours_raw) : [];
  const isRestaurant = p.content_type_name === "음식점";
  const menu = hasValue(p.menu) ? p.menu : "";
  const featuredMenu = hasValue(p.featured_menu) ? p.featured_menu : "";

  // 운영시간이 한 줄뿐이면(예: "상시 개방") 다른 항목처럼 측정 대상에 넣어 짧으면 같이 짝지어준다.
  // 두 줄 이상(시설별로 따로 안내되는 경우)이면 가독성을 위해 항상 한 행 전체를 쓴다.
  const singleLineHours = hours.length === 1 ? hours[0] : "";
  const multiLineHours = hours.length > 1 ? hours : [];

  const fields: FactField[] = [
    { key: "address", icon: "📍", label: "주소", value: hasValue(p.address) ? p.address : "" },
    { key: "parking", icon: "🅿️", label: "주차", value: hasValue(p.parking) ? p.parking : "" },
    { key: "contact", icon: "📞", label: "연락처", value: hasValue(p.contact) ? p.contact : "" },
    { key: "hours", icon: "🕐", label: "운영시간", value: singleLineHours },
    { key: "closed", icon: "🚫", label: "휴무일", value: hasValue(p.closed_days_raw) ? p.closed_days_raw : "" },
    { key: "fees", icon: "💰", label: "이용요금", value: hasValue(p.fees) ? p.fees : "" },
    {
      key: "stay",
      icon: "⏱️",
      label: "권장 체류",
      value: p.stay_time_minutes != null ? `${p.stay_time_minutes}분` : "",
    },
  ].filter((f) => f.value);

  // 실제로 반 칸 안에서 줄바꿈이 일어나는(=넘치는) 항목만 한 행 전체로 넓힌다. 글자 수로 짐작하지 않고 직접 잰다.
  const valueRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [wideKeys, setWideKeys] = useState<Set<string>>(new Set());

  // RAG 문답. 서버가 이전 문답을 기억하지 않아서, 지난 문답은 시트가 열려 있는 동안만 여기 쌓아 둔다.
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<AskPlaceResponse[]>([]);
  const ask = useMutation({
    mutationFn: (q: string) => askPlace(p.content_id, q),
    onSuccess: (res) => setThread((prev) => [...prev, res]),
  });

  function submitAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || ask.isPending) return;
    setQuestion("");
    ask.mutate(q);
  }

  useLayoutEffect(() => {
    const next = new Set<string>();
    for (const f of fields) {
      const el = valueRefs.current[f.key];
      if (!el) continue;
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight || "18") || 18;
      if (el.scrollHeight > lineHeight * 1.4) next.add(f.key);
    }
    setWideKeys(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.content_id, fields.map((f) => f.value).join("|")]);

  return (
    <Modal title={p.title} onClose={onClose}>
      <div className="place-detail-sheet">
        {photos.length > 0 ? (
          <div className="place-sheet-photos">
            {photos.map((src) => (
              // 시트 안에서는 160px로 잘라 보여주고, 누르면 같은 화면 위에 원본을 덮어 띄운다.
              // 페이지 이동이 아니라서 닫으면 상세 시트가 그대로 남는다.
              <button key={src} type="button" onClick={() => setZoomed(src)}>
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  // 링크가 깨진 사진은 깨진 아이콘 대신 칸째로 숨긴다.
                  onError={(e) => {
                    e.currentTarget.parentElement!.hidden = true;
                  }}
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="place-sheet-photo" />
        )}

        {zoomed && (
          // 오버레이 전체가 버튼이라 아무 데나 누르거나 엔터를 쳐도 닫힌다.
          <button type="button" className="photo-zoom" aria-label="사진 닫기" onClick={() => setZoomed("")}>
            <img src={zoomed} alt="" />
          </button>
        )}

        <p style={{ marginBottom: 16 }}>
          {p.content_type_name}
          {p.small_category_name ? ` · ${p.small_category_name}` : ""}
        </p>

        <div className="place-fact-grid">
          {fields.map((f) => (
            <div key={f.key} className={`fact-item ${wideKeys.has(f.key) ? "fact-span-2" : ""}`}>
              <div className="override-label">
                {f.icon} {f.label}
              </div>
              <div
                ref={(el) => {
                  valueRefs.current[f.key] = el;
                }}
              >
                {f.value}
              </div>
            </div>
          ))}

          {multiLineHours.length > 0 && (
            <div className="fact-item fact-span-2">
              <div className="override-label">🕐 운영시간</div>
              {multiLineHours.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}
        </div>

        <div className="override-section">
          <div className="override-label">📝 장소 소개</div>
          {/* 서버 요약(overview_summary)이 있으면 그대로 쓴다. 이미 요약문이라 100자 컷을 또 먹이면 뭉개진다. */}
          <p>
            {p.overview_summary ||
              summarizeOverview(p.overview) ||
              "이 장소에 대한 설명이 아직 없어요."}
          </p>
        </div>

        {isRestaurant && (menu || featuredMenu) && (
          <div className="override-section">
            <div className="override-label">🍽️ 메뉴</div>
            {featuredMenu && <p>대표 메뉴: {featuredMenu}</p>}
            {menu && <p>{menu}</p>}
          </div>
        )}

        <div className="override-section">
          <div className="override-label">💬 이 장소에 물어보기</div>

          {(thread.length > 0 || ask.isPending) && (
            <div className="chat-thread" style={{ marginTop: 0, marginBottom: 14 }}>
              {thread.map((qa, i) => (
                <Fragment key={i}>
                  <div className="chat-bubble user">{qa.question}</div>
                  <div className="chat-bubble assistant">{qa.answer}</div>
                </Fragment>
              ))}
              {ask.isPending && (
                <>
                  {/* 보낸 질문(ask.variables)을 답이 오기 전에 먼저 띄운다. */}
                  <div className="chat-bubble user">{ask.variables}</div>
                  <div className="chat-bubble assistant">답변을 찾는 중…</div>
                </>
              )}
            </div>
          )}

          <form className="search-bar" style={{ marginTop: 0 }} onSubmit={submitAsk}>
            <input
              className="search-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예: 여기 주차 가능한가요?"
            />
            <button type="submit" className="btn-primary" disabled={ask.isPending || !question.trim()}>
              질문
            </button>
          </form>

          {ask.isError && <p className="lodging-warn">답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.</p>}
        </div>

        <div className="auth-error-banner" style={{ background: "var(--paper-deep)", borderColor: "var(--line)" }}>
          <b style={{ color: "var(--ink)", fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700 }}>확인 필요 정보</b>
          <p>데이터 최신성을 보장하지 않습니다. 실제 방문 전 운영 여부를 공식 채널에서 확인하세요.</p>
        </div>
      </div>
    </Modal>
  );
}
