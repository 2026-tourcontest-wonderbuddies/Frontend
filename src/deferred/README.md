# [백엔드 연결 이전] src/deferred — 백엔드 API 명세에 대응 엔드포인트가 없어 보류한 화면

Notion `04. 개발 / API 명세서` 데이터베이스에는 아래 기능의 엔드포인트가 **없다.**
프론트 화면과 API 호출은 이미 만들어져 있지만, 실제 서버에는 붙일 곳이 없어서
`/api` 연동 대상에서 빼 두었다.

| 기능 | 파일 | 필요한 서버 엔드포인트 |
|---|---|---|
| 코스 수동 편집 | `pages/EditPage.tsx`, `hooks/useEdit.ts`, `edit.ts`, `components/ConstraintViolationSheet.tsx` | `POST /api/trips/{id}/edit/`, `PUT /api/trips/{id}/` |
| 챗봇 코스 수정 | `pages/ChatPage.tsx`, `hooks/useChat.ts`, `chat.ts` | `POST /api/trips/{id}/chat/` — 명세 8번(`POST /api/courses/{id}/modify/`)이 가장 가까우나 응답 스키마가 다름 |
| 이메일 회원가입 | `pages/SignupPage.tsx` | `POST /api/auth/signup` |

## 서버 없이 프론트 단독으로 돌린 기능

**장소 검색(`/search`)과 저장함(`/saved`, `/saved/map`)은 이 폴더에서 빠져나갔다.**
서버 엔드포인트는 여전히 없지만, 화면을 계속 쓰기 위해 프론트만으로 동작하게 바꿔 되살렸다.

| 기능 | 지금 구현 | 서버가 생기면 필요한 엔드포인트 |
|---|---|---|
| 장소 검색 | `src/data/places.ts` 시드 10곳을 클라이언트에서 필터링 (`src/pages/SearchPage.tsx`) | `GET /api/places/search?q&category&region` |
| 저장(찜) | `localStorage` (`src/store/saved.ts`) — 기기·브라우저 단위, 계정을 따라다니지 않음 | `GET/POST/DELETE /api/saved/places`, `/api/saved/courses` |

엔드포인트가 생기면 `src/data/places.ts`의 `filterPlaces()`와 `src/store/saved.ts`의
읽기/쓰기 함수만 API 호출로 갈아끼우면 되고, 화면은 그대로 둔다.
옛 API 호출 버전은 이 커밋 직전의 `src/deferred/{search,saved}.ts` 에 있다.

## 이 폴더의 규칙

- `tsconfig.app.json`의 `exclude`에 들어 있어 **타입체크·빌드에서 제외**된다.
  따라서 이 안의 코드는 지워진 `useTrip`/`TripResponse` 등 옛 계약을 그대로 참조한다.
- `App.tsx`는 이 화면들을 라우팅하지 않는다. 해당 경로는 `ComingSoon`을 띄운다.

## 되살리는 방법

1. 서버에 위 표의 엔드포인트가 생기면, 해당 API 모듈을 `src/api/`로 옮긴다.
2. 응답 스키마를 `src/api/types.ts`의 명세 기준 타입(`CourseDetail`, `PlaceSummary` 등)에 맞춘다.
   보류된 코드는 `TripResponse`/`PlaceDTO` 같은 옛 타입을 쓰고 있어 그대로는 컴파일되지 않는다.
3. 페이지·훅을 `src/pages/`, `src/hooks/`로 옮기고 `App.tsx`의 `ComingSoon` 라우트를 교체한다.
4. `tsconfig.app.json`의 `exclude`에서 이 폴더를 뺀다.
