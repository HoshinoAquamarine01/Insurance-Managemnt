import Icon from "./Icon";

const iconMap = {
  document: "document",
  users: "users",
  calculator: "calculator",
  eye: "eye",
  lock: "lock",
  arrow: "arrow",
};

export default function RoleIconCard({
  title,
  description,
  accent = "blue",
  icon = "document",
}) {
  return (
    <div className={`feature-card feature-${accent}`}>
      <div className="feature-card__icon">
        <Icon name={iconMap[icon] || "document"} size={22} />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}
