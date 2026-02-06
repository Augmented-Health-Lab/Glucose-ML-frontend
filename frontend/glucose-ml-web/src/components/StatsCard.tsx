import "./StatsCard.css";

interface StatItem {
  value: string;
  label: string;
}

interface StatsCardProps {
  title?: string;
  subtitle?: string;
  stats: StatItem[];
}

const StatsCard = ({ title, subtitle, stats }: StatsCardProps) => {
  return (
    <div className="stats-card">
      {title && <h1 className="stats-title">{title}</h1>}
      {subtitle && <p className="stats-subtitle">{subtitle}</p>}
      <div className="stats-container">
        {stats.map((stat, index) => (
          <div key={index} className="stat-item">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            {index < stats.length - 1 && <div className="stat-divider" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsCard;
