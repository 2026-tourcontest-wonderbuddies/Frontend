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
       (스텝 5에서 고른 숙소와 일자별 개별 조건은 대응 필드가 없어 전송되지 않음)
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
| 코스 생성 전 숙소 추천 | 대응 엔드포인트 없음(명세 1~11) → 위저드 스텝 5는 `mockLodgingOptions.ts` 더미. 신설 요청 중 |

## 미연동 기능

장소 검색, 저장(찜), 코스 수동 편집, 챗봇, 이메일 로그인·회원가입은 명세서에 대응
엔드포인트가 없습니다.

- **코스 수동 편집, 챗봇, 이메일 회원가입** — 보류. 화면 코드는 `src/deferred/`에 있고
  해당 라우트는 `ComingSoon`을 띄웁니다.
- **장소 검색, 저장(찜)** — 화면은 살아 있고 서버 없이 프론트 단독으로 동작합니다.
  검색은 `src/data/places.ts`의 시드 10곳을 클라이언트에서 필터링하고,
  저장함은 `src/store/saved.ts`가 `localStorage`에만 씁니다(기기·브라우저 단위).

자세한 내용과 서버가 생겼을 때 갈아끼우는 방법은 `src/deferred/README.md`를 보세요.

## 요청 중인 엔드포인트 (코스 생성 전 숙소 추천)

빌더 위저드에서 숙박 조건을 받은 뒤 **코스를 만들기 전에** 추천 숙소를 보여주고,
사용자가 고른 숙소를 기준으로 코스를 생성하려 합니다. 현재 명세로는 불가능합니다.

- 명세 1번 `POST /api/trips/` 응답이 `{ trip_id, course_ids }`라 **코스 3개는 이 호출 한 번에 이미 생성**됩니다.
  코스가 없는 시점은 위저드 안뿐이고, 그때는 `trip_id`도 `course_id`도 없습니다.
- 유일한 숙소 API인 명세 6번은 경로에 `course_id`가 필수라 그 시점에 호출할 수 없습니다.

화면(`src/components/builder/StepLodgingPick.tsx`)은 더미 데이터로 먼저 만들어 뒀습니다.
아래 두 가지가 생기면 더미를 훅으로 교체하는 것만으로 연동됩니다.

### (A) 신규 — 조건 기반 숙소 추천

```
POST /api/lodging/suggest/
```

> 경로는 `TEAM_SHARE.md`의 `## 4 > 추가 요청 > 3번`으로 백엔드 팀에 요청한 것과 같습니다.
> 이 문서는 그 요청의 상세 계약이며, 경로가 바뀌면 두 문서를 함께 고쳐야 합니다.

Request body는 **명세 1번 request의 부분집합**입니다. 빌더가 이미 들고 있는 값이라 새로 받을 입력이 없습니다.

```jsonc
{
  "start_datetime": "2026-09-10T14:00:00+09:00",  // 필수
  "end_datetime":   "2026-09-13T18:00:00+09:00",  // 필수 (박 수 계산용)
  "guests": 2,                                    // 필수
  "region_preference": "NE",                      // 선택. 없으면 제주 전역
  "lodging_type": "호텔",                          // 선택. "상관없음" 허용
  "lodging_need_cooking": false,                  // 선택
  "lodging_free_text": "조용하고 바다 보이는 곳"      // 선택
}
```

Response — 카드 스키마는 **명세 6번의 `LodgingCard`를 그대로 재사용**해 주세요.
프론트가 명세 6번용 렌더링을 재사용할 수 있고, 백엔드도 기존 직렬화기를 그대로 쓸 수 있습니다.

```jsonc
{
  "lodging_options": [ /* LodgingCard × 최대 3 */ ]
}
```

박 수는 프론트가 이미 폼에서 알고 있어 응답에 넣지 않아도 됩니다.

**GET이 아니라 POST인 이유**: `lodging_free_text`가 자유서술이라 쿼리스트링에 부적절하고,
명세 1번과 body를 공유하면 백엔드 검증 로직을 재사용할 수 있습니다.

#### 이 시점에 채울 수 없는 필드

코스가 없으니 "동선의 마지막 스톱에서 몇 분"이라는 기준점이 존재하지 않습니다.
지리 앵커는 `region_preference`가 대신합니다.

| 필드 | 이 엔드포인트에서 |
|---|---|
| `travel_min`, `travel_min_total` | `null` |
| `travel_min_by_night` | `[]` |

#### 화면이 실제로 쓰는 필드

화면을 먼저 만들어 확인한 결과입니다. **아래만 채워 주셔도 화면은 완성됩니다.**

