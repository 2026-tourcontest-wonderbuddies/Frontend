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
| `/saved`, `/saved/map` | 저장함(찜) | ✅ 장소는 `GET /api/places/saved/`·`POST/DELETE /api/places/{content_id}/save/` / ⚪ 코스는 엔드포인트가 없어 `localStorage` |
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

- 🚨 **시간대(KST) 미변환 — 모든 코스의 일정 계산이 어긋납니다.** `origin/develop` 최신
  (`2a98417`)을 로컬에서 돌려 랜덤 입력 6건으로 확인했습니다. **6건 전부 영향받았습니다.**

  `settings.py`의 `TIME_ZONE = 'UTC'`인데, 아래 세 곳이 KST로 변환하지 않고 UTC 시각을
  그대로 씁니다. KST는 UTC+9라 **09시 이전 시각은 전날로, 하루 시각은 9시간 앞으로** 밀립니다.

  | 위치 | 코드 | 증상 |
  |---|---|---|
  | `constraints.py:51` | `_minutes_of_day(dt) = dt.hour*60 + dt.minute` | 하루 활동시간이 잘림 |
  | `engine.py:70` | `(end.date() - start.date()).days + 1` | 일수가 하루 늘어남 |
  | `lodging_adapter.py:34` | `(end.date() - start.date()).days` | 박 수가 하루 늘어남 |

  `_minutes_of_day`가 `DAY_START_ANCHOR`(09:00) · `DAY_END_ANCHOR`(21:00)와 비교되면서
  실제 활동시간이 이렇게 무너집니다 — 서버 응답의 `avail_hours`를 그대로 옮긴 값입니다.

  | 입력 (KST) | 실제 활동시간 | 서버 `avail_hours` | 생성된 항목 |
  |---|---|---|---|
  | 당일 10:00~19:00 | 9시간 | **1.0** | 1개 |
  | 당일 08:00~16:00 | 8시간 | **0.0 / 0.0** | 0개 (일수까지 2일로 늘어남) |
  | 2박3일 출도일 ~16:00 | — | **0.0** | 0개 |

  **출도일 종료가 21시(KST) 이전이면 UTC로 12시 이전이라 `avail_hours`가 항상 0이 됩니다.**
  즉 다일 여행의 **마지막 날은 사실상 늘 빈 날**입니다. 위 6건 중 "정상"으로 보이던
  2박3일 코스들도 항목이 전부 1·2일차에 몰려 있고 3일차는 0개였습니다.

  재현: `POST /api/trips/` 에 `"start_datetime": "2026-11-22T10:00:00+09:00"`,
  `"end_datetime": "2026-11-22T19:00:00+09:00"` (당일 9시간) → 응답 코스의
  `days[0].avail_hours` 가 `1.0` 으로 옵니다.

  수정 방향: 위 세 곳에서 `trip.start_datetime` · `trip.end_datetime` 을
  `.astimezone(ZoneInfo("Asia/Seoul"))` 한 뒤 `.date()` · `.hour` 를 쓰면 됩니다.
  (`apps/routing/kakao_client.py:66`이 이미 `astimezone(KST)` 방식을 쓰고 있습니다.
  현재 그 파일 외에는 프로젝트 어디에서도 KST 변환을 하지 않습니다.)
  `engine.py:100`의 `start_datetime.replace(...)` 도 같이 점검 부탁드립니다.

- 🚨 **`POST /api/trips/` 가 배포 서버에서 항상 500입니다 — 코스를 하나도 만들 수 없습니다.**
  (※ `origin/develop` 최신에서는 **이미 고쳐져 있습니다.** 재배포만 하면 해소됩니다.)
  응답 본문: `{"trip_id": 69, "error": "_get_travel_time_fn() missing 1 required positional argument: 'transport_mode'"}`
  (2026-09-10 `https://tourcontest-backend.onrender.com/api` 에서 확인)
  - 배포된 `engine.py`의 `_get_travel_time_fn`은 `transport_mode`를 받는 시그니처인데
    호출부는 `_get_travel_time_fn(routing_engine)` 한 개만 넘기는 것으로 보입니다.
    저희가 받은 로컬 `Backend/` 체크아웃은 2인자 버전이라 **배포본과 리비전이 다릅니다.**
  - 500이 나도 `TripRequest` 행은 이미 생성됩니다(`trip_id`가 응답에 실려 옵니다).
    실패할 때마다 코스 없는 고아 trip이 쌓이니 트랜잭션 처리도 함께 봐주시면 좋겠습니다.
