# 시간여행 제주 — 프론트엔드

Vite + React + TypeScript. 제주 시간대별 여행 코스 추천 서비스의 프론트엔드입니다.

## 시작하기

```bash
npm install
cp .env.example .env.local
npm run dev
```

`http://localhost:5173`에서 확인할 수 있습니다. **백엔드가 떠 있어야 동작합니다** —
`.env.local`의 `VITE_API_BASE_URL`이 가리키는 서버를 호출합니다(기본값은 배포 서버).
로컬 Django로 붙이려면 `VITE_API_BASE_URL=http://127.0.0.1:8000/api`로 바꾸세요.

## 카카오맵 연동하기

코스 지도(`/trip/:id/map`)는 카카오맵 JavaScript SDK로 실제 지도를 그립니다.
동작시키려면 JavaScript 키가 필요합니다.

1. [카카오 개발자센터](https://developers.kakao.com)에서 애플리케이션 추가
2. **앱 키 > JavaScript 키** 복사
3. **앱 설정 > 플랫폼 > Web**에 사용할 도메인 등록 (개발 시 `http://localhost:5173`)
4. `.env.local`에 `VITE_KAKAO_MAP_KEY=복사한_키` 추가 후 `npm run dev` 재시작

키가 없거나 SDK 로딩에 실패하면 지도는 기존 미리보기(격자 + 핀)로 자동 대체되며, 그 상태에서도 마커를
누르면 카카오맵 장소 페이지로 이동합니다. 화면이 깨지지는 않습니다.

> JavaScript 키는 브라우저에 노출되는 값이라 도메인 등록으로 사용을 제한합니다.
> 그래도 `.env.local`은 커밋 대상이 아니니(`.gitignore`) 그대로 두세요.

## API 계약

기준은 Notion `04. 개발 / API 명세서` 데이터베이스입니다.
<https://app.notion.com/p/3d14958c0857803582a3dabebd95341a?v=3d14958c085780d79bd0000cc6fe2852>

프론트 함수 ↔ 명세서 번호 대응표와 연동 상태는 [`API_CONTRACT.md`](./API_CONTRACT.md),
팀 공유 사항은 [`TEAM_SHARE.md`](./TEAM_SHARE.md)를 보세요.

인증은 `POST /api/auth/google/`로 받은 `key`를 모든 요청에
`Authorization: Token {key}` 헤더로 실어 보냅니다(`src/api/client.ts`).

## 화면 구성

| 경로 | 설명 |
|---|---|
| `/` | 홈 — 시간대 다이얼, 추천 코스 큐레이션 |
| `/list` | 추천 코스 전체 목록 (정적 목업 — 백엔드에 "공개 코스" 모델이 없어 미연동) |
| `/builder` | 코스 만들기 — `POST /api/trips/` |
| `/trips/:tripId/courses` | 생성된 코스 3개 중 선택 |
| `/trips/:tripId/courses/:courseId/lodging` | 숙소 선택 후 코스 확정 |
| `/trip/:id` | 코스 상세 타임라인 — `:id`는 **course_id** |
| `/trip/:id/map` | 코스 지도 |
| `/login` | 구글 로그인 |
| `/search` | 장소 검색 — 서버 엔드포인트가 없어 `src/data/places.ts` 시드를 클라이언트 필터링 |
| `/saved`, `/saved/map` | 저장함 — 서버 엔드포인트가 없어 `localStorage`(`src/store/saved.ts`)에만 저장 |

`/trip/:id/edit`, `/trip/:id/chat`, `/signup`은 명세서에 대응
엔드포인트가 없어 보류 상태(`ComingSoon`)입니다 — `src/deferred/README.md` 참고.

## 폴더 구조

```
src/
  api/            fetch 클라이언트, 명세서 기준 타입, 도메인별 API 함수
  components/     Nav, TabBar, CourseCard, ChipGroup 등 공용 컴포넌트
  data/           서버 엔드포인트가 없어 프론트에 둔 시드 데이터 (장소 검색)
  hooks/          useCreateTrip, useCourses 등 react-query 훅
  pages/          화면
  store/          서버 없이 localStorage 로 유지하는 상태 (저장함)
  deferred/       명세에 엔드포인트가 없어 보류한 화면 (타입체크 제외)
  styles/         global.css — 기존 정적 프로토타입의 디자인 시스템을 그대로 이식
  utils/          날짜/시간 포맷, 코스 지표 계산
```

## 알아두면 좋은 점

- 날짜 계산은 반드시 로컬 타임존 기준으로 처리하세요. `toISOString()`은 UTC로 변환되므로 날짜만 다룰 때 쓰면
  타임존에 따라 하루가 밀리는 버그가 생깁니다(`BuilderPage.tsx`의 `toDateInputValue` 참고).
- 빌더가 보내는 `start_datetime`/`end_datetime`에는 **반드시 `+09:00`을 붙입니다.** 서버
  `TIME_ZONE`이 UTC라서 오프셋이 없으면 9시간 밀립니다.
- 모든 API 경로는 **트레일링 슬래시가 필수**입니다. Django `APPEND_SLASH`는 POST를 리다이렉트하지 않습니다.
- 방문 수·체류/이동 시간은 서버가 주지 않아 `utils/course.ts`에서 일정으로부터 계산합니다.
- `npm run build`로 타입체크(`tsc -b`)와 프로덕션 빌드를 함께 확인할 수 있습니다.
