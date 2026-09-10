# 시간여행 제주 — 프론트엔드 팀 공유 문서

## 0. 최근 변경 (실 API 연동)

프론트가 자체 작성한 계약(`API_CONTRACT.md` 구버전) + MSW 목업 위에서 만들어져 있었고,
그 결과 **화면이 실제로 부르던 API 20개 중 19개가 서버에 없는 주소**였습니다.
Notion `04. 개발 / API 명세서`를 기준으로 전면 재연동했습니다.

- 기준 문서: <https://app.notion.com/p/3d14958c0857803582a3dabebd95341a?v=3d14958c085780d79bd0000cc6fe2852>
- **MSW 목업 레이어를 걷어냈습니다.** 이제 항상 `VITE_API_BASE_URL`의 실제 서버를 호출합니다.
  (`VITE_USE_MOCKS` 환경변수는 없어졌습니다.)
- 명세에 대응 엔드포인트가 없는 화면(검색·저장·편집·채팅·이메일 가입)은 `src/deferred/`로
  옮기고 해당 경로에 `ComingSoon`을 띄웁니다. → `src/deferred/README.md`

## 1. 실행 방법

```bash
npm install
cp .env.example .env.local   # VITE_API_BASE_URL 확인
npm run dev
```

`http://localhost:5173`에서 확인할 수 있습니다.

- **백엔드가 떠 있어야 동작합니다.** `.env.local`의 `VITE_API_BASE_URL`이 가리키는 서버를 씁니다.
  기본값은 배포 서버(`https://tourcontest-backend.onrender.com/api`)입니다.
- 로컬 Django로 붙이려면 `VITE_API_BASE_URL=http://127.0.0.1:8000/api`로 바꾸세요.
  Django `CORS_ALLOWED_ORIGINS`에 `http://localhost:5173`이 이미 들어 있습니다.
- 타입체크 + 프로덕션 빌드: `npm run build` / 린트: `npm run lint`

## 2. 주요 폴더 구조

```
src/
  api/
    client.ts           공통 fetch 래퍼 (Authorization: Token 부착, 에러 처리)
    trips.ts            명세 1·2번  (코스 생성, 코스 목록)
    courses.ts          명세 3~8번  (상세, 장소, 숙소 옵션/선택, 확정, 수정)
    auth.ts             명세 11번   (구글 로그인)
    types.ts            명세서 기준 타입 (CourseDetail, LodgingCard, PlaceSummary …)
  hooks/
    useCourses.ts       위 API의 react-query 래퍼
    useCreateTrip.ts
  utils/course.ts       코스 응답에서 방문 수·체류/이동 시간을 계산 (서버가 안 주는 값)
  deferred/             명세에 엔드포인트가 없어 보류한 화면 — 타입체크 제외
```

페이지는 `fetch`를 직접 부르지 않고 `hooks/` → `api/` → `api/client.ts` 순서로 내려갑니다.

## 3. 라우팅(화면) 상태

| 경로 | 화면 | 상태 |
|---|---|---|
| `/` | 홈 | ✅ 정적 |
| `/builder` | 코스 만들기 | ✅ `POST /api/trips/` |
| `/trips/:tripId/courses` | 생성된 코스 3개 중 선택 | ✅ 명세 2·4번 |
| `/trips/:tripId/courses/:courseId/lodging` | 숙소 선택 후 확정 | ✅ 명세 6·7·3번 |
| `/trip/:id` | 코스 상세 (타임라인) — `:id`는 **course_id** | ✅ 명세 4번 |
| `/trip/:id/map` | 코스 지도 | ✅ 명세 4번 + 카카오맵 SDK |
| `/login` | 구글 로그인 | ✅ 명세 11번 |
| `/list` | 추천 코스 목록 | ⚪ 정적 목업 — 백엔드에 "공개 코스" 모델이 없음 |
| `/search` | 장소 검색 | ⚪ 프론트 단독 — 대응 엔드포인트 없음, 시드 10곳을 클라이언트 필터링 |
| `/saved`, `/saved/map` | 저장함(찜) | ⚪ 프론트 단독 — 대응 엔드포인트 없음, `localStorage`에만 저장 |
| `/trip/:id/edit`, `/trip/:id/chat`, `/signup` | — | ⛔ 보류 (`ComingSoon`) |

## 4. 백엔드 팀에게 확인 요청

### 명세서 정정이 필요해 보이는 항목

1. **3번 행 `/api/courses/{course_id}/select/`에 ✖️ 아이콘**이 붙어 있습니다. 폐기된 API인가요?
   백엔드에는 구현되어 있어서 일단 연결해 뒀습니다.