- 명세 2·4번의 **`final_score`가 `null`로 오는 코스**가 있습니다 (예: `trip_id=20`의 코스 30·31·32).
  명세서 본문에는 숫자 예시만 있어 non-nullable로 읽었다가 프론트가 죽었습니다
  (지금은 `null`이면 `—`로 표시하도록 고쳤습니다). 의도된 값인가요, 점수 계산 실패 시
  `null`이 남는 건가요? 후자라면 해당 코스를 아예 안 내려주는 편이 나을 것 같습니다.
- 🐢 **코스 생성·조회가 느립니다** (로컬에서 배포본과 같은 NeonDB를 보며 실측).
  `origin/develop` 최신에서 많이 개선됐습니다 — 랜덤 6건 기준 `POST /api/trips/` 가
  **13~68초**(이전 구버전 코드에서는 58~319초). 다만 조회도 여전히 건당 3~13초라
  아래 두 가지는 남아 있습니다.

  **(1) 쿼리 1회당 왕복 비용이 큽니다.** 같은 GET을 5회 반복해도 빨라지지 않습니다
  (콜드 스타트가 아니라는 뜻입니다).

  | 요청 | 응답 | 소요 |
  |---|---|---|
  | `GET /api/trips/15/courses/` (코스 3건 요약) | 384 B | 1.7 / 2.8 / 2.1 / 3.8 / 2.7초 |
  | `GET /api/courses/114/` (2일·16항목) | 34 KB | 7.3 / 7.4 / 14.7초 |

  생성이 도는 동안 Django 프로세스 CPU가 8초간 15.0초로 **완전히 고정**이었습니다 —
  계산이 아니라 DB 응답을 기다리고 있었다는 뜻입니다.

  **(2) 쿼리 수 자체가 많습니다.** 위 왕복 비용과 곱해집니다.

  | 위치 | 내용 | 제안 |
  |---|---|---|
  | `apps/trips/views.py` | `select_related`·`prefetch_related`가 한 곳도 없음. 직렬화가 `days → items → place`(FK) 3단 중첩이라 항목 수만큼 쿼리 발생 | 코스 상세에 `prefetch_related("days__items__place")` |
  | `apps/recommendation/engine.py:47-48` | `generate_one_course` **안에서** 전체 `Place`를 2번 로드(관광지 ~1,050 + 음식점 ~718행). 코스 3개라 **6회 반복** | `generate_all_courses` 쪽으로 올려 1회만 |
  | `engine.py:103·136` | 항목마다 개별 `ItineraryItem.objects.create()` (3박4일 × 3코스면 60여 회) | 일자 단위 `bulk_create` |

  프론트는 로딩 화면에 경과 시간과 취소 버튼을 넣어 두었지만, 근본 해결은 위쪽입니다.
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

아래 1·2·5번은 **프론트 화면 구성이 확정된 사항**이라 서버 지원이 필요합니다.
(기존 3·4번은 철회했습니다 — 아래 참조.)

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

#### 3·4. ~~코스 생성 전 숙소 추천 엔드포인트 신설~~ · ~~명세 1번에 `lodging_content_id` 추가~~ — **철회합니다**

앞서 이 자리에 두 가지를 요청드렸습니다.

- `POST /api/lodging/suggest/` 신설 (코스 생성 전, 조건만으로 숙소 추천)
- 명세 1번 request에 `lodging_content_id` 추가 (고른 숙소를 코스 생성에 반영)

**두 건 모두 철회합니다. 작업하지 않으셔도 됩니다.** 이미 손대셨다면 알려주세요.

철회 이유는 `accommodations` 쪽 추천 로직을 읽고 나서입니다. 숙소 추천의 핵심 신호가
코스 결과에 묶여 있어서, 코스 없이 추천하면 알고리즘의 의도가 사라집니다.

- `recommend.py`의 `recommend_anchor()`는 `day_last_place_ids`가 비면 `ValueError`를
  던집니다 — 앵커를 **그날 마지막 방문 장소에서의 이동시간**으로 고르기 때문입니다.
- 같은 파일 주석의 근거: 실제 사람들이 고른 숙소는 그날 마지막 장소에서 중앙 2.8km
  (25%는 0.5km 이내)인 반면, 코스 중심점 기준으로는 10.5km입니다.
