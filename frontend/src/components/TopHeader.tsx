import React from 'react';
import { Menu, ScanLine, Globe, User as UserIcon } from 'lucide-react';
import type { User } from '../types/api';

interface TopHeaderProps {
  onToggleSidebar: () => void;
  onOpenScanModal: () => void;
  currentUser: User | null;
  onOpenAuthModal: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleSidebar,
  onOpenScanModal,
  currentUser,
  onOpenAuthModal,
}) => {
  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid rgba(45, 90, 39, 0.08)',
        padding: '1.1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Title & Mobile Hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.4rem',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-primary)',
          }}
          className="lg:hidden-menu-btn"
        >
          <Menu size={22} color="var(--primary-deep)" />
        </button>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Farmer Dashboard
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Real-time crop health diagnostics & agricultural intelligence
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Language Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'var(--bg-primary)',
            padding: '0.45rem 0.85rem',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-light)',
          }}
        >
          <Globe size={15} color="var(--primary-sage)" />
          <span>English (en)</span>
        </div>

        {/* Scan CTA Button */}
        <button onClick={onOpenScanModal} className="btn-primary">
          <ScanLine size={18} />
          <span>Upload Crop Image</span>
        </button>

        {/* Profile / Auth Button */}
        {currentUser ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              backgroundColor: 'var(--bg-sage-light)',
              padding: '0.4rem 0.85rem 0.4rem 0.4rem',
              borderRadius: '999px',
              border: '1px solid rgba(45, 90, 39, 0.12)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-sage)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-deep)' }}>
              {currentUser.name}
            </span>
          </div>
        ) : (
          <button onClick={onOpenAuthModal} className="btn-secondary">
            <UserIcon size={17} />
            <span>Login / Register</span>
          </button>
        )}
      </div>
    </header>
  );
};
