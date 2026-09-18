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

- ~~🚨 **시간대(KST) 미변환**~~ — **해결 확인.** develop 최신(`d9aae8d`)의
  `constraints.py:_minutes_of_day()`가 `dt.astimezone(KST)`를 거치도록 고쳐져 있습니다.
  배포 서버가 이 리비전을 반영했는지만 확인하면 됩니다. 아래는 당시 재현 기록입니다.

- 🚨 **(과거 기록) 시간대(KST) 미변환 — 모든 코스의 일정 계산이 어긋납니다.** `origin/develop` 최신
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
- ~~`POST /api/courses/{id}/modify/` 는 현재 **항상 500**입니다~~ — **해결 확인.** develop
  최신(`d9aae8d`)의 `modification_interpreter.py`는 `_get_client()`가 정상 정의되어 있고,
  `CourseModifyView`도 locked/removed/scope 처리까지 구현되어 있습니다. 화면 연결 가능한 상태로
  보입니다 — 프론트는 아직 `(아직 화면 없음)`.

### Pipeline 5-B 음식점 로직 — 프론트 연동하며 확인한 것

`food_cafe_balance` 입력 UI를 붙이면서 `apps/recommendation/food_scoring.py`를 읽었습니다.
**알고리즘 자체는 문서대로 다 들어가 있었습니다** — 시너지 보너스
`((주목적×보조목적)/100)×0.2`, `Pref_k = Pref_food/100`,
`MEAL_CAPABLE_ROLES = (RESTAURANT, SNACK)`, 소프트 필터 5곳 미만 트리거 + `-0.15` 감점까지
전부 확인했습니다. `FOOD_PREF_TO_TAG`의 키 10개도 프론트 `FOOD_PREF_LABELS`와 정확히 일치합니다.

아래는 **코드는 있는데 실행 경로가 닿지 않는** 지점들입니다. 받아놓고 안 쓰이면
사용자를 속이게 되어서, 프론트에서 입력을 받지 않고 여기 적습니다.
(2번 식사 제한은 확인 결과 **의도된 제외**로, 요청이 아니라 기록입니다.)

#### 1. 🚨 아침식사 슬롯은 구조적으로 생성될 수 없습니다

문서 「음식점 슬롯 구성 **+ 아침식사 추가**」의 아침 항목이 **한 번도 발동하지 않습니다.**

`constraints.py:22-30`:

```python
DAY_START_ANCHOR = 9 * 60          # 540
MORNING_WINDOW   = (7 * 60, 9 * 60)  # (420, 540)
```

`calc_avail_hours()`가 모든 day_case에서 시작 시각에 바닥을 깝니다 (`constraints.py:93·96·99·102`):

```python
start_min = max(_minutes_of_day(trip_start_dt), DAY_START_ANCHOR)   # 항상 >= 540
```

그런데 `check_meal_flags()`(`constraints.py:70`)는 이렇게 판정합니다:

```python
need_morning = not (end_min <= MORNING_WINDOW[0] or start_min >= MORNING_WINDOW[1])
#                                                   start_min >= 540 → 항상 True
#                                                   → need_morning 항상 False
```

`DAY_START_ANCHOR`와 `MORNING_WINDOW[1]`이 똑같이 9시라, `start_min >= 540`이 항상 참이 되어
`need_morning`은 **입력과 무관하게 언제나 `False`** 입니다. 사용자가 7시에 시작한다고 해도
`max(..., 540)`에서 9시로 올라가 버립니다.

- 부수적으로, 설령 켜지더라도 `engine.py:139-145`가 **점심·저녁만** 시간 순 체크포인트로
  잡고 아침은 `extra_food_types`로 넘어가 그날 마지막 관광지 **뒤에** 붙습니다
  (`engine.py:146`, `:229-259`). 아침식사가 저녁 시간대에 배치됩니다.
- 수정 방향: `MORNING_WINDOW`를 `DAY_START_ANCHOR`보다 뒤로 옮기거나(예: `(8*60, 10*60)`),
  아침이 있는 날은 `DAY_START_ANCHOR` 바닥을 걷어내야 합니다. 그리고 아침도 점심·저녁처럼
  시간 순 체크포인트에 넣어야 합니다.
