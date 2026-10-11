import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar.js';
import { Navbar } from '../components/layout/Navbar.js';
import { MobileDrawer, MobileBottomBar } from '../components/layout/MobileNav.js';
import { TransactionModal } from '../components/transactions/TransactionModal.js';
import { DatabaseSetupBanner } from '../components/common/DatabaseSetupBanner.js';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Compute breadcrumbs based on pathname
  const getBreadcrumbs = () => {
    const path = location.pathname.replace(/^\//, '');
    const clean = path.charAt(0).toUpperCase() + path.slice(1);
    return ['FinTrack', clean || 'Dashboard'];
  };

  return (
    <div className="flex h-screen bg-[#08090B] text-[#F4F1EA] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onMenuToggle={() => setMobileMenuOpen(true)}
          onOpenAddTransaction={() => setIsAddTxOpen(true)}
          breadcrumbs={getBreadcrumbs()}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12 max-w-7xl w-full mx-auto">
          <DatabaseSetupBanner />
          <Outlet context={{ refreshTrigger, triggerRefresh: () => setRefreshTrigger((p) => p + 1) }} />
        </main>

        {/* Mobile bottom navigation bar */}
        <MobileBottomBar />
      </div>

      {/* Global Quick Add Transaction Modal */}
      <TransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        onSuccess={() => setRefreshTrigger((p) => p + 1)}
      />
    </div>
  );
};
