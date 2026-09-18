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

  return (
    <div className="course-card" role="button" tabIndex={0} onClick={() => navigate(to)}>
      <div className="course-photo" style={{ background: gradient }}>
        <span className="badge">{badge}</span>
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