- **프론트는 아침 관련 UI를 만들지 않았습니다.** 위가 고쳐지면 알려주세요.
  (`need_morning`은 `ItineraryDaySerializer`에 이미 들어 있어서 응답엔 내려오고 있습니다 —
  항상 `false`라 프론트 타입에는 넣지 않았습니다.)

#### 2. 식사 제한(비건·육류제외·해산물제외)은 **기능 제외 확정** — 확인 완료

`passes_food_restriction()`과 `RESTRICTION_KEYWORDS`(`food_scoring.py:37-56`)가 완성된 채
`engine.py:166`에서 `""`로 하드코딩돼 있어 처음엔 연동 누락으로 봤는데,
**의도적으로 범위에서 빠진 기능임을 확인했습니다.** 요청 아닙니다.

- 프론트도 식사 제한 입력 UI를 만들지 않습니다.
- `food_scoring.py:37-56`은 현재 **호출되지 않는 코드**입니다. 나중에 누가 "버그"로 보고
  되살리지 않도록 여기 남겨둡니다. 정리하실지 여부는 백엔드 판단에 맡깁니다.

#### 3. 음식점 영업시간·휴무일 필터가 꺼져 있습니다

`engine.py:164-168`, 위 `food_restriction`과 같은 호출부입니다:

```python
meal_candidates, relaxed_ids = build_meal_candidates(
    all_food_places, quadrant, visit_start_dt,
    trip.food_pref_1, trip.food_pref_2, "",
    is_open_at_fn=lambda p, dt: (True, True),   # ← 항상 "열려 있음"
)
```

문서 「필터링 및 매칭 로직」 1번의 **필수 필터 "휴무일 아님"이 음식점에 대해 적용되지
않습니다.** 일반 장소 쪽에서 쓰는 영업시간 판정 함수를 그대로 넘기면 될 것 같은데,
이것도 식사 제한처럼 의도된 제외인지 확인 부탁드립니다.
(의도가 아니라면 문 닫은 식당이 코스에 들어갈 수 있습니다.)

#### 4. 자유 입력(QueryFit)이 음식 점수에 반영되지 않습니다

문서 3번 「자유 입력 처리 → 코사인 유사도 → QueryFit(0~100)」과
`Pref_food = PurposeFit×0.5 + QueryFit×0.5`가 **실행되지 않습니다.**
`calc_nlp_match_scores()`는 `_place_vectors`가 `None`이면 `{}`를 반환하는데
(`nlp_matching.py:36-46`), `load_place_embeddings()`를 **호출하는 곳이 프로젝트에 없습니다**
(`apps/recommendation/apps.py`에 `ready()`가 없습니다). `engine.py:102` 주석도
"임시 비활성화 상태라 항상 {} 반환"으로 적어두셨습니다.

결과적으로 `query_fit`이 항상 `None`이라 `Pref_food == PurposeFit`이고,
`free_text_input`은 음식점 순위에 아무 영향이 없습니다. 임시 조치가 맞는지,
`place_embeddings.npz` 로딩 계획이 있는지 알려주세요.

#### 5. `is_relaxed_preference`가 응답에서 빠져 있었습니다 — 고쳐서 올립니다 🙏

문서 「소프트 필터 4. 투명성」의 "⚠ 선호 음식과 완전히 일치하지 않음" 표시를 붙이려는데,
`ItineraryItem.is_relaxed_preference`가 **DB에는 저장되는데 API로는 안 내려오고 있었습니다.**
모델(`models.py:149-152`)·마이그레이션(`0005_...`)·기록(`engine.py:222`·`:255`)은 다 있고
`ItineraryItemSerializer.Meta.fields`에서만 빠져 있어서, 한 줄 추가했습니다.

```python
fields = ["id", "order", "place", "slot_type", "arrive_at", "depart_at",
          "travel_min_from_prev", "locked", "hours_uncertain",
          "is_relaxed_preference", "recommend_reason"]
```

프론트는 이 값을 타임라인에 `⚠ 선호 음식 미일치` 배지로 보여줍니다. 선택 필드로 뒀으니
배포 전 서버에서도 배지만 안 뜨고 정상 동작합니다.

