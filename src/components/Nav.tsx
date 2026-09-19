import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav>
      <div className="logo">
        <span className="dot" />
        시간여행 제주
      </div>
      <div className="navlinks">
        <NavLink to="/" end data-label="홈" className={({ isActive }) => (isActive ? "on" : "")}>
          홈
        </NavLink>
        <NavLink to="/list" data-label="추천 코스" className={({ isActive }) => (isActive ? "on" : "")}>
          추천 코스
        </NavLink>
        <NavLink to="/search" data-label="장소 검색" className={({ isActive }) => (isActive ? "on" : "")}>
          장소 검색
        </NavLink>
        <NavLink to="/builder" data-label="나만의 코스 만들기" className={({ isActive }) => (isActive ? "on" : "")}>
          나만의 코스 만들기
        </NavLink>
        {user && (
          <NavLink to="/saved" data-label="저장함" className={({ isActive }) => (isActive ? "on" : "")}>
            저장함
          </NavLink>
        )}
      </div>
      <div className="nav-account">
        {user ? (
          <div className="account-badge">
            <span className="name">{user.name}</span>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              로그아웃
            </button>
          </div>
        ) : (
          <NavLink to="/login" className="account-badge">
            로그인
          </NavLink>
        )}
      </div>
    </nav>
  );
}