| 구분 | 필드 |
|---|---|
| 필수 | `content_id`, `title`, `category`, `address` |
| 카드 본문 | `price_hint`, `room_type`, `check_in_time`, `check_out_time` |
| 조건 충족 표시 | `checks[]` (`name`, `detail`, `status`) |
| 보조 | `query_fit`, `needs_check`, `unknown_fields` |
| **현재 미사용** | `region`, `lat`, `lon`, `grade`, `room_count`, `max_guests`, `tripcom_*` |

`tripcom_*`은 예약 단계용이라 이 화면(고르기)에서는 표시하지 않습니다. 빈 문자열이어도 됩니다.

### (B) 명세 1번 확장 — 고른 숙소를 코스 생성에 반영

`POST /api/trips/` request body에 선택 필드 하나를 추가해 주세요.

```jsonc
{ "lodging_content_id": "142785" }   // 선택. (A)에서 고른 숙소
```

값이 오면 코스 생성 시 그 숙소를 앵커로 고정하고, 생성되는 3개 코스의 각 Day
`lodging_snapshot`에 반영합니다. 명세 7번 `select-lodging`을 생성 시점에 미리 적용한 것과 같습니다.
**값이 없으면 현재 동작 그대로**라 하위 호환이 깨지지 않습니다.

이 필드가 없으면 (A)는 "보여주기만 하고 코스에는 반영되지 않는" 반쪽이 됩니다. A와 B는 한 묶음입니다.

### 함께 정해야 할 것

백엔드에 물어본 미결 항목은 `TEAM_SHARE.md`의 `## 4 > 추가 요청 > 4번`에 모아 뒀습니다.
답이 오는 대로 이 문서의 계약을 확정하고, 명세서에 12·13번으로 추가 부탁드립니다.

프론트 쪽에서 미리 정해 둔 것:

- 당일치기(0박)에서는 빌더가 숙박 단계를 노출하지 않으므로 **(A)를 호출하지 않습니다.**
  서버가 이 경우를 어떻게 처리하든 화면에는 영향이 없습니다.
- (A)가 빈 배열을 주면 스텝 5는 안내 문구를 띄우고 **고르지 않은 채로 넘어갈 수 있게** 할 예정입니다.
  숙소 선택은 지금도 필수가 아니라 코스 생성을 막지 않습니다.
  (빈 목록 처리는 연동 시점에 넣습니다 — 현재 더미는 항상 3건이라 아직 구현하지 않았습니다.)

## 남은 갭

- **`day_overrides` 미지원**: 명세 1번에 대응 필드가 없어 일자별 개별 조건을 전송하지 못합니다.
  프론트는 화면 구성을 확정했고 타입(`DayOverridePayload`, `src/api/types.ts`)도 있어서,
  서버에 필드가 추가되면 `buildPayload()`에 한 줄만 넣으면 됩니다.
  (`region_preference`는 한글 `RegionKey`라 `REGION_CODE_BY_KEY` 변환이 필요합니다.)
  덧붙여 명세 1번의 `exclude_categories`가 "삭제 예정"으로 표기돼 있는데, 일자별 조건에서
  계속 쓸 값이라 **유지를 요청**해 뒀습니다.
- **위저드 스텝 5 '숙소 고르기'**: 백엔드 숙소 흐름은 전부 코스 생성 후(명세 6 → 7)라
  코스 생성 전 조건만으로 숙소를 추천하는 API가 없습니다. 그래서 스텝 5는
  `mockLodgingOptions.ts` 더미로 동작하고 고른 `lodgingContentId`는 전송되지 않습니다.
  엔드포인트 신설을 요청해 뒀고, 생기면 더미 파일을 지우고 실 API로 교체합니다.
- **`food_pref_2`, `food_cafe_balance`**: 명세 1번의 선택 필드지만 빌더에 입력 UI가 없어
  보내지 않습니다. `food_cafe_balance`는 `"음식점중심"` / `"카페중심"`만 엔진이 인식합니다.
- **권역 5분할 → 4사분면**: 빌더 UI의 한글 권역을 `REGION_CODE_BY_KEY`(`src/api/types.ts`)로
  변환해 보냅니다. 경계 정의가 실제로 일치하는지는 백엔드 확인이 필요합니다.
- **`POST /api/courses/{id}/modify/`**: 백엔드에서 항상 500이 납니다
  (`apps/nlp/modification_interpreter.py`의 미정의 `client` 변수). 화면 연결 전 수정 필요.
- **권한**: 명세 11번은 "모든 API에 토큰 필요"라고 하지만, 현재 백엔드 `/api/`는
  `AllowAny`라 누구나 임의의 `trip_id`/`course_id`를 조회할 수 있습니다.
