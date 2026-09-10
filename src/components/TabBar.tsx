import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const items = [
  { to: "/", label: "홈", icon: "⌂", end: true },
  { to: "/list", label: "코스", icon: "▤", end: false },
  { to: "/search", label: "검색", icon: "⌕", end: false },
  { to: "/builder", label: "만들기", icon: "◎", end: false },
  { to: "/saved", label: "저장함", icon: "♡", end: false, authOnly: true },
];

export default function TabBar() {
  const { user } = useAuth();
  const visibleItems = items.filter((item) => !item.authOnly || user);

  return (
    <div className="tabbar">
      {visibleItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `tab-item${isActive ? " active" : ""}`}
        >
          <div className="ic">{item.icon}</div>
          <div>{item.label}</div>
        </NavLink>
      ))}
    </div>
  );
}
