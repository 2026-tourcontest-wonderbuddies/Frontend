// 카카오맵 "URL 링크" 규격을 감싸는 헬퍼.
// 문서: https://apis.map.kakao.com/web/guide/#dochttpurl
//   좌표로 열기 → https://map.kakao.com/link/map/{이름},{위도},{경도}
//   이름 검색   → https://map.kakao.com/link/search/{검색어}
// PC 브라우저에서는 카카오맵 웹이 열리고, 모바일에서는 카카오맵 앱으로 연결된다.

const KAKAO_LINK_BASE = "https://map.kakao.com/link";

/** 카카오맵 링크는 쉼표로 필드를 구분하므로, 장소 이름 안의 쉼표는 공백으로 바꾼다. */
function sanitizeName(name: string): string {
  return name.replace(/,/g, " ").trim();
}

/** 백엔드/목 데이터에 좌표가 비어 있거나 0,NaN 으로 들어오는 경우를 걸러낸다. */
function hasValidCoords(latitude?: number, longitude?: number): boolean {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude !== 0 &&
    longitude !== 0
  );
}

export interface KakaoLinkablePlace {
  title: string;
  latitude?: number;
  longitude?: number;
}

/**
 * 장소 하나를 카카오맵에서 여는 딥링크를 만든다.
 * 좌표가 있으면 해당 좌표에 핀을 찍어 열고, 없으면 장소 이름 검색으로 대체한다.
 */
export function kakaoPlaceUrl(place: KakaoLinkablePlace): string {
  const name = sanitizeName(place.title);
  if (!hasValidCoords(place.latitude, place.longitude)) {
    return `${KAKAO_LINK_BASE}/search/${encodeURIComponent(name)}`;
  }
  return `${KAKAO_LINK_BASE}/map/${encodeURIComponent(name)},${place.latitude},${place.longitude}`;
}
