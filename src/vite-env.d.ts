/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 백엔드 API 베이스 URL. `/api` 까지 포함한다. 비면 상대경로 "/api"를 쓴다. */
  readonly VITE_API_BASE_URL?: string;
  /** Google Cloud Console > OAuth 2.0 클라이언트 ID */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** 카카오 개발자센터 > 내 애플리케이션 > 앱 키 > JavaScript 키 */
  readonly VITE_KAKAO_MAP_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
