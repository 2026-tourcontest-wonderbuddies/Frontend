import { useEffect, useState } from "react";

// 카카오맵 SDK는 <script> 태그로만 불러올 수 있다(npm 패키지가 없다).
// 이 훅이 그 스크립트를 딱 한 번만 넣고, 준비 상태를 리액트 쪽에 알려준다.

export type KakaoSdkStatus =
  /** VITE_KAKAO_MAP_KEY 가 없어서 지도를 띄울 수 없는 상태 */
  | "no-key"
  /** 스크립트 로딩 중 */
  | "loading"
  /** window.kakao.maps 사용 가능 */
  | "ready"
  /** 네트워크 실패, 잘못된 키, 도메인 미등록 등 */
  | "error";

const APP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY?.trim();

// 모듈 최상단에 두는 이유: 지도 컴포넌트가 여러 개 마운트되거나
// React StrictMode 가 개발 중에 이펙트를 두 번 실행해도
// <script> 는 한 번만 삽입되도록 약속(Promise)을 캐싱한다.
let sdkPromise: Promise<void> | null = null;

function loadKakaoSdk(appKey: string): Promise<void> {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    if (window.kakao?.maps) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    // autoload=false 로 받아야 maps 모듈 초기화 시점을 우리가 잡을 수 있다.
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.async = true;
    script.onload = () => {
      const maps = window.kakao?.maps;
      if (!maps) {
        reject(new Error("Kakao SDK loaded but window.kakao.maps is missing"));
        return;
      }
      maps.load(() => resolve());
    };
    script.onerror = () => reject(new Error("Failed to load Kakao Maps SDK"));
    document.head.appendChild(script);
  });

  return sdkPromise;
}

export function useKakaoSdk(): KakaoSdkStatus {
  const [status, setStatus] = useState<KakaoSdkStatus>(APP_KEY ? "loading" : "no-key");

  useEffect(() => {
    if (!APP_KEY) return;

    // 언마운트된 뒤에 setState 가 불리지 않도록 하는 흔한 방어 패턴.
    let alive = true;

    loadKakaoSdk(APP_KEY).then(
      () => {
        if (alive) setStatus("ready");
      },
      (err: unknown) => {
        // 실패한 약속을 캐시에 남겨두면 영영 재시도가 안 되므로 비운다.
        sdkPromise = null;
        console.error("[kakao-map]", err);
        if (alive) setStatus("error");
      },
    );

    return () => {
      alive = false;
    };
  }, []);

  return status;
}
