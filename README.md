# 시간여행 제주 — 프론트엔드

Vite + React + TypeScript. 제주 시간대별 여행 코스 추천 서비스의 프론트엔드입니다.

## 시작하기

```bash
npm install
npm run dev
```

`http://localhost:5173`에서 확인할 수 있습니다. 기본적으로 [MSW](https://mswjs.io)가 `/api/*` 요청을
가로채 목업 데이터를 돌려주므로, 백엔드 서버 없이도 전체 화면(Home → Builder → Detail, List)이 바로 동작합니다.

## 카카오맵 연동하기

코스 지도(`/trip/:id/map`)와 저장 지도(`/saved/map`)는 카카오맵 JavaScript SDK로 실제 지도를 그립니다.
동작시키려면 JavaScript 키가 필요합니다.

1. [카카오 개발자센터](https://developers.kakao.com)에서 애플리케이션 추가
2. **앱 키 > JavaScript 키** 복사
3. **앱 설정 > 플랫폼 > Web**에 사용할 도메인 등록 (개발 시 `http://localhost:5173`)
4. `.env.local`에 `VITE_KAKAO_MAP_KEY=복사한_키` 추가 후 `npm run dev` 재시작

키가 없거나 SDK 로딩에 실패하면 지도는 기존 미리보기(격자 + 핀)로 자동 대체되며, 그 상태에서도 마커를
누르면 카카오맵 장소 페이지로 이동합니다. 화면이 깨지지는 않습니다.

> JavaScript 키는 브라우저에 노출되는 값이라 도메인 등록으로 사용을 제한합니다.
> 그래도 `.env.local`은 커밋 대상이 아니니(`.gitignore`) 그대로 두세요.

## 실제 백엔드 연동하기

백엔드에 `POST /api/trips/`, `GET /api/trips/:id/`가 구현되면:

1. `.env.example`을 `.env.local`로 복사
2. `VITE_API_BASE_URL`에 실제 서버 주소 입력 (예: `https://api.siganyeohaeng.com`)
3. `VITE_USE_MOCKS=false`로 변경

API 요청/응답 스키마는 [`API_CONTRACT.md`](./API_CONTRACT.md)를 참고하세요. 프론트가 기대하는
형태를 먼저 정의해둔 문서이며, 백엔드 구현 시 이 문서를 기준으로 맞추거나 협의가 필요한 부분을 알려주시면 됩니다.

## 화면 구성

| 경로 | 설명 |
|---|---|
| `/` | 홈 — 시간대 다이얼, 추천 코스 큐레이션 |
| `/list` | 추천 코스 전체 목록 (정적 목업 — 백엔드에 "공개 코스" 모델이 아직 없어 이번 범위에서는 연동하지 않음, [`API_CONTRACT.md`](./API_CONTRACT.md) 3번 참고) |
| `/builder` | 코스 만들기 — `TripRequest`의 모든 입력값을 받는 폼 |
| `/trip/:id` | 코스 상세 — `GET /api/trips/:id`로 조회한 일정을 타임라인으로 표시 |

## 폴더 구조

```
src/
  api/            fetch 클라이언트, 타입, MSW 목업 (mocks/)
  components/     Nav, TabBar, CourseCard, ChipGroup 등 공용 컴포넌트
  hooks/          useCreateTrip, useTrip 등 react-query 훅
  pages/          화면 4개
  styles/         global.css — 기존 정적 프로토타입의 디자인 시스템을 그대로 이식
  utils/          날짜/시간 포맷 유틸
```

## 알아두면 좋은 점

- 날짜 계산은 반드시 로컬 타임존 기준으로 처리하세요. `toISOString()`은 UTC로 변환되므로 날짜만 다룰 때 쓰면
  타임존에 따라 하루가 밀리는 버그가 생깁니다(`BuilderPage.tsx`의 `toDateInputValue` 참고).
- `api/mocks/data.ts`의 `SEED_PLACES`는 데모용으로 10곳만 넣어둔 임시 데이터입니다. 실제 장소 데이터는
  백엔드의 `Place` 테이블에서 옵니다.
- `npm run build`로 타입체크(`tsc -b`)와 프로덕션 빌드를 함께 확인할 수 있습니다.
