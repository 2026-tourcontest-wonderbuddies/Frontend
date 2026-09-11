# API 계약

> **이 문서는 더 이상 계약의 기준이 아닙니다.**
>
> 기준은 Notion `04. 개발 / API 명세서` 데이터베이스입니다.
> <https://app.notion.com/p/3d14958c0857803582a3dabebd95341a?v=3d14958c085780d79bd0000cc6fe2852>
>
> 예전 버전의 이 문서는 백엔드와 무관하게 프론트에서 자체 설계한 계약을 담고 있었고,
> 그 결과 화면이 실제로 부르던 API 20개 중 19개가 서버에 없는 주소였습니다.
> 스키마·필드 정의는 반드시 위 Notion 명세서를 보세요. 아래는 프론트 구현 상태 요약입니다.

## 기본 규약

| 항목 | 값 |
|---|---|
| 베이스 URL | `VITE_API_BASE_URL` (예: `https://tourcontest-backend.onrender.com/api`) |
| 인증 헤더 | `Authorization: Token {key}` — DRF `TokenAuthentication` (Bearer 아님) |
| 토큰 발급 | `POST /api/auth/google/` 응답의 `key` |
| 토큰 보관 | `localStorage["tj_auth"]` = `{ user, token }` |
| 트레일링 슬래시 | **필수.** Django `APPEND_SLASH`가 켜져 있어 POST는 리다이렉트되지 않습니다 |
| 시각 포맷 | ISO 8601 + 오프셋. 서버 `TIME_ZONE`이 UTC라 `+09:00`을 반드시 붙입니다 |

구현: `src/api/client.ts`

## 연동된 엔드포인트

명세서 번호 → 프론트 함수 대응표. 요청/응답 스키마는 명세서 각 행의 본문을 보세요.

| 명세 # | 엔드포인트 | 프론트 함수 | 쓰는 화면 |
|---|---|---|---|
| 1 | `POST /api/trips/` | `createTrip()` `src/api/trips.ts` | BuilderPage |
| 2 | `GET /api/trips/{trip_id}/courses/` | `getTripCourses()` `src/api/trips.ts` | CoursesPage |
| 3 | `POST /api/courses/{course_id}/select/` | `selectCourse()` `src/api/courses.ts` | CoursesPage, LodgingPage |
| 4 | `GET /api/courses/{course_id}/` | `getCourse()` `src/api/courses.ts` | CoursesPage, DetailPage, MapPage, LodgingPage |
| 5 | `GET /api/courses/{course_id}/places/` | `getCoursePlaces()` `src/api/courses.ts` | (아직 화면 없음) |
| 6 | `GET /api/courses/{course_id}/lodging-options/` | `getCourseLodgingOptions()` `src/api/courses.ts` | LodgingPage |
| 7 | `POST /api/courses/{course_id}/select-lodging/` | `selectCourseLodging()` `src/api/courses.ts` | LodgingPage |
| 8 | `POST /api/courses/{course_id}/modify/` | `modifyCourse()` `src/api/courses.ts` | (아직 화면 없음) |
| 11 | `POST /api/auth/google/` | `loginWithGoogle()` `src/api/auth.ts` | LoginPage |

명세 9·10번(`/api/places/{content_id}/`, `/ask/`)은 백엔드에도 아직 없어 미연동입니다.

### 명세서와 백엔드가 다른 지점 (백엔드 실제 라우트를 따름)

| 명세 # | 명세서 | 백엔드 실제 | 프론트 |
|---|---|---|---|
| 6 | `/courses/{id}/days/{day_index}/lodging-options/` | `/courses/{id}/lodging-options/` | 백엔드 따름 (숙소는 여행 전체 앵커라 Day 단위가 아님 — 명세 7번 설명과 일치) |
| 8 | Method `get` | `POST` + body `{raw_message}` | 백엔드 따름 |
| 9 | Method `post` | 미구현 | 미연동 |

## 화면 흐름

```
BuilderPage
  └ POST /api/trips/            → { trip_id, course_ids: {dist, pref, relax} }
       (일자별 개별 조건은 대응 필드가 없어 전송되지 않음)
       ↓ /trips/{trip_id}/courses
CoursesPage
  ├ GET /api/trips/{trip_id}/courses/    → 코스 3개의 id
  └ GET /api/courses/{id}/ × 3           → 각 코스 상세 (카드 지표는 여기서 계산)
       ↓ 숙소 추천이 있으면 /trips/{trip_id}/courses/{course_id}/lodging
LodgingPage
  ├ GET  /api/courses/{id}/lodging-options/
  ├ POST /api/courses/{id}/select-lodging/  { content_id }
  └ POST /api/courses/{id}/select/
       ↓ /trip/{course_id}
DetailPage / MapPage
  └ GET /api/courses/{course_id}/
```

라우트의 `:id` / `:courseId`는 **course_id**, `:tripId`는 **trip_id**입니다.

## 백엔드가 안 주는 값 (프론트에서 계산하거나 표시하지 않음)

| 값 | 처리 |
|---|---|
| 코스 라벨 | `mode`(dist/pref/relax) → `PRIORITY_LABELS` |
| 방문 수 / 총 소요시간 / 이동시간 | `days[].items[]`에서 계산 (`src/utils/course.ts`) |
| 총 이동거리, 여유시간, 5점 척도 점수, 배지 | 데이터 없음 → 미표시. `final_score`로 대체 |
| 여행 요청 조건(목적·권역) | 코스 응답에 없음 → 상세 화면은 `mode`와 숙소 스냅샷의 `region`을 표시 |
| 일자별 개별 조건(`day_overrides`) | 서버에 필드 없음 → 추가 요청 중(`TEAM_SHARE.md`). 필드가 생기면 `buildPayload()`에서 그대로 전송 |
| 코스 생성 전 숙소 추천 | **요청 철회.** 추천 알고리즘이 코스 결과에 의존해 코스 없이는 성립하지 않습니다(아래 참조). 숙소 선택은 코스 생성 후 `LodgingPage`(명세 6·7번) 한 곳으로 일원화했습니다 |

