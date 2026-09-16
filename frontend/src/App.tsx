import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { HeroBanner } from './components/HeroBanner';
import { KpiCards } from './components/KpiCards';
import { HealthAnalytics } from './components/HealthAnalytics';
import { RecentScansTable } from './components/RecentScansTable';
import { ScanModal } from './components/ScanModal';
import { ScanDetailModal } from './components/ScanDetailModal';
import { AuthModal } from './components/AuthModal';

import { getMe, getDashboardSummary, getScanDetail, getStoredToken, setStoredToken } from './services/api';
import type { User, FarmerDashboardSummary, CropScanResult } from './types/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<FarmerDashboardSummary | null>(null);

  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<CropScanResult | null>(null);

  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setCurrentUser(null);
      setSummary(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const user = await getMe();
      setCurrentUser(user);

      const dashSummary = await getDashboardSummary();
      setSummary(dashSummary);
    } catch (e) {
      console.warn('Authentication token expired or backend offline:', e);
      setStoredToken(null);
      setCurrentUser(null);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleLogout = () => {
    setStoredToken(null);
    setCurrentUser(null);
    setSummary(null);
  };

  const handleScanCompleted = (result: CropScanResult) => {
    setIsScanModalOpen(false);
    setSelectedResult(result);
    // Refresh dashboard statistics
    loadUserData();
  };

  const handleSelectScan = async (scanId: string) => {
    try {
      const detail = await getScanDetail(scanId);
      setSelectedResult(detail);
    } catch (err) {
      console.error('Failed to load scan detail:', err);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenScanModal={() => {
          if (!currentUser) {
            setIsAuthModalOpen(true);
          } else {
            setIsScanModalOpen(true);
          }
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Layout Area */}
      <div className="main-wrapper" style={{ marginLeft: sidebarOpen ? '0' : '0' }}>
        <style>{`
          @media (min-width: 1024px) {
            .main-wrapper {
              margin-left: 270px !important;
            }
          }
        `}</style>

        <TopHeader
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenScanModal={() => {
            if (!currentUser) {
              setIsAuthModalOpen(true);
            } else {
              setIsScanModalOpen(true);
            }
          }}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        <main className="dashboard-content">
          {loading && (
            <div style={{ fontSize: '0.85rem', color: 'var(--primary-sage)', fontWeight: 600 }}>
              Connecting to backend service...
            </div>
          )}

          {/* Hero Welcome Banner */}
          <HeroBanner
            currentUser={currentUser}
            summary={summary}
            onOpenScanModal={() => {
              if (!currentUser) {
                setIsAuthModalOpen(true);
              } else {
                setIsScanModalOpen(true);
              }
            }}
          />

          {/* KPI Summary Cards */}
          <KpiCards summary={summary} />

          {/* Main Health Analytics */}
          <HealthAnalytics summary={summary} />

          {/* Recent Scans Data Table */}
          <RecentScansTable
            scans={summary ? summary.recent_scans : []}
            onSelectScan={handleSelectScan}
            onOpenScanModal={() => {
              if (!currentUser) {
                setIsAuthModalOpen(true);
              } else {
                setIsScanModalOpen(true);
              }
            }}
          />
        </main>
      </div>

      {/* Upload Scan Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScanCompleted={handleScanCompleted}
      />

      {/* Scan Detail & Advisory Modal */}
      <ScanDetailModal
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          loadUserData();
        }}
      />
    </div>
  );
};

export default App;