2. **6번 행 경로에 `/days/{day_index}/`** 가 있는데 백엔드는 `/courses/{id}/lodging-options/`입니다.
   7번 행 설명("여행 전체 앵커라 Day 단위 아님")과 백엔드가 일치하므로 명세서 오타로 보고 백엔드를 따랐습니다.
3. **8번 행 Method가 `get`** 인데 백엔드는 `POST` + `{raw_message}` 입니다. 백엔드를 따랐습니다.
4. **9번 행 `/api/places/{content_id}/` Method가 `post`** 입니다. 장소 상세 조회면 GET이 맞을 것 같습니다.
   (백엔드에도 아직 없어 미연동)

### 버그

- `POST /api/courses/{id}/modify/` 는 현재 **항상 500**입니다.
  `apps/nlp/modification_interpreter.py`에서 정의되지 않은 `client` 변수를 호출합니다
  (`_get_client()`를 쓰려던 것으로 보입니다). 같은 문제가 `generate_result_explanation`에도 있습니다.

### 권한

- 명세 11번은 "모든 API 헤더에 토큰"이라고 되어 있고 프론트도 모든 요청에 붙이고 있습니다.
  다만 현재 백엔드 `/api/`에는 `DEFAULT_PERMISSION_CLASSES`가 없어 `AllowAny`입니다.
  누구나 임의의 `trip_id`/`course_id`를 조회·수정할 수 있습니다.
- `GoogleLoginView.callback_url`이 `http://localhost:3000`으로 하드코딩되어 있습니다.
  프론트는 5173이고 배포는 onrender 도메인입니다. (access_token 방식이라 지금은 문제 없지만
  `code` 방식으로 바꾸면 걸립니다.)

### 추가 요청

아래 1~3번은 **프론트 화면 구성이 확정된 사항**이라 서버 지원이 필요합니다.

#### 1. 명세 1번에 `day_overrides` 추가 (일자별 개별 조건)

다일 여행에서 날짜마다 목적·권역·제외 카테고리, 그리고 **하루 활동 시간대**를 다르게 두는 것이
빌더의 확정 화면 구성입니다.
현재는 서버에 대응 필드가 없어 사용자가 입력한 값을 보내지 못하고 있습니다.

프론트 타입은 이미 확정돼 있습니다(`src/api/types.ts`의 `DayOverridePayload`).
명세 1번 request body에 아래 형태로 추가해 주실 수 있을까요?

```json
"day_overrides": [
  {
    "day_index": 2,
    "purpose_main": "activity",
    "purpose_sub": "food",
    "region_preference": "NE",
    "exclude_categories": ["자연관광"],
    "start_hour": 9,
    "end_hour": 21
  }
]
```

- `day_index`는 1부터 시작합니다 (1일차, 2일차 …).
- 배열에 없는 날짜는 공통 조건을 그대로 적용합니다.
- 각 필드는 생략 가능하며, 생략하면 그 항목만 공통값을 씁니다.
- `region_preference`는 명세 1번과 동일한 `NE | NW | SE | SW | ALL` 코드로 보냅니다.
- `purpose_main` / `purpose_sub`도 명세 1번과 동일한 값입니다.
- `start_hour` / `end_hour`는 **그 날의 활동 시간대**입니다(정시 단위, 0~24).
  다일 여행은 `start_datetime`·`end_datetime`만으로는 1일차 시작과 마지막 날 종료밖에 알 수 없어
  2일차 이후 하루를 몇 시부터 몇 시까지 쓰는지가 비어 있었습니다. 이 두 필드가 그 구멍을 메웁니다.
- 1일차의 `start_hour`와 마지막 날의 `end_hour`는 `start_datetime`·`end_datetime`과 중복이라 보내지 않습니다.
  그 사이 날짜는 사용자가 따로 정하지 않으면 프론트가 기본값 **09~21시**로 채워 보냅니다.

#### 2. `exclude_categories`를 삭제하지 말아 주세요

명세 1번 본문에 `"exclude_categories": []  # 삭제 예정`이라고 적혀 있는데, 프론트는 이 값을
위 1번의 일자별 조건에서 **계속 사용할 예정**입니다. 제외할 TourAPI 중분류를 날짜별로 고르는
입력이 이미 화면에 있습니다.

여행 전체 단위로 남기든 `day_overrides` 안에만 두든 상관없지만 **어느 쪽으로든 유지가 필요**합니다.
삭제가 확정이라면 같은 목적을 달성할 대체 수단이 있는지 알려주세요.

#### 3. 코스 생성 전 숙소 추천 엔드포인트 신설