## 미연동 기능

장소 검색, 저장(찜), 코스 수동 편집, 챗봇, 이메일 로그인·회원가입은 명세서에 대응
엔드포인트가 없습니다.

- **코스 수동 편집, 챗봇, 이메일 회원가입** — 보류. 화면 코드는 `src/deferred/`에 있고
  해당 라우트는 `ComingSoon`을 띄웁니다.
- **장소 검색, 저장(찜)** — 화면은 살아 있고 서버 없이 프론트 단독으로 동작합니다.
  검색은 `src/data/places.ts`의 시드 10곳을 클라이언트에서 필터링하고,
  저장함은 `src/store/saved.ts`가 `localStorage`에만 씁니다(기기·브라우저 단위).

자세한 내용과 서버가 생겼을 때 갈아끼우는 방법은 `src/deferred/README.md`를 보세요.

## 철회된 요청 (코스 생성 전 숙소 추천)

> 이전 버전의 이 문서는 `POST /api/lodging/suggest/` 신설과 명세 1번의 `lodging_content_id`
> 추가를 요청하고 있었습니다. **백엔드 알고리즘을 확인한 뒤 두 요청 모두 철회했습니다.**

빌더 위저드에서 숙박 조건을 받은 뒤 **코스를 만들기 전에** 추천 숙소를 보여주려 했으나,
숙소 추천의 핵심 신호가 코스 결과에 묶여 있어 성립하지 않습니다.

- `accommodations/recommend.py`의 `recommend_anchor()`는 `day_last_place_ids`가 비면
  `ValueError`를 던집니다. 앵커는 **그날 마지막 방문 장소에서의 이동시간**으로 고릅니다.
- 근거(같은 파일 주석): 실제 사람들이 고른 숙소는 그날 마지막 장소에서 중앙 2.8km
  (25%는 0.5km 이내), 코스 중심점 기준으로는 10.5km. 마지막 장소가 유일하게 유효한 기준점입니다.
- 정렬키는 `(등급, 이동시간합 − QueryFit, unknown_count, content_id)`입니다.
  코스가 없으면 이동시간 항이 모든 후보에게 0으로 동률이 되어 사실상 `등급 → unknown_count`
  순의 목록이 됩니다(자유입력이 없으면 QueryFit도 전부 0).

즉 코스 없이 추천하면 "조건에 맞는 숙소 목록"은 되지만 "동선에 맞는 추천"이 아닙니다.
동선 신호를 포기하지 않기로 하여 **위저드 스텝 5를 제거**하고, 숙소 선택을 코스 생성 후
`LodgingPage`(명세 6 → 7)로 일원화했습니다. `mockLodgingOptions.ts`와
`StepLodgingPick.tsx`는 삭제했습니다.

사용자 경험상 잃는 것은 없습니다 — 숙소를 고르는 단계는 그대로 있고, 더미가 아닌
실데이터로 바뀌며, 추천 순서가 실제 동선을 반영합니다.

## 남은 갭

- **`day_overrides` 미지원**: 명세 1번에 대응 필드가 없어 일자별 개별 조건을 전송하지 못합니다.
  여기에는 목적·권역·제외 카테고리뿐 아니라 **일자별 활동 시각(`start_hour`/`end_hour`)** 도 포함됩니다.
  `start_datetime`·`end_datetime`는 1일차 시작과 마지막 날 종료라서, 다일 여행의 중간 일자
  활동 시간대는 이 필드가 생기기 전까지 서버에 전달되지 않습니다(빌더 1스텝에서 입력은 받고 있습니다).
  프론트는 화면 구성을 확정했고 타입(`DayOverridePayload`, `src/api/types.ts`)도 있어서,
  서버에 필드가 추가되면 `buildPayload()`에 한 줄만 넣으면 됩니다.
  (`region_preference`는 한글 `RegionKey`라 `REGION_CODE_BY_KEY` 변환이 필요합니다.)
  덧붙여 명세 1번의 `exclude_categories`가 "삭제 예정"으로 표기돼 있는데, 일자별 조건에서
  계속 쓸 값이라 **유지를 요청**해 뒀습니다.
- **`food_cafe_balance`**: 명세 1번의 선택 필드지만 빌더에 입력 UI가 없어 보내지 않습니다.
  `"음식점중심"` / `"카페중심"`만 엔진이 인식합니다.
  (`food_pref_2`는 3스텝에서 최대 2개를 받아 **실제로 전송하고 있습니다** — 예전 기록이 틀렸습니다.)
- **권역 5분할 → 4사분면**: 빌더 UI의 한글 권역을 `REGION_CODE_BY_KEY`(`src/api/types.ts`)로
  변환해 보냅니다. 경계 정의가 실제로 일치하는지는 백엔드 확인이 필요합니다.
- **`POST /api/courses/{id}/modify/`**: 백엔드에서 항상 500이 납니다
  (`apps/nlp/modification_interpreter.py`의 미정의 `client` 변수). 화면 연결 전 수정 필요.
- **권한**: 명세 11번은 "모든 API에 토큰 필요"라고 하지만, 현재 백엔드 `/api/`는
  `AllowAny`라 누구나 임의의 `trip_id`/`course_id`를 조회할 수 있습니다.
