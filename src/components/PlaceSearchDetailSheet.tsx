import { useLayoutEffect, useRef, useState } from "react";
import Modal from "./Modal";
import type { SearchPlace } from "../api/types";

interface PlaceSearchDetailSheetProps {
  place: SearchPlace;
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

export default function PlaceSearchDetailSheet({ place, onClose }: PlaceSearchDetailSheetProps) {
  const hours = hasValue(place.hours_raw) ? hoursLines(place.hours_raw) : [];
  const isRestaurant = place.content_type_name === "음식점";

  // 운영시간이 한 줄뿐이면(예: "상시 개방") 다른 항목처럼 측정 대상에 넣어 짧으면 같이 짝지어준다.
  // 두 줄 이상(시설별로 따로 안내되는 경우)이면 가독성을 위해 항상 한 행 전체를 쓴다.
  const singleLineHours = hours.length === 1 ? hours[0] : "";
  const multiLineHours = hours.length > 1 ? hours : [];

  const fields: FactField[] = [
    { key: "address", icon: "📍", label: "주소", value: hasValue(place.address) ? place.address : "" },
    { key: "parking", icon: "🅿️", label: "주차", value: hasValue(place.parking) ? place.parking : "" },
    { key: "contact", icon: "📞", label: "연락처", value: hasValue(place.contact) ? place.contact : "" },
    { key: "hours", icon: "🕐", label: "운영시간", value: singleLineHours },
    { key: "closed", icon: "🚫", label: "휴무일", value: hasValue(place.closed_days_raw) ? place.closed_days_raw : "" },
    { key: "fees", icon: "💰", label: "이용요금", value: hasValue(place.fees) ? place.fees : "" },
  ].filter((f) => f.value);

  // 실제로 반 칸 안에서 줄바꿈이 일어나는(=넘치는) 항목만 한 행 전체로 넓힌다. 글자 수로 짐작하지 않고 직접 잰다.
  const valueRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [wideKeys, setWideKeys] = useState<Set<string>>(new Set());

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
  }, [place.content_id, fields.map((f) => f.value).join("|")]);

  return (
    <Modal title={place.title} onClose={onClose}>
      <div className="place-search-detail">
        <div className="place-sheet-photo" />

        <p style={{ marginBottom: 16 }}>
          {place.content_type_name}
          {place.small_category_name ? ` · ${place.small_category_name}` : ""}
        </p>

        <div className="place-fact-grid">
          {fields.map((f) => (
            <div key={f.key} className={`fact-item ${wideKeys.has(f.key) ? "fact-span-2" : ""}`}>
              <div className="override-label">
                {f.icon} {f.label}
              </div>
              <div ref={(el) => (valueRefs.current[f.key] = el)}>{f.value}</div>
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
          <p>{summarizeOverview(place.overview) || "이 장소에 대한 설명이 아직 없어요."}</p>
        </div>

        {isRestaurant && (place.menu || place.featured_menu) && (
          <div className="override-section">
            <div className="override-label">🍽️ 메뉴</div>
            {place.featured_menu && <p>대표 메뉴: {place.featured_menu}</p>}
            {place.menu && <p>{place.menu}</p>}
          </div>
        )}

        <div className="auth-error-banner" style={{ background: "var(--paper-deep)", borderColor: "var(--line)" }}>
          <b style={{ color: "var(--ink)", fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700 }}>확인 필요 정보</b>
          <p>데이터 최신성을 보장하지 않습니다. 실제 방문 전 운영 여부를 공식 채널에서 확인하세요.</p>
        </div>
      </div>
    </Modal>
  );
}
