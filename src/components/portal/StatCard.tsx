"use client";

interface StatCardProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export default function StatCard({
  icon,
  iconBg,
  iconColor,
  value,
  label,
  change,
  changeType = "neutral",
}: StatCardProps) {
  return (
    <div className="portal-stat-card">
      <div
        className="stat-card-icon"
        style={{ background: iconBg, color: iconColor }}
      >
        <i className={icon} />
      </div>
      <div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
      {change && (
        <div className={`stat-card-change ${changeType}`}>
          <i
            className={
              changeType === "positive"
                ? "fa fa-arrow-trend-up"
                : changeType === "negative"
                ? "fa fa-arrow-trend-down"
                : "fa fa-minus"
            }
          />
          {change}
        </div>
      )}
    </div>
  );
}
