import React from 'react';
import {
  Sprout,
  LayoutDashboard,
  ScanLine,
  History,
  BookOpen,
  Settings,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import type { User } from '../types/api';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenScanModal: () => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  onOpenScanModal,
  currentUser,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scan', label: 'AI Crop Scan', icon: ScanLine },
    { id: 'history', label: 'Scan History', icon: History },
    { id: 'intelligence', label: 'Crop Advisory', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(23, 36, 24, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
          }}
        />
      )}

      <aside
        style={{
          width: '270px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid rgba(45, 90, 39, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem 1.25rem',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '4px 0 24px rgba(25, 56, 28, 0.03)',
        }}
        className="sidebar-container"
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary-sage)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(45, 90, 39, 0.25)',
              }}
            >
              <Sprout size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-deep)', lineHeight: 1.1 }}>
                GreenMind
              </h1>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary-accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Agri-AI Portal
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ display: 'none' }} className="mobile-close-btn">
            <X size={20} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Quick Scan Callout */}
        <div
          style={{
            backgroundColor: 'var(--bg-sage-light)',
            borderRadius: '16px',
            padding: '1rem',
            marginBottom: '1.75rem',
            border: '1px solid rgba(45, 90, 39, 0.1)',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-deep)', marginBottom: '0.25rem' }}>
            Detect Disease Now
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Instant AI diagnosis for leaf & crop health.
          </p>
          <button
            onClick={onOpenScanModal}
            style={{
              width: '100%',
              backgroundColor: 'var(--primary-sage)',
              color: '#ffffff',
              borderRadius: '10px',
              padding: '0.55rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <ScanLine size={16} /> Start New Scan
          </button>
        </div>

        {/* Navigation Section */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', paddingLeft: '0.5rem' }}>
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'scan') {
                    onOpenScanModal();
                  } else {
                    setActiveTab(item.id);
                  }
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.9rem',
                  color: isActive ? 'var(--primary-deep)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--bg-sage-light)' : 'transparent',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={19} color={isActive ? 'var(--primary-sage)' : 'var(--text-muted)'} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight size={16} color="var(--primary-sage)" />}
              </button>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        {currentUser && (
          <div
            style={{
              paddingTop: '1rem',
              marginTop: '1rem',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-mint)',
                  color: 'var(--primary-deep)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.email}
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              style={{
                padding: '0.4rem',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                transition: 'color 0.2s',
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </aside>

      <style>{`
        @media (min-width: 1024px) {
          .sidebar-container {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </>
  );
};
