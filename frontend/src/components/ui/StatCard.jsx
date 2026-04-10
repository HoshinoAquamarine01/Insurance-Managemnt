import Icon from "./Icon";

const toneMap = {
  blue: { icon: "document", className: "tone-blue" },
  green: { icon: "shield", className: "tone-green" },
  orange: { icon: "chart", className: "tone-orange" },
  violet: { icon: "calculator", className: "tone-violet" },
  red: { icon: "close", className: "tone-red" },
  slate: { icon: "grid", className: "tone-slate" },
};

export default function StatCard({ label, value, meta, accent = "blue" }) {
  const tone = toneMap[accent] || toneMap.blue;

  return (
    <article className={`stat-card ${tone.className}`}>
      <div>
        <p className="stat-label">{label}</p>
        <div className="stat-value">{value}</div>
        <p className="stat-meta">{meta}</p>
      </div>
      <div className="stat-icon">
        <Icon name={tone.icon} size={24} />
      </div>
    </article>
  );
}