> **🚨 재확인 필요 — develop 최신(`d9aae8d`)에서 다시 빠져 있습니다.** `ItineraryItemSerializer`가
> `day_schedules` 스키마 전환 과정에서 통째로 다시 쓰이면서 위에서 추가했던 한 줄이 유실된
> 것으로 보입니다(`apps/trips/serializers.py:37`, `fields`에 `is_relaxed_preference` 없음).
> 모델·엔진 쪽 로직은 그대로 있어 DB에는 계속 저장되고 있습니다. 다시 한 줄 추가를 부탁드립니다.

#### 6. 참고 — `BAR`는 편성 불가 (문서 의도와 결과적으로 일치)

`FOOD_ROLE_MAP`(`import_tour_api.py:17-24`)은 기타주점을 `BAR`로 넣는데,
`ItineraryItem.SLOT_TYPE_CHOICES`(`models.py:136`)에 `BAR`가 없고
`decide_food_slot_types()`도 `BAR` 슬롯을 만들지 않습니다. 문서의 "기본 추천 제외"와
결과가 같으니 그대로 두면 될 것 같습니다. 확인만 부탁드립니다.

#### 7. 참고 — `"둘다"` + 짧은 날은 카페가 0곳입니다

`food_scoring.py:247-249`의 `else` 분기가 `pattern[i % 2]`로 `RESTAURANT`부터 시작합니다.

```python
extra_count = 1 if avail_hours < 6 else 2       # :242
pattern = ["RESTAURANT", "CAFE"]
extra_types = [pattern[i % 2] for i in range(extra_count)]
```

`avail_hours < 6`이면 `extra_count == 1` → `["RESTAURANT"]`. 즉 "둘 다"를 고른 짧은 날에
**카페가 한 곳도 안 나옵니다.** 의도라면 그대로 두고, 아니라면 `extra_count == 1`일 때
`CAFE`부터 시작하거나 번갈아 쓰면 될 것 같습니다. 프론트는 현재 동작 그대로 설명합니다.

### 권한

- 명세 11번은 "모든 API 헤더에 토큰"이라고 되어 있고 프론트도 모든 요청에 붙이고 있습니다.
  다만 현재 백엔드 `/api/`에는 `DEFAULT_PERMISSION_CLASSES`가 없어 `AllowAny`입니다.
  누구나 임의의 `trip_id`/`course_id`를 조회·수정할 수 있습니다.
- `GoogleLoginView.callback_url`이 `http://localhost:3000`으로 하드코딩되어 있습니다.
  프론트는 5173이고 배포는 onrender 도메인입니다. (access_token 방식이라 지금은 문제 없지만
  `code` 방식으로 바꾸면 걸립니다.)

### 추가 요청

아래 5·6번은 **프론트 화면 구성이 확정된 사항**이라 서버 지원이 필요합니다.
(1·2번은 해결됐고, 기존 3·4번은 철회했습니다 — 아래 참조.)

#### 1. ~~명세 1번에 `day_overrides` 추가~~ — **해결됐고, 이후 `day_schedules`로 한 단계 더 나아갔습니다 🙏**

> **갱신(`d312586`):** 아래는 `day_overrides`(선택적 예외) 방식이었던 당시 기록입니다.
> 이후 프론트가 `start_date`/`end_date` + **필수** `day_schedules[]`(일자마다
> `{ day_index, start_time, end_time, purpose_main?, purpose_sub?, region_preference?,
> exclude_categories? }`)로 요청 스키마를 바꿨습니다. 서버가 `start_date + (day_index-1)일 +
> "HH:MM"`로 그 날 시각을 조립하고(`engine._combine_date_and_time`) 키가 없으면 `KeyError`로
> 500이 나기 때문에, 이제 **모든 날짜의 시각을 매번 채워 보냅니다.** 아래 `start_hour`/`end_hour`
> 미전송 관련 서술은 더 이상 사실이 아닙니다 — 지금은 매일 전송되고
> `calc_avail_hours_from_schedule()`가 실제로 읽습니다.

