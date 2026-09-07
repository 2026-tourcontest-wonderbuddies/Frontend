import { useEffect, useRef, type ReactNode } from "react";
import { useKakaoSdk } from "../hooks/useKakaoSdk";
import { hasValidCoords, kakaoPlaceUrl } from "../utils/kakao";

export interface KakaoMapPoint {
  /** 리스트 key 겸 마커 식별자 */
  id: string;
  title: string;
  latitude?: number;
  longitude?: number;
  /** 마커 안에 찍을 글자. 코스 순서 번호 등. 없으면 점만 찍는다. */
  label?: string;
}

interface KakaoMapProps {
  points: KakaoMapPoint[];
  /** 마커를 순서대로 선으로 이을지 (코스 지도용) */
  showRoute?: boolean;
  /** 지도 높이(px) */
  height?: number;
  /** 키가 없거나 SDK 로딩에 실패했을 때 대신 보여줄 내용 */
  fallback: ReactNode;
}

/**
 * 카카오맵 SDK로 실제 지도를 그린다.
 * 마커는 CustomOverlay + <a> 로 만들어서, 클릭하면 그대로 카카오맵 장소 링크로 이동한다.
 * 키가 없거나 SDK가 뜨지 않으면 fallback(기존 미리보기 지도)으로 조용히 내려간다.
 */
export default function KakaoMap({ points, showRoute = false, height = 420, fallback }: KakaoMapProps) {
  const status = useKakaoSdk();
  const containerRef = useRef<HTMLDivElement>(null);

  const plottable = points.filter((p) => hasValidCoords(p.latitude, p.longitude));

  // points 는 부모가 렌더할 때마다 새 배열로 만들어지므로, 배열 자체를 의존성에 넣으면
  // 이펙트가 매 렌더 다시 돈다. 좌표가 실제로 바뀔 때만 다시 그리도록 문자열 키로 비교한다.
  const pointsKey = plottable.map((p) => `${p.id}@${p.latitude},${p.longitude}`).join("|");

  useEffect(() => {
    const container = containerRef.current;
    if (status !== "ready" || !container || plottable.length === 0) return;

    const maps = window.kakao!.maps!;
    const positions = plottable.map((p) => new maps.LatLng(p.latitude!, p.longitude!));

    const map = new maps.Map(container, { center: positions[0], level: 9 });

    const overlays = plottable.map((p, i) => {
      // innerHTML 대신 DOM API로 조립한다. 장소 이름은 서버에서 온 값이라
      // 문자열로 붙이면 그 안의 HTML이 그대로 실행될 수 있기 때문(XSS).
      const anchor = document.createElement("a");
      anchor.className = "kakao-pin";
      anchor.href = kakaoPlaceUrl(p);
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.title = `${p.title} · 카카오맵에서 보기`;
      anchor.setAttribute("aria-label", `${p.title} 카카오맵에서 보기 (새 창)`);

      const dot = document.createElement("span");
      dot.className = "kakao-pin-dot";
      dot.textContent = p.label ?? "";

      const name = document.createElement("span");
      name.className = "kakao-pin-name";
      name.textContent = p.title;

      anchor.append(dot, name);

      const overlay = new maps.CustomOverlay({ position: positions[i], content: anchor, zIndex: 3 });
      overlay.setMap(map);
      return overlay;
    });

    const line =
      showRoute && positions.length > 1
        ? new maps.Polyline({
            path: positions,
            strokeWeight: 3,
            strokeColor: "#FF6F59",
            strokeOpacity: 0.85,
            strokeStyle: "solid",
          })
        : null;
    line?.setMap(map);

    if (positions.length === 1) {
      // 점이 하나면 setBounds가 최대 배율까지 당겨버려서 동네만 보인다.
      map.setCenter(positions[0]);
      map.setLevel(5);
    } else {
      const bounds = new maps.LatLngBounds();
      positions.forEach((pos) => bounds.extend(pos));
      map.setBounds(bounds, 60, 40, 40, 40);
    }

    return () => {
      overlays.forEach((o) => o.setMap(null));
      line?.setMap(null);
      // 지도 DOM은 SDK가 컨테이너 안에 직접 만든 것이라 리액트가 정리해주지 않는다.
      container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pointsKey 가 좌표 변화를 대신 나타낸다
  }, [status, pointsKey, showRoute]);

  if (status === "no-key" || status === "error" || plottable.length === 0) {
    return <>{fallback}</>;
  }

  if (status === "loading") {
    return (
      <div className="kakao-map kakao-map-loading" style={{ height }}>
        <div className="spinner" />
      </div>
    );
  }

  return <div ref={containerRef} className="kakao-map" style={{ height }} />;
}
