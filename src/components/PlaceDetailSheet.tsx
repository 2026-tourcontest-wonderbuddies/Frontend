import { useLayoutEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Modal from "./Modal";
import { getPlaceDetail } from "../api/places";
import type { PlaceDetail, SearchPlace } from "../api/types";

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
        <div className="place-sheet-photo" />

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

        <div className="auth-error-banner" style={{ background: "var(--paper-deep)", borderColor: "var(--line)" }}>
          <b style={{ color: "var(--ink)", fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700 }}>확인 필요 정보</b>
          <p>데이터 최신성을 보장하지 않습니다. 실제 방문 전 운영 여부를 공식 채널에서 확인하세요.</p>
        </div>
      </div>
    </Modal>
  );
}
