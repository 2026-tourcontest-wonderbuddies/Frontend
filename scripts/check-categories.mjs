// 제외 카테고리는 백엔드가 이름 문자열 완전일치로 거른다(filters.py is_excluded).
// TOUR_CATEGORIES의 중분류명이 Place.middle_category_name과 한 글자라도 다르면
// 에러 없이 "제외가 안 되는" 상태가 된다. 실제로 가운뎃점(·)/마침표(.)/U+2027 차이로
// 3개가 어긋나 있었다. 그 재발을 막는 검사.
//
//   node --experimental-strip-types scripts/check-categories.mjs
import { existsSync, readFileSync } from "node:fs";
import { ALL_MINOR_CATEGORIES } from "../src/constants/tourCategories.ts";

// Place 테이블의 출처. import_tour_api.py가 이 값을 가공 없이 그대로 넣는다.
const csvPath = new URL("../../Backend/data/jeju_places_stay_time.csv", import.meta.url);
if (!existsSync(csvPath)) {
  console.log("skip — Backend CSV가 없어 건너뜁니다 (프론트만 체크아웃한 경우)");
  process.exit(0);
}

// 따옴표 안에 콤마가 들어 있어 필드 분해는 파서가 필요하다. 여기선 필요 없다 —
// 카테고리명이 한 필드를 통째로 차지하는지만 보면 된다.
const csv = readFileSync(csvPath, "utf8");
const missing = ALL_MINOR_CATEGORIES.filter((c) => !csv.includes(`,${c},`));

if (missing.length) {
  const cps = (s) => [...s].map((c) => "U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")).join(" ");
  console.error("DB의 middle_category_name과 일치하지 않는 카테고리:");
  for (const m of missing) console.error(`  ${m}\n    ${cps(m)}`);
  process.exit(1);
}
console.log(`ok — ${ALL_MINOR_CATEGORIES.length}개 카테고리 모두 DB 값과 일치`);
