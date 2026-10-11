import React from 'react';
import { Menu, Plus, Download } from 'lucide-react';
import { Button } from '../common/Button.js';
import { LanguageSelector } from '../common/LanguageSelector.js';
import { useAuth } from '../../context/AuthContext.js';
import { useTranslation } from '../../context/LanguageContext.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';

interface NavbarProps {
  onMenuToggle: () => void;
  onOpenAddTransaction?: () => void;
  title?: string;
  breadcrumbs?: string[];
}

export const Navbar: React.FC<NavbarProps> = ({
  onMenuToggle,
  onOpenAddTransaction,
  title,
  breadcrumbs = ['FinTrack', 'Dashboard'],
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleExport = async () => {
    try {
      showToast('Preparing your CSV export...', 'info');
      await api.exportTransactionsCSV();
      showToast(t('common.success'), 'success');
    } catch {
      showToast(t('common.error'), 'error');
    }
  };

  return (
    <header className="h-16 bg-[#111318]/90 backdrop-blur-md border-b border-[#262932] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-[#9297A1] hover:text-[#F4F1EA] hover:bg-[#17191F] transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb}>
              {idx > 0 && <span className="text-[#9297A1]/60 font-mono">/</span>}
              <span
                className={`${
                  idx === breadcrumbs.length - 1
                    ? 'font-semibold text-[#F4F1EA]'
                    : 'text-[#9297A1] hidden sm:inline'
                }`}
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right: Language, Quick Add & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language selector */}
        <LanguageSelector />

        {/* CSV Export Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          icon={<Download className="w-3.5 h-3.5" />}
          className="hidden md:inline-flex"
        >
          {t('transactions.exportCsv')}
        </Button>

        {/* Quick Add Transaction Button */}
        {onOpenAddTransaction && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAddTransaction}
            icon={<Plus className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">{t('transactions.addTransaction')}</span>
            <span className="sm:hidden">+</span>
          </Button>
        )}

        {/* Currency badge */}
        <div className="hidden sm:flex items-center px-2 py-1 rounded bg-[#17191F] border border-[#262932] text-[11px] font-mono font-medium text-[#C9B58A]">
          {user?.currency || 'INR'}
        </div>

        {/* User Avatar Mini */}
        <div className="w-8 h-8 rounded-lg bg-[#262932] border border-[#363A45] flex items-center justify-center text-xs font-semibold text-[#F4F1EA] select-none">
          {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
};