빌더 위저드는 `1 일정 → 2 목적·권역 → 3 취향 → 4 숙박 조건 → 5 숙소 고르기 → 코스 생성`
순서인데, **스텝 5에 대응하는 API가 명세 1~11번에 없습니다.** 숙소 관련 엔드포인트(명세 6·7번)는
전부 코스가 만들어진 *뒤*에만 쓸 수 있어서, 스텝 5는 임시 더미 데이터로 돌고 있고 사용자가 고른
값은 버려집니다.

제안 (형태는 조정 가능합니다):

- `POST /api/lodging/suggest/`
- request — 명세 1번 필드의 부분집합

```json
{
  "start_datetime": "2026-09-10T14:00:00+09:00",
  "end_datetime": "2026-09-12T17:00:00+09:00",
  "guests": 4,
  "region_preference": "SE",
  "lodging_type": "상관없음",
  "lodging_need_cooking": false,
  "lodging_free_text": ""
}
```

- response — **명세 6번 응답의 `lodging_options` 배열과 동일한 형태**면 됩니다.
  프론트가 이미 같은 타입(`LodgingCard`)을 쓰고 있어 그대로 붙습니다.
  코스가 없는 시점이라 `travel_min`, `travel_min_by_night` 같은 이동시간 필드는
  `null`이거나 빠져 있어도 됩니다.

**대안**: 이 엔드포인트가 설계상 맞지 않다면, 스텝 5를 없애고 숙소 선택을 코스 생성 후
`LodgingPage`(명세 6·7번) 한 곳으로 일원화하겠습니다. 어느 쪽이 나은지 회신 부탁드립니다.

> 요청/응답 필드, 화면이 실제로 쓰는 `LodgingCard` 필드 목록, 이 시점에 채울 수 없는 필드
> (`travel_min` 계열)까지 정리한 **상세 계약은 `API_CONTRACT.md`의 `## 요청 중인 엔드포인트`** 에 있습니다.

#### 4. 명세 1번에 `lodging_content_id` 추가 (3번과 한 묶음)

3번으로 숙소를 추천받아도 **사용자가 고른 숙소를 코스 생성에 반영할 방법이 없습니다.**
명세 1번 request에 대응 필드가 없어서, 지금은 스텝 5에서 고른 값이 그대로 버려집니다.

```json
{ "lodging_content_id": "142785" }
```

- **선택 필드**입니다. 값이 없으면 지금 동작 그대로라 하위 호환이 깨지지 않습니다.
- 값이 오면 코스 생성 시 그 숙소를 앵커로 고정하고, 생성되는 3개 코스의 각 Day
  `lodging_snapshot`에 반영해 주세요. 명세 7번 `select-lodging`을 생성 시점에 미리
  적용한 것과 같은 결과입니다.

3번만 있고 4번이 없으면 "보여주기만 하고 코스에는 반영되지 않는" 반쪽이 되므로,
**두 건을 함께 검토해 주시면 좋겠습니다.**

함께 정해야 할 것:

1. 추천 개수는 top3 고정인가요, `limit` 파라미터를 받나요?
2. 조건에 맞는 숙소가 0건이면 200 + 빈 배열로 봐도 될까요?
3. `lodging_content_id`가 유효하지 않은 값이면 400인가요, 무시하고 기본 동작인가요?
4. 고른 숙소가 생성된 코스 동선과 지나치게 멀면 코스를 숙소에 맞춰 조정하나요?
5. 4번으로 미리 정한 뒤에도 `LodgingPage`에서 숙소를 바꾸는 흐름(명세 6·7번)은 계속 유효한가요?

#### 그 외

- 코스 상세 응답에 **요청 조건(목적·권역) 에코**가 있으면 좋겠습니다.
  지금 상세 화면은 사용자가 뭘 요청했는지 표시할 방법이 없습니다.
- 명세에 없는 5개 기능(장소 검색, 저장/찜, 코스 수동 편집, 챗봇, 이메일 가입)을 명세서에 추가할지
  결정이 필요합니다. 화면은 이미 만들어져 있습니다.
  이 중 **장소 검색과 저장/찜은 화면을 살려 두려고 프론트 단독으로 돌리고 있습니다** —
  검색은 프론트에 박아둔 시드 10곳만 나오고, 저장함은 브라우저 localStorage 라 기기를 옮기면
  사라집니다. 아래 엔드포인트가 생기면 바로 갈아끼울 수 있게 해뒀습니다.
  - `GET /api/places/search?q&category&region`
  - `GET/POST/DELETE /api/saved/places`, `/api/saved/courses`
