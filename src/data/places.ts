import type { PlaceSummary, Quadrant, RegionKey } from "../api/types";
import { REGION_CODE_BY_KEY } from "../api/types";

/**
 * [백엔드 연결 이전] 장소 검색은 백엔드 API 명세에 대응 엔드포인트가 없다.
 * 서버에 `GET /api/places/search` 가 생기기 전까지 이 시드 목록을 클라이언트에서 필터링한다.
 * 엔드포인트가 생기면 이 파일 대신 API 호출로 바꾸면 된다.
 */
export interface SearchPlace extends PlaceSummary {
  /** 권역 필터용 4사분면 코드 */
  quadrant: Quadrant;
  small_category_name?: string;
  satisfaction_score?: number;
}

/** 시드 데이터에는 운영시간·요금·주차 원문이 없다. 상세 시트는 빈 값을 "확인 필요"로 표시한다. */
const UNKNOWN = { hours_raw: "", fees: "", parking: "" };

export const SEARCH_PLACES: SearchPlace[] = [
  {
    ...UNKNOWN,
    content_id: "P001",
    title: "성산일출봉 일출",
    address: "서귀포시 성산읍 성산리",
    longitude: 126.9425,
    latitude: 33.4587,
    overview: "어스름 속 응회구 정상 계단을 올라, 수평선 위로 해가 떠오르는 순간을 마주합니다.",
    content_type_name: "관광지",
    small_category_name: "자연관광지",
    quadrant: "SE",
    satisfaction_score: 4.54,
    stay_time_minutes: 60,
  },
  {
    ...UNKNOWN,
    content_id: "P002",
    title: "섭지코지",
    address: "서귀포시 성산읍 섭지코지로",
    longitude: 126.9275,
    latitude: 33.4238,
    overview: "아침 햇살 아래 등대와 유채꽃 벌판을 걷는 해안 산책로.",
    content_type_name: "관광지",
    small_category_name: "자연관광지",
    quadrant: "SE",
    satisfaction_score: 4.4,
    stay_time_minutes: 60,
  },
  {
    ...UNKNOWN,
    content_id: "P003",
    title: "광치기 해변 맛집",
    address: "서귀포시 성산읍 고성리",
    longitude: 126.9139,
    latitude: 33.4381,
    overview: "썰물 때 드러나는 넓은 여(암반) 지대를 걸으며 근처 식당에서 여유롭게 점심.",
    content_type_name: "음식점",
    small_category_name: "해산물요리",
    quadrant: "SE",
    satisfaction_score: 4.3,
    stay_time_minutes: 80,
  },
  {
    ...UNKNOWN,
    content_id: "P004",
    title: "표선해수욕장",
    address: "서귀포시 표선면 표선리",
    longitude: 126.8367,
    latitude: 33.3253,
    overview: "넓은 백사장과 얕은 수심이 특징인 해변.",
    content_type_name: "관광지",
    small_category_name: "해수욕장",
    quadrant: "SE",
    satisfaction_score: 4.56,
    stay_time_minutes: 60,
  },
  {
    ...UNKNOWN,
    content_id: "P005",
    title: "서귀포 매일 올레시장 노을",
    address: "서귀포시 중앙로",
    longitude: 126.5608,
    latitude: 33.2515,
    overview: "해질녘 붉은 빛 아래, 갓 튀긴 오메기떡과 회국수 노점이 불을 켜는 시장 골목.",
    content_type_name: "쇼핑",
    small_category_name: "전통시장",
    quadrant: "SW",
    satisfaction_score: 4.45,
    stay_time_minutes: 90,
  },
  {
    ...UNKNOWN,
    content_id: "P006",
    title: "협재해수욕장",
    address: "제주시 한림읍 협재리",
    longitude: 126.2394,
    latitude: 33.3941,
    overview: "에메랄드빛 바다와 백사장, 비양도가 보이는 서쪽 대표 해변.",
    content_type_name: "관광지",
    small_category_name: "해수욕장",
    quadrant: "NW",
    satisfaction_score: 4.5,
    stay_time_minutes: 70,
  },
  {
    ...UNKNOWN,
    content_id: "P007",
    title: "애월 카페거리",
    address: "제주시 애월읍 애월로",
    longitude: 126.3266,
    latitude: 33.4626,
    overview: "해안도로를 따라 늘어선 감성 카페와 미디어아트 전시.",
    content_type_name: "음식점",
    small_category_name: "카페",
    quadrant: "NW",
    satisfaction_score: 4.35,
    stay_time_minutes: 60,
  },
  {
    ...UNKNOWN,
    content_id: "P008",
    title: "동문재래시장 야시장",
    address: "제주시 관덕로",
    longitude: 126.5219,
    latitude: 33.5136,
    overview: "밤이면 불을 밝히는 야시장 골목, 흑돼지 꼬치와 오메기떡.",
    content_type_name: "쇼핑",
    small_category_name: "전통시장",
    quadrant: "NE",
    satisfaction_score: 4.4,
    stay_time_minutes: 90,
  },
  {
    ...UNKNOWN,
    content_id: "P009",
    title: "월정리해수욕장",
    address: "제주시 구좌읍 월정리",
    longitude: 126.7961,
    latitude: 33.5563,
    overview: "새하얀 모래와 코발트빛 바다, 해안가 카페 산책로.",
    content_type_name: "관광지",
    small_category_name: "해수욕장",
    quadrant: "NE",
    satisfaction_score: 4.48,
    stay_time_minutes: 60,
  },
  {
    ...UNKNOWN,
    content_id: "P010",
    title: "용머리해안",
    address: "서귀포시 안덕면 사계리",
    longitude: 126.3103,
    latitude: 33.2306,
    overview: "파도가 깎아낸 기암절벽 해안 산책로, 노을 명소.",
    content_type_name: "관광지",
    small_category_name: "자연관광지",
    quadrant: "SW",
    satisfaction_score: 4.42,
    stay_time_minutes: 60,
  },
];

export interface PlaceSearchFilters {
  q?: string;
  category?: string;
  region?: RegionKey | "";
}

/** 이름·주소 부분일치 + 관광 유형 + 권역. 서버 검색이 생기기 전까지 쓰는 클라이언트 필터. */
export function filterPlaces({ q, category, region }: PlaceSearchFilters): SearchPlace[] {
  const code = region ? REGION_CODE_BY_KEY[region] : undefined;
  const keyword = q?.trim().toLowerCase();

  return SEARCH_PLACES.filter((p) => {
    if (code && code !== "ALL" && p.quadrant !== code) return false;
    if (category && p.content_type_name !== category) return false;
    if (keyword && !p.title.toLowerCase().includes(keyword) && !p.address.toLowerCase().includes(keyword)) {
      return false;
    }
    return true;
  });
}
