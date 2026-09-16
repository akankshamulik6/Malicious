import React from 'react';
import { Sprout, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import type { FarmerDashboardSummary } from '../types/api';

interface KpiCardsProps {
  summary: FarmerDashboardSummary | null;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ summary }) => {
  const total = summary ? summary.total_scans : 0;
  const healthy = summary ? summary.healthy_scans : 0;
  const diseased = summary ? summary.diseased_scans : 0;
  const healthRate = total > 0 ? Math.round((healthy / total) * 100) : 100;

  const cards = [
    {
      title: 'Total Field Scans',
      value: total,
      unit: 'scans',
      subtitle: 'Recorded crop diagnoses',
      icon: Sprout,
      iconBg: 'var(--bg-sage-light)',
      iconColor: 'var(--primary-sage)',
    },
    {
      title: 'Healthy Crops',
      value: healthy,
      unit: 'samples',
      subtitle: total > 0 ? `${Math.round((healthy / total) * 100)}% of total crops` : 'No disease detected',
      icon: CheckCircle2,
      iconBg: 'var(--status-healthy-bg)',
      iconColor: 'var(--status-healthy-text)',
    },
    {
      title: 'Diseased Crops',
      value: diseased,
      unit: 'alerts',
      subtitle: diseased > 0 ? 'Requires management' : 'No pathogen alerts',
      icon: AlertTriangle,
      iconBg: 'var(--status-diseased-bg)',
      iconColor: 'var(--status-diseased-text)',
    },
    {
      title: 'Field Health Rate',
      value: `${healthRate}%`,
      unit: 'score',
      subtitle: healthRate >= 80 ? 'Optimal field condition' : 'Review advisory notices',
      icon: Activity,
      iconBg: 'rgba(63, 121, 54, 0.12)',
      iconColor: 'var(--primary-medium)',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
      }}
    >
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="card-surface"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '145px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {card.title}
                </span>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem', lineHeight: 1.1 }}>
                  {card.value}
                </div>
              </div>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  backgroundColor: card.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={22} color={card.iconColor} />
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>{card.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
