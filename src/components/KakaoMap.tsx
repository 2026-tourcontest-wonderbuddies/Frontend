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
 * setBounds 에 넘길 여백(px). 코스가 화면에 꽉 차면 22px 짜리 마커의 양끝이 잘리므로
 * 여유를 준다. 실측(컨테이너 311px 기준): 0 이면 코스가 화면의 89%를 채워 잘리고,
 * 20~60 이면 45% 로 안전하게 들어가고, 90 이면 너무 멀어진다.
 */
const BOUNDS_PADDING = 40;

/** 코스 하나를 만들 때 쓰는 마커 DOM. CustomOverlay 는 문자열 대신 엘리먼트를 받는다. */
function createPinElement(point: KakaoMapPoint): HTMLAnchorElement {
  // innerHTML 로 조립하지 않는 이유: 장소 이름은 서버에서 온 값이라
  // 문자열로 붙이면 그 안의 HTML 이 그대로 실행될 수 있다(XSS).
  const anchor = document.createElement("a");
  anchor.className = "kakao-pin";
  anchor.href = kakaoPlaceUrl(point);
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.title = `${point.title} · 카카오맵에서 보기`;
  anchor.setAttribute("aria-label", `${point.title} 카카오맵에서 보기 (새 창)`);

  const dot = document.createElement("span");
  dot.className = "kakao-pin-dot";
  dot.textContent = point.label ?? "";

  const name = document.createElement("span");
  name.className = "kakao-pin-name";
  name.textContent = point.title;

  anchor.append(dot, name);
  return anchor;
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
      const overlay = new maps.CustomOverlay({
        position: positions[i],
        content: createPinElement(p),
        zIndex: 3,
        // 기본값(false)이면 오버레이 위에서 일어난 이벤트를 지도가 가져간다.
        // 마커가 링크로 동작해야 하므로 오버레이가 이벤트를 갖도록 명시한다.
        clickable: true,
      });
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

    const bounds = new maps.LatLngBounds();
    positions.forEach((pos) => bounds.extend(pos));

    function frameCourse() {
      // relayout() 이 먼저다. 지도는 컨테이너 크기를 생성 시점에 한 번 재고 기억하므로,
      // 그 뒤 레이아웃이 바뀌면 자기 크기를 잘못 알고 있게 된다. 그 상태로 배율을
      // 계산하면 어긋나기 때문에, 크기를 다시 재게 한 다음 화면을 맞춘다.
      map.relayout();

      if (positions.length === 1) {
        // 점이 하나면 setBounds 가 최대 배율까지 당겨버려서 동네만 보인다.
        map.setCenter(positions[0]);
        map.setLevel(5);
        return;
      }

      // 배율/중심은 전적으로 setBounds 에 맡긴다.
      // setBounds 직후의 getBounds() 는 아직 이전 화면 값을 돌려주므로(한 틱 늦다),
      // 그 값을 읽어 배율을 다시 계산하려 하면 매번 엉뚱한 판단을 하게 된다.
      map.setBounds(bounds, BOUNDS_PADDING, BOUNDS_PADDING, BOUNDS_PADDING, BOUNDS_PADDING);
    }

    // 최초 1회는 직접 호출한다. ResizeObserver 의 "observe 하면 즉시 한 번 호출"에
    // 기대면 안 된다 — 그 콜백은 렌더링 파이프라인에 묶여 있어서 탭이 화면에 보이지
    // 않으면 발화하지 않고, 지도가 생성자 기본 배율에 그대로 멈춘다(실제로 겪었다).
    frameCourse();

    // 이후 컨테이너 크기가 바뀌면(창 크기 변경, 반응형 레이아웃) 다시 맞춘다.
    const resizeObserver = new ResizeObserver(() => frameCourse());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      overlays.forEach((o) => o.setMap(null));
      line?.setMap(null);
      // 지도 DOM 은 SDK 가 컨테이너 안에 직접 만든 것이라 리액트가 정리해주지 않는다.
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
