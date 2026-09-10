/**
 * [백엔드 연결 이전] ⚠️ 임시 더미 데이터 — 백엔드 연동 시 이 파일을 통째로 삭제한다.
 *
 * 코스 생성 전에 조건만으로 숙소를 추천해 주는 엔드포인트가 서버에 아직 없다
 * (명세 1~11번에 대응 엔드포인트 없음). 화면을 먼저 만들기 위한 자리 채우기다.
 *
 * 타입은 새로 만들지 않고 실제 서버 응답과 같은 `LodgingCard`(명세 6번)를 그대로 쓴다.
 * TEAM_SHARE.md에 적힌 "화면이 부르던 API 20개 중 19개가 서버에 없는 주소였다" 사례를
 * 반복하지 않기 위해서다. 이러면 나중에 데이터 출처만 훅으로 바꾸면 화면은 그대로 둔다.
 *
 * travel_min 계열은 null/[]로 둔다. 코스가 없는 시점이라 서버가 붙어도 채울 수 없는 값이다.
 */
import type { LodgingCard } from "../../api/types";

export const MOCK_LODGING_OPTIONS: LodgingCard[] = [
  {
    content_id: "mock-001",
    title: "성산 오션뷰 호텔",
    address: "제주특별자치도 서귀포시 성산읍 일출로 123",
    region: "서귀포시 성산·표선",
    category: "호텔",
    lat: 33.4587,
    lon: 126.9412,
    grade: 3,
    room_type: "더블",
    room_count: 48,
    max_guests: 3,
    price_hint: "1박 12만원대",
    check_in_time: "15:00",
    check_out_time: "11:00",
    checks: [
      { name: "주차", detail: "부설 주차장 무료", status: "yes" },
      { name: "취사", detail: "객실 내 취사 불가", status: "no" },
      { name: "조식", detail: "정보 없음", status: "unknown" },
    ],
    needs_check: false,
    unknown_fields: [],
    query_fit: "일출봉과 가까워 이른 아침 일정에 유리해요.",
    travel_min: null,
    travel_min_total: null,
    travel_min_by_night: [],
    tripcom_link: "https://www.trip.com/hotels/detail/?hotelId=mock-001",
    tripcom_link_type: "hotel_detail",
    tripcom_tracked: false,
    tripcom_zone_id: "",
  },
  {
    content_id: "mock-002",
    title: "표선 바다정원 펜션",
    address: "제주특별자치도 서귀포시 표선면 민속해안로 45",
    region: "서귀포시 성산·표선",
    category: "펜션·민박",
    lat: 33.3264,
    lon: 126.8331,
    grade: null,
    room_type: "복층 원룸",
    room_count: 8,
    max_guests: 4,
    price_hint: "1박 9만원대",
    check_in_time: "16:00",
    check_out_time: "11:00",
    checks: [
      { name: "주차", detail: "동 앞 주차 가능", status: "yes" },
      { name: "취사", detail: "전 객실 취사 가능", status: "yes" },
      { name: "반려동물", detail: "동반 불가", status: "no" },
    ],
    needs_check: false,
    unknown_fields: [],
    query_fit: "취사 가능한 숙소를 원하셔서 골랐어요.",
    travel_min: null,
    travel_min_total: null,
    travel_min_by_night: [],
    tripcom_link: "https://www.trip.com/hotels/detail/?hotelId=mock-002",
    tripcom_link_type: "hotel_detail",
    tripcom_tracked: false,
    tripcom_zone_id: "",
  },
  {
    content_id: "mock-003",
    title: "함덕 올레 게스트하우스",
    address: "제주특별자치도 제주시 조천읍 조함해안로 210",
    region: "제주시 동부",
    category: "게스트하우스",
    lat: 33.5433,
    lon: 126.6692,
    grade: 2,
    room_type: "4인 도미토리",
    room_count: 12,
    max_guests: 4,
    price_hint: "1박 4만원대",
    check_in_time: "17:00",
    check_out_time: "10:00",
    checks: [
      { name: "주차", detail: "정보 없음", status: "unknown" },
      { name: "취사", detail: "공용 주방 이용", status: "yes" },
      { name: "조식", detail: "토스트·커피 제공", status: "yes" },
    ],
    needs_check: true,
    unknown_fields: ["주차"],
    query_fit: null,
    travel_min: null,
    travel_min_total: null,
    travel_min_by_night: [],
    tripcom_link: "https://www.trip.com/hotels/detail/?hotelId=mock-003",
    tripcom_link_type: "hotel_detail",
    tripcom_tracked: false,
    tripcom_zone_id: "",
  },
];
