import React from 'react';
import { History, Eye, ChevronRight, Sprout } from 'lucide-react';
import type { ScanSummary, DiseaseStatus } from '../types/api';

interface RecentScansTableProps {
  scans: ScanSummary[];
  onSelectScan: (scanId: string) => void;
  onOpenScanModal: () => void;
}

export const RecentScansTable: React.FC<RecentScansTableProps> = ({
  scans,
  onSelectScan,
  onOpenScanModal,
}) => {
  const getStatusBadge = (status: DiseaseStatus) => {
    switch (status) {
      case 'healthy':
        return <span className="badge badge-healthy">Healthy</span>;
      case 'diseased':
        return <span className="badge badge-diseased">Diseased</span>;
      default:
        return <span className="badge badge-unknown">Review Needed</span>;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="card-surface">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h3 className="card-title">
            <History size={20} color="var(--primary-sage)" />
            Recent Field Scans & Diagnostics
          </h3>
          <p className="card-subtitle">Real-time disease classification history from Member 1 & 2</p>
        </div>
      </div>

      {scans.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            backgroundColor: 'var(--bg-card-alt)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-light)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-sage-light)',
              color: 'var(--primary-sage)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <Sprout size={28} />
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            No Crop Scans Recorded Yet
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', maxWidth: '380px', margin: '0 auto 1.25rem' }}>
            Upload your first crop leaf sample to run AI disease detection and receive instant agricultural guidance.
          </p>
          <button onClick={onOpenScanModal} className="btn-primary">
            Upload First Crop Image
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border-light)',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '0.75rem 1rem' }}>Crop</th>
                <th style={{ padding: '0.75rem 1rem' }}>Diagnosis</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>AI Confidence</th>
                <th style={{ padding: '0.75rem 1rem' }}>Scan Date</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => {
                const confidencePct = Math.round(scan.confidence * 100);
                return (
                  <tr
                    key={scan.scan_id}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-alt)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-sage-light)',
                            color: 'var(--primary-sage)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Sprout size={16} />
                        </div>
                        <span>{scan.crop}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {scan.disease}
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>{getStatusBadge(scan.status)}</td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: '60px',
                            height: '6px',
                            backgroundColor: '#e5ebe6',
                            borderRadius: '999px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${confidencePct}%`,
                              height: '100%',
                              backgroundColor: 'var(--primary-sage)',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {confidencePct}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {formatDate(scan.created_at)}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => onSelectScan(scan.scan_id)}
                        style={{
                          backgroundColor: 'var(--bg-sage-light)',
                          color: 'var(--primary-deep)',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Eye size={14} /> View Advisory <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