`TripRequest.day_overrides`(JSONField)와 `engine.py`의 `_get_day_override()`로 들어온 것 확인했고,
프론트에서 전송 연결을 마쳤습니다. 당시 보내던 형태는 아래와 같습니다.

```json
"day_overrides": [
  {
    "day_index": 2,
    "purpose_main": "activity",
    "region_preference": "NE",
    "exclude_categories": ["자연경관(산)", "자연공원"]
  }
]
```

- `day_index`는 1부터 시작합니다 (1일차, 2일차 …).
- `region_preference`는 명세 1번과 동일한 `NE | NW | SE | SW | ALL` 코드로 변환해 보냅니다.

#### 2. ~~`exclude_categories`를 삭제하지 말아 주세요~~ — **유지해 주셔서 감사합니다 🙏**

`TripRequestSerializer`에 그대로 남아 있는 것 확인했고, 일자별 조건에서 쓰고 있습니다.

##### ⚠ 다만 한 가지 — 카테고리명 3개가 DB 값과 달랐습니다

`filters.py`의 `is_excluded()`가 `place.middle_category_name`과 **문자열 완전일치**로 거르는데,
프론트 `tourCategories.ts`의 중분류명 3개가 구분자 문자만 달라 **에러 없이 제외가 안 되고 있었습니다.**

| 프론트(기존) | DB 실제 값 | 차이 |
|---|---|---|
| `농·산·어촌 체험` | `농.산.어촌 체험` | `U+00B7` → `U+002E` |
| `도시·지역문화관광` | `도시.지역문화관광` | `U+00B7` → `U+002E` |
| `자연경관(하천·해양)` | `자연경관(하천‧해양)` | `U+00B7` → `U+2027` |

프론트를 DB 값(`data/jeju_places_stay_time.csv` 원본)에 맞춰 고쳤고,
`npm run check:categories`로 27개 전부 일치하는지 검사합니다.
**DB의 카테고리명을 정리하실 계획이 있다면 미리 알려주세요** — 프론트도 같이 맞춰야 합니다.

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

#### 5. ~~명세 4번 응답에 여행 시작·종료 시각 추가 (`trip_start_datetime` / `trip_end_datetime`)~~ — **해결됐습니다 🙏**

develop 최신(`d9aae8d`, 커밋 `b2b08a2`)의 `RecommendedCourseSerializer.Meta.fields`에
`trip_start_datetime`·`trip_end_datetime`이 이미 포함되어 있는 것을 확인했습니다. 프론트는
`CourseDetail`에 선택 필드로 미리 넣어 뒀던 대로, 코드 변경 없이 타임라인 공항 표시가 켜집니다.
**배포 서버가 이 리비전을 반영했는지만 확인 부탁드립니다.** (아래는 당시 요청 기록입니다.)

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
  방문 시각의 차이로 계산하므로 **차단 요소는 아닙니다.** → **6번에서 갱신**

#### 6. ~~입도일 "공항→첫 장소" 이동시간도 좌표 기반 추정치로 부탁드립니다~~ — **해결됐습니다 🙏**

어제와 완전히 동일한 조건(start_date 2026-10-10 / end_date 2026-10-11, 첫 장소 어영공원)으로
다시 요청해보니 `items[0].travel_min_from_prev`가 `0` → `5`로 정상화됐습니다. 그 외 trip
3개(9개 코스)를 더 만들어 봐도 전부 `0` 없이 실측에 가까운 값(5·40·45분)이 나옵니다.
전용 필드(`airport_to_first_travel_min`)를 새로 추가하신 게 아니라 기존
`items[0].travel_min_from_prev` 계산 버그 자체를 고치신 것으로 보입니다 — 그래도 요청한
효과는 그대로 얻었습니다. 프론트는 원래 이 필드를 우선 사용하도록 되어 있어서(`course.ts`)
**코드 수정 없이 화면에 정상 반영됩니다.** (아래는 당시 요청 기록입니다.)

5번에서 "차단 요소는 아니다"라고 드렸던 말씀을 정정합니다. 실제로 trip을 두 개 만들어 비교해보니
같은 구간인데 계산이 들쭉날쭉합니다.