- 정렬키가 `(등급, 이동시간합 − QueryFit, unknown_count, content_id)`이라, 코스가 없으면
  이동시간 항이 모든 후보에게 0으로 동률이 되어 사실상 `등급 → unknown_count` 순의
  단순 목록이 됩니다(자유입력이 없으면 QueryFit도 전부 0이라 순위가 거의 임의가 됩니다).

그래서 앞서 드린 **대안**대로 갔습니다 — **빌더 위저드의 스텝 5 '숙소 고르기'를 없애고**,
숙소 선택을 코스 생성 후 `LodgingPage`(명세 6 → 7번) 한 곳으로 일원화했습니다.
프론트에서 더미로 돌던 `mockLodgingOptions.ts`와 `StepLodgingPick.tsx`는 삭제했습니다.

사용자 입장에서 잃는 단계는 없습니다. 숙소를 고르는 화면은 그대로 있고, 더미가 아닌
실데이터로 바뀌며, 추천 순서가 실제 동선을 반영하게 됩니다.

빌더는 이제 `1 일정 → 2 목적·권역 → 3 취향 → 4 숙박 조건 → 코스 생성` 4스텝입니다.
스텝 4에서 받는 `lodging_type` · `lodging_need_cooking` · `lodging_free_text`는
**계속 명세 1번으로 보냅니다** — `LodgingRequest.from_trip_context()`가 쓰는 값이라
그대로 두는 게 맞습니다.

따라서 앞서 "함께 정해야 할 것"으로 여쭌 5개 중 1~4번(추천 개수·빈 배열·유효하지 않은
`lodging_content_id`·숙소에 맞춘 코스 조정)은 **모두 무효**입니다. 5번(코스 생성 후
`LodgingPage`에서 숙소를 바꾸는 흐름이 계속 유효한가)만 남고, 이건 지금 저희가 쓰는
유일한 흐름이 되었으니 **유지 여부를 확인만 부탁드립니다.**

#### 5. 명세 4번 응답에 여행 시작·종료 시각 추가 (`trip_start_datetime` / `trip_end_datetime`)

코스 상세 타임라인의 **양 끝에 제주공항을 표시**하려고 합니다. 빌더 1스텝이 받는 시각이
애초에 공항 기준이기 때문입니다 — 시작 = 수하물 수령 후 공항 밖으로 나오는 시각,
종료 = 돌아가는 날 공항에 도착해야 하는 시각.

```
🛬 09:00  제주공항 밖 출발 (수하물 수령 완료)
   🚗 차량 35분 이동
   10:00  성산일출봉
   …
   16:30  (마지막 방문지)
   🚗 차량 40분 이동
🛫 18:00  제주공항 도착 (탑승 수속)
```

그런데 이 두 값은 **명세 1번 요청 본문에만** 있고 어떤 응답에도 실려 오지 않습니다.
상세 화면은 `course_id` 하나로 진입하므로(저장함·공유 링크·새로고침 포함) trip을 되짚을
경로가 없습니다. 명세 4번(`GET /api/courses/{course_id}/`) 응답 최상위에 두 필드를
추가해 주실 수 있을까요?

```json
{
  "id": 31,
  "mode": "dist",
  "trip_start_datetime": "2026-09-12T09:00:00+09:00",
  "trip_end_datetime": "2026-09-14T18:00:00+09:00",
  "days": [ … ]
}
```

- 명세 1번에 받은 값을 그대로 내려주시면 됩니다. **KST 오프셋(`+09:00`)을 유지**해 주세요
  (`avail_hours` KST 버그와 같은 맥락입니다 — 위 「버그」 항목 참조).
- 프론트는 타입·화면 모두 준비를 마쳤고, 필드를 **선택(optional)** 으로 두었습니다.
  지금처럼 안 와도 화면은 그대로 동작하고, 필드가 오는 순간 공항 표시가 코드 변경 없이 켜집니다.
- 덧붙임(선택): 입도일 `items[0].travel_min_from_prev`가 현재 항상 `null`입니다.
  공항→첫 장소 이동시간을 채워주시면 그대로 씁니다. 안 채워주셔도 위 두 시각과
  방문 시각의 차이로 계산하므로 **차단 요소는 아닙니다.**

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
