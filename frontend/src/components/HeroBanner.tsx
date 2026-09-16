import React from 'react';
import { Leaf, ScanLine, ArrowUpRight, ShieldCheck } from 'lucide-react';
import type { User, FarmerDashboardSummary } from '../types/api';

interface HeroBannerProps {
  currentUser: User | null;
  summary: FarmerDashboardSummary | null;
  onOpenScanModal: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  currentUser,
  summary,
  onOpenScanModal,
}) => {
  const userName = currentUser ? currentUser.name.split(' ')[0] : 'Farmer';
  const totalScans = summary ? summary.total_scans : 0;
  const healthyScans = summary ? summary.healthy_scans : 0;
  const healthPercentage = totalScans > 0 ? Math.round((healthyScans / totalScans) * 100) : 100;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #19381C 0%, #2D5A27 60%, #3F7936 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.25rem 2.5rem',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 16px 36px rgba(25, 56, 28, 0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '2rem',
      }}
      className="animate-fade-in"
    >
      {/* Background Decorative Pattern */}
      <div
        style={{
          position: 'absolute',
          right: '-40px',
          bottom: '-40px',
          opacity: 0.12,
          pointerEvents: 'none',
        }}
      >
        <Leaf size={280} />
      </div>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            marginBottom: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <ShieldCheck size={16} />
          <span>AI-Powered Disease Detection Active</span>
        </div>

        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '0.65rem' }}>
          Good day, {userName}! 🌿
        </h2>

        <p style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          {totalScans > 0
            ? `Your fields are monitored across ${totalScans} scans with a ${healthPercentage}% healthy crop rate. Analyze new foliage samples anytime for instant treatment advice.`
            : 'Start monitoring your crops today. Upload leaf images for instant AI disease classification and tailored agricultural advisory.'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenScanModal}
            style={{
              backgroundColor: '#ffffff',
              color: 'var(--primary-deep)',
              fontWeight: 700,
              padding: '0.8rem 1.6rem',
              borderRadius: 'var(--radius-md)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.9rem',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease',
            }}
          >
            <ScanLine size={19} color="var(--primary-sage)" />
            <span>Scan Crop Leaf</span>
            <ArrowUpRight size={17} />
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Widget */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(12px)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          minWidth: '220px',
        }}
        className="hidden lg:flex"
      >
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase' }}>
            FIELD HEALTH STATUS
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.15rem' }}>
            {healthPercentage}%
          </div>
        </div>
        <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${healthPercentage}%`,
              backgroundColor: '#7BB166',
              borderRadius: '999px',
            }}
          />
        </div>
        <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.85)' }}>
          {healthyScans} healthy out of {totalScans} total scans
        </div>
      </div>
    </div>
  );
};
