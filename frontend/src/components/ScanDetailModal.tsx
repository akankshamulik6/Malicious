import React from 'react';
import { X, Sprout, ShieldAlert, Cpu, BookOpen, MapPin, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import type { CropScanResult, DiseaseStatus } from '../types/api';

interface ScanDetailModalProps {
  result: CropScanResult | null;
  onClose: () => void;
}

export const ScanDetailModal: React.FC<ScanDetailModalProps> = ({ result, onClose }) => {
  if (!result) return null;

  const { prediction, advisory } = result;
  const confidencePct = Math.round(prediction.confidence * 100);

  const getStatusBadge = (status: DiseaseStatus) => {
    switch (status) {
      case 'healthy':
        return <span className="badge badge-healthy">Healthy</span>;
      case 'diseased':
        return <span className="badge badge-diseased">Diseased</span>;
      default:
        return <span className="badge badge-unknown">Unknown</span>;
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'high':
        return <span className="badge badge-diseased">High Severity</span>;
      case 'moderate':
        return <span className="badge" style={{ backgroundColor: '#fff3cd', color: '#856404' }}>Moderate Severity</span>;
      case 'low':
        return <span className="badge badge-healthy">Low Severity</span>;
      default:
        return <span className="badge badge-unknown">Unspecified</span>;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(23, 36, 24, 0.5)',
        backdropFilter: 'blur(6px)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        className="card-surface animate-fade-in"
        style={{
          maxWidth: '750px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            padding: '0.4rem',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          <X size={20} color="var(--text-secondary)" />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'var(--bg-sage-light)',
              color: 'var(--primary-sage)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sprout size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {prediction.crop} — {prediction.disease}
              </h3>
              {getStatusBadge(prediction.status)}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Scan ID: <code style={{ backgroundColor: 'var(--bg-primary)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{prediction.scan_id}</code>
            </div>
          </div>
        </div>

        {/* Section 1: Member 1 AI Prediction Summary */}
        <div
          style={{
            backgroundColor: 'var(--bg-card-alt)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            border: '1px solid var(--border-light)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-deep)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Cpu size={16} color="var(--primary-sage)" /> Member 1 AI Inference Result
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confidence</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-deep)' }}>
                {confidencePct}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Model Specs</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {prediction.model_name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>v{prediction.model_version}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Processing Time</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {prediction.processing_time_ms} ms
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Explainability</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {prediction.explainability.method} ({prediction.explainability.available ? 'Available' : 'N/A'})
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Member 2 Agricultural Advisory */}
        {advisory ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-deep)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={18} color="var(--primary-sage)" /> Member 2 Agricultural Advisory
              </div>
              {getSeverityBadge(advisory.severity)}
            </div>

            {advisory.description && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {advisory.description}
              </p>
            )}

            {/* Symptoms & Causes Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {advisory.symptoms.length > 0 && (
                <div style={{ backgroundColor: '#fffdfa', padding: '1rem', borderRadius: '12px', border: '1px solid #fce8cc' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b25900', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ShieldAlert size={15} /> Observed Symptoms
                  </div>
                  <ul style={{ fontSize: '0.82rem', color: 'var(--text-primary)', paddingLeft: '1.2rem', lineHeight: 1.5 }}>
                    {advisory.symptoms.map((sym, i) => (
                      <li key={i}>{sym}</li>
                    ))}
                  </ul>
                </div>
              )}

              {advisory.possible_causes.length > 0 && (
                <div style={{ backgroundColor: 'var(--bg-card-alt)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Layers size={15} color="var(--primary-medium)" /> Possible Causes
                  </div>
                  <ul style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: 1.5 }}>
                    {advisory.possible_causes.map((cause, i) => (
                      <li key={i}>{cause}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Management Practices */}
            {advisory.management_practices.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-deep)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} color="var(--primary-sage)" /> Recommended Management Practices
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {advisory.management_practices.map((practice, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'var(--bg-sage-light)',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--primary-deep)',
                      }}
                    >
                      {i + 1}. {practice}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preventive Measures */}
            {advisory.preventive_measures.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-deep)', marginBottom: '0.5rem' }}>
                  Long-term Preventive Measures
                </h4>
                <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: 1.5 }}>
                  {advisory.preventive_measures.map((prev, i) => (
                    <li key={i}>{prev}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Regional Insight */}
            {advisory.regional_insight && advisory.regional_insight.available && (
              <div style={{ padding: '0.85rem 1rem', backgroundColor: '#eaf2ea', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--primary-deep)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} color="var(--primary-sage)" />
                <div>
                  <strong>Regional Insight ({advisory.regional_insight.region}):</strong> {advisory.regional_insight.trend} ({advisory.regional_insight.source})
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '1.25rem', backgroundColor: '#fffdf5', borderRadius: '12px', border: '1px solid #fee8c8', fontSize: '0.85rem', color: '#8a5300', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>Crop analysis complete. Detailed agricultural guidance is temporarily unavailable from Member 2.</span>
          </div>
        )}
      </div>
    </div>
  );
};
