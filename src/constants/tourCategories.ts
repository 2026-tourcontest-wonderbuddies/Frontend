// TourAPI 관광 카테고리 — 대분류 5개 / 중분류 27개.
// 지금은 중분류 "이름"을 그대로 payload에 실어 보낸다. 백엔드가 cat2 코드를 요구하면
// TourCategoryGroup에 code 필드를 붙이고 CategoryExcludePicker의 값만 바꾸면 된다.

export interface TourCategoryGroup {
  major: string;
  minors: string[];
}

export const TOUR_CATEGORIES: TourCategoryGroup[] = [
  {
    major: "자연관광",
    minors: ["자연경관(산)", "자연경관(하천·해양)", "자연공원", "자연생태", "기타자연관광"],
  },
  {
    major: "문화관광",
    minors: [
      "전시시설",
      "테마공원",
      "도시공원",
      "도시·지역문화관광",
      "랜드마크관광",
      "기타문화관광지",
      "교육시설",
      "공연시설",
      "복합관광시설",
    ],
  },
  {
    major: "체험관광",
    minors: ["농·산·어촌 체험", "기타체험", "산업관광", "웰니스관광", "전통체험", "공예체험"],
  },
  {
    major: "역사관광",
    minors: ["역사유적지", "종교성지", "역사유물"],
  },
  {
    major: "쇼핑",
    minors: ["면세점", "전문매장/상가", "시장", "기타쇼핑시설"],
  },
];

export const ALL_MINOR_CATEGORIES: string[] = TOUR_CATEGORIES.flatMap((g) => g.minors);
