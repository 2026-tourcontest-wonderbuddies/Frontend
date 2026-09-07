// 카카오맵 JavaScript SDK는 npm 패키지가 아니라 <script> 태그로 불러오기 때문에
// 타입 정의가 함께 오지 않는다. 여기서 "우리가 실제로 쓰는 API만" 손으로 선언해
// TypeScript가 window.kakao.maps.* 를 알아보게 한다.
// 전체 API 문서: https://apis.map.kakao.com/web/documentation/

declare namespace kakao.maps {
  /** SDK를 autoload=false 로 불러왔을 때, 실제 maps 모듈 초기화를 끝내고 콜백을 부른다. */
  function load(callback: () => void): void;

  class LatLng {
    constructor(latitude: number, longitude: number);
    getLat(): number;
    getLng(): number;
  }

  class LatLngBounds {
    constructor();
    extend(latlng: LatLng): void;
    isEmpty(): boolean;
  }

  interface MapOptions {
    center: LatLng;
    /** 숫자가 작을수록 확대. 제주 전체가 대략 9~10 정도. */
    level?: number;
    draggable?: boolean;
    scrollwheel?: boolean;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    setLevel(level: number): void;
    setBounds(bounds: LatLngBounds, paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number): void;
    relayout(): void;
  }

  interface CustomOverlayOptions {
    position: LatLng;
    /** 문자열 HTML 대신 DOM 엘리먼트를 넘길 수 있다(더 안전하다). */
    content: HTMLElement | string;
    map?: Map;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
    clickable?: boolean;
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
  }

  interface PolylineOptions {
    path: LatLng[];
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: "solid" | "shortdash" | "dash" | "dot";
  }

  class Polyline {
    constructor(options: PolylineOptions);
    setMap(map: Map | null): void;
  }

  namespace event {
    function addListener(target: object, type: string, handler: (...args: unknown[]) => void): void;
  }
}

interface Window {
  kakao?: { maps?: typeof kakao.maps };
}
