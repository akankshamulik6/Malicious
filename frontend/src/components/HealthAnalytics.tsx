import React from 'react';
import { PieChart, ShieldAlert, Cpu } from 'lucide-react';
import type { FarmerDashboardSummary } from '../types/api';

interface HealthAnalyticsProps {
  summary: FarmerDashboardSummary | null;
}

export const HealthAnalytics: React.FC<HealthAnalyticsProps> = ({ summary }) => {
  const total = summary ? summary.total_scans : 0;
  const healthy = summary ? summary.healthy_scans : 0;
  const diseased = summary ? summary.diseased_scans : 0;
  const unknown = Math.max(0, total - healthy - diseased);

  const healthyPct = total > 0 ? Math.round((healthy / total) * 100) : 0;
  const diseasedPct = total > 0 ? Math.round((diseased / total) * 100) : 0;
  const unknownPct = total > 0 ? Math.round((unknown / total) * 100) : 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem',
      }}
    >
      {/* Crop Health Distribution */}
      <div className="card-surface">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 className="card-title">
              <PieChart size={20} color="var(--primary-sage)" />
              Crop Health Distribution
            </h3>
            <p className="card-subtitle">Ratio of healthy vs diseased field diagnoses</p>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div
          style={{
            height: '14px',
            backgroundColor: '#e5ebe6',
            borderRadius: '999px',
            display: 'flex',
            overflow: 'hidden',
            marginBottom: '1.5rem',
          }}
        >
          {healthyPct > 0 && (
            <div
              style={{
                width: `${healthyPct}%`,
                backgroundColor: 'var(--status-healthy-text)',
                transition: 'width 0.4s ease',
              }}
              title={`Healthy: ${healthyPct}%`}
            />
          )}
          {diseasedPct > 0 && (
            <div
              style={{
                width: `${diseasedPct}%`,
                backgroundColor: 'var(--status-diseased-text)',
                transition: 'width 0.4s ease',
              }}
              title={`Diseased: ${diseasedPct}%`}
            />
          )}
          {unknownPct > 0 && (
            <div
              style={{
                width: `${unknownPct}%`,
                backgroundColor: 'var(--status-unknown-text)',
                transition: 'width 0.4s ease',
              }}
              title={`Unknown: ${unknownPct}%`}
            />
          )}
        </div>

        {/* Legend Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--status-healthy-text)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Healthy Crops</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              {healthy} ({healthyPct}%)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--status-diseased-text)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Diseased Foliage</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              {diseased} ({diseasedPct}%)
            </span>
          </div>

          {unknown > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--status-unknown-text)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Requires Review</span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {unknown} ({unknownPct}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Disease Intelligence Overview */}
      <div className="card-surface">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 className="card-title">
              <ShieldAlert size={20} color="var(--primary-sage)" />
              Diagnostic Model Info
            </h3>
            <p className="card-subtitle">Member 1 & Member 2 Service Specs</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-sage-light)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Cpu size={18} color="var(--primary-sage)" />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-deep)' }}>AI Classifier</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>crop_disease_classifier v1.0.0</div>
              </div>
            </div>
            <span className="badge badge-healthy">Active</span>
          </div>

          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-card-alt)',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Explainability Engine</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Grad-CAM Visual Heatmap</div>
            </div>
            <span className="badge" style={{ backgroundColor: '#ebf3ea', color: 'var(--primary-sage)' }}>Supported</span>
          </div>

          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-card-alt)',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Advisory Engine</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Agricultural Intelligence Advisor</div>
            </div>
            <span className="badge badge-healthy">Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
