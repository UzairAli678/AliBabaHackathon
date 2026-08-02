import React from 'react';

export default function CircularGauge({ value, label, tone = 'primary' }) {
  const size = 168;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.max(0, Math.min(value, 100)) / 100) * circumference;

  const toneStyles = {
    primary: '#0f766e',
    caution: '#d97706',
    critical: '#dc2626',
    positive: '#16a34a'
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={toneStyles[tone] || toneStyles.primary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-medium tracking-tight text-heading">{Math.round(value)}</div>
        <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">{label}</div>
      </div>
    </div>
  );
}
