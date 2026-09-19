import { useLocation } from "react-router-dom";

const HIDE_ON_MOBILE = ["/list", "/search", "/builder", "/saved"];

export default function Footer() {
  const { pathname } = useLocation();
  const hideOnMobile = HIDE_ON_MOBILE.some((p) => pathname.startsWith(p));

  return (
    <footer className={hideOnMobile ? "footer-hide-mobile" : undefined}>
      시간여행 제주 — 시간 테마 제주 여행코스 추천
      <br />
      만든 사람들 : 원더버디즈(WonderBuddies) · © 2026
      <br />
      출처 : ⓒ한국관광공사 · 지도 ⓒ Kakao
    </footer>
  );
}
