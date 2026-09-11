import type { CSSProperties } from "react";
import { kakaoPlaceUrl, type KakaoLinkablePlace } from "../utils/kakao";
import type { KakaoMapPointKind } from "./KakaoMap";

interface MapPinProps {
  /** 마커가 가리키는 장소 (이름 + 좌표) */
  place: KakaoLinkablePlace;
  /** 지도 위 절대 좌표 (top/left) */
  style?: CSSProperties;
  /** 툴팁에 쓸 이름. 기본값은 place.title */
  label?: string;
  /** 마커 색상. 없으면 기본색(방문지)으로 찍는다. */
  kind?: KakaoMapPointKind;
}

/**
 * 지도 위의 마커 하나. 클릭하면 카카오맵의 해당 장소로 이동한다.
 * 새 탭으로 열어서 사용자가 만들던 코스 화면을 잃지 않도록 한다.
 */
export default function MapPin({ place, style, label, kind }: MapPinProps) {
  const name = label ?? place.title;
  return (
    <a
      className={`map-pin map-pin--${kind ?? "visit"}`}
      style={style}
      href={kakaoPlaceUrl(place)}
      target="_blank"
      rel="noopener noreferrer"
      title={`${name} · 카카오맵에서 보기`}
      aria-label={`${name} 카카오맵에서 보기 (새 창)`}
    />
  );
}
