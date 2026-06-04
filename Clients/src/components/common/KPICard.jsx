import React from 'react';
import './KPICard.css';
import { MdTrendingUp, MdTrendingDown, MdTrendingFlat } from 'react-icons/md';

const KPICard = ({
  icon,
  iconBg   = '#E0E7FF',
  iconColor = '#4F46E5',
  accent    = 'var(--primary)',
  value,
  label,
  trend,
  trendType = 'up',   // 'up' | 'down' | 'neutral'
  trendText = 'vs last month',
}) => {
  const TrendIcon =
    trendType === 'up'      ? MdTrendingUp   :
    trendType === 'down'    ? MdTrendingDown :
                              MdTrendingFlat;

  const trendClass =
    trendType === 'up'    ? 'up'      :
    trendType === 'down'  ? 'down'    :
                            'neutral';

  return (
    <div className="kpi-card" style={{ '--kpi-accent': accent }}>
      <div
        className="kpi-icon-wrap"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-trend ${trendClass}`}>
        <TrendIcon size={16} />
        <span>
          {trend > 0 ? `+${trend}` : trend}
        </span>
        <span className="kpi-trend-text">{trendText}</span>
      </div>
    </div>
  );
};

export default KPICard;