| 코스 | 첫 장소 | `items[0].travel_min_from_prev` | 실제 거리 |
|---|---|---|---|
| course 868 | 어영공원 | `0` | 공항에서 약 1~2km(차로 5분 이상) — **0이 아님** |
| course 871 | 이승이오름 | `40` | 정상 |

`travel_min_from_prev`가 `0`으로 오면 프론트 폴백(`trip_start_datetime`과 `arrive_at`의 시각차)도
결국 `0`이 되어(두 값이 완전히 같은 시각), 타임라인에 "🚗 N분 이동" 줄 자체가 사라집니다
(`0`은 "이동시간 없음"으로 처리하고 있어서요 — `travelOrNull()`, `src/utils/course.ts`).

바로 어제 대칭 구간인 "마지막 날 → 공항 복귀"에서 같은 문제(시각차가 부풀거나 깨짐)를
좌표 기반 추정치 `return_to_airport_travel_min` 필드로 해결해 주셨습니다. **입도일 "공항→첫
장소" 구간에도 같은 방식으로 `airport_to_first_travel_min` 같은 필드를 명세 4번 응답에
추가해 주실 수 있을까요?** (혹은 `items[0].travel_min_from_prev` 계산 자체를 고쳐주셔도 됩니다.)

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

### 새로 발견 — 코스 수동 편집 API가 이미 구현돼 있습니다

`apps/trips/urls.py`(develop, `d9aae8d`)를 보다가 발견했습니다. **명세에 없어서 `src/deferred/`로
미뤄둔 "코스 수동 편집"의 엔드포인트가 이미 존재하고, 스텁이 아니라 실제로 동작합니다**
(순서 변경 시 `recalc_timeline_from()`으로 이동시간·시각까지 재계산합니다).

| 엔드포인트 | 설명 |
|---|---|
| `POST /api/courses/{id}/days/{day_index}/reorder/` | `{ item_ids: number[] }` 순서대로 재배치 |
| `POST /api/courses/{id}/days/{day_index}/items/` | `{ content_id, order }` 장소 삽입 |
| `DELETE /api/courses/{id}/items/{item_id}/` | 장소 삭제 (뒤 일정 재계산) |
| `POST`·`DELETE /api/courses/{id}/items/{item_id}/lock/` | 장소 고정·해제 |

명세서에 없던 이유(대응 엔드포인트 부재)가 사라졌으니, **`src/deferred/`의 코스 수동 편집
화면을 되살릴지 이번 스프린트에서 논의 필요**합니다. 명세서에도 추가해 주시면 좋겠습니다.
이번 점검에서는 발견만 기록하고 화면 복구는 하지 않았습니다.

**후속: 순서 변경·삭제·추가 3개를 [DetailPage.tsx](src/pages/DetailPage.tsx)에 붙였습니다.**
타임라인 각 항목에 ↑/↓(순서 변경)·✕(삭제) 버튼을, Day 하단에 "+ 이 날에 장소 추가"
(검색 자동완성 모달)를 달았습니다. 실제 코스(`course_id=904`)로 확인한 결과:

- ✅ `reorder/`, `DELETE .../items/{item_id}/` — 정상 동작. 순서를 바꾸거나 삭제하면
  이후 일정 시각이 서버에서 바로 재계산돼 내려옵니다.
- 🚨 **`POST /api/courses/{id}/days/{day_index}/items/` (장소 추가)가 배포 서버에서
  항상 500입니다.** 응답이 JSON이 아니라 Django 디버그 에러 페이지이고,
  `NameError: name 'timedelta' is not defined` 가 찍힙니다 — 삽입 시 도착·출발 시각을
  `timedelta`로 계산하는 코드 경로에 `from datetime import timedelta` 임포트가 빠진
  것으로 보입니다. 재현: `POST /api/courses/904/days/1/items/`
  `{"content_id": "126435", "order": 7}` (2026-09-17 배포 서버에서 확인, content_id는
  실재하는 장소라 404는 아님). 프론트 쪽 요청 형태는 명세와 동일해서 백엔드 쪽만
  고치면 바로 붙습니다 — 그 전까지는 "+ 장소 추가" 버튼을 누르면 에러 문구만 뜹니다.
