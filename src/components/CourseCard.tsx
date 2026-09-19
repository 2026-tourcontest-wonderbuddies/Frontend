import { useNavigate } from "react-router-dom";

interface CourseCardProps {
  to: string;
  gradient: string;
  badge: string;
  title: string;
  metaChips: string[];
  desc?: string;
}

export default function CourseCard({ to, gradient, badge, title, metaChips, desc }: CourseCardProps) {
  const navigate = useNavigate();
  // 장소 개수는 메타칩에도 나오므로, 카드 상단 배지에서는 "N곳" 부분을 뺀다.
  const badgeLabel = badge.split(" · ")[0];

  return (
    <div className="course-card" role="button" tabIndex={0} onClick={() => navigate(to)}>
      <div className="course-photo" style={{ background: gradient }}>
        <span className="badge">{badgeLabel}</span>
        <span
          className="save-btn"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          ♡
        </span>
      </div>
      <div className="course-body">
        <div className="course-title">{title}</div>
        <div className="course-meta">
          {metaChips.map((chip) => (
            <span className="meta-chip" key={chip}>
              {chip}
            </span>
          ))}
        </div>
        {desc && <p className="course-desc">{desc}</p>}
      </div>
    </div>
  );
}
