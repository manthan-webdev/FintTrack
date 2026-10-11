import React, { useState } from 'react';
import { Shield, Moon, Download, Globe, User, LogOut, Check } from 'lucide-react';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Select } from '../components/common/Select.js';
import { LanguageSelector } from '../components/common/LanguageSelector.js';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../context/LanguageContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { CURRENCY_CONFIGS, SupportedCurrency } from '../utils/currency.js';

export const Settings: React.FC = () => {
  const { user, updateProfileData, logout } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState<'preferences' | 'security' | 'data'>('preferences');
  const [currency, setCurrency] = useState<SupportedCurrency>(
    user?.currency || 'INR'
  );
  const [savingCurrency, setSavingCurrency] = useState(false);

  const handleExportCSV = async () => {
    try {
      showToast('Generating your complete ledger backup...', 'info');
      await api.exportTransactionsCSV();
      showToast(t('common.success'), 'success');
    } catch {
      showToast(t('common.error'), 'error');
    }
  };

  const handleSaveCurrency = async () => {
    setSavingCurrency(true);
    try {
      await updateProfileData({ currency });
      showToast(t('common.success'), 'success');
    } catch {
      showToast(t('common.error'), 'error');
    } finally {
      setSavingCurrency(false);
    }
  };

  const currencyOptions = Object.entries(CURRENCY_CONFIGS).map(([code, config]) => ({
    value: code,
    label: `${config.symbol} ${config.code} — ${config.name}`,
  }));

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4F1EA]">
          {t('settings.title')}
        </h1>
        <p className="text-xs sm:text-sm text-[#9297A1] mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <div className="md:w-56 shrink-0">
          <div className="p-1.5 bg-[#111318] border border-[#262932] rounded-xl flex flex-row md:flex-col gap-1">
            <button
              onClick={() => setActiveSection('preferences')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeSection === 'preferences'
                  ? 'bg-[#17191F] text-[#C9B58A] border border-[#C9B58A]/30'
                  : 'text-[#9297A1] hover:text-[#F4F1EA]'
              }`}
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span>{t('settings.preferencesTab')}</span>
            </button>

            <button
              onClick={() => setActiveSection('security')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeSection === 'security'
                  ? 'bg-[#17191F] text-[#C9B58A] border border-[#C9B58A]/30'
                  : 'text-[#9297A1] hover:text-[#F4F1EA]'
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span>{t('settings.securityTab')}</span>
            </button>

            <button
              onClick={() => setActiveSection('data')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeSection === 'data'
                  ? 'bg-[#17191F] text-[#C9B58A] border border-[#C9B58A]/30'
                  : 'text-[#9297A1] hover:text-[#F4F1EA]'
              }`}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>{t('settings.dataTab')}</span>
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1">
          {activeSection === 'preferences' && (
            <Card className="flex flex-col gap-6 p-6">
              {/* Language Selection */}
              <div>
                <h3 className="text-base font-semibold text-[#F4F1EA] mb-1">
                  {t('settings.languageTitle')}
                </h3>
                <p className="text-xs text-[#9297A1] mb-3">
                  {t('settings.languageDesc')}
                </p>
                <LanguageSelector />
              </div>

              {/* Currency Selection */}
              <div className="pt-5 border-t border-[#262932]">
                <h3 className="text-base font-semibold text-[#F4F1EA] mb-1">
                  {t('profile.currency')}
                </h3>
                <p className="text-xs text-[#9297A1] mb-3">
                  Select your primary display currency for ledger entries and charts.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-md">
                  <Select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                    options={currencyOptions}
                  />
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSaveCurrency}
                    loading={savingCurrency}
                    icon={<Check className="w-4 h-4" />}
                  >
                    {t('common.save')}
                  </Button>
                </div>
              </div>

              {/* Theme appearance */}
              <div className="pt-5 border-t border-[#262932]">
                <h3 className="text-base font-semibold text-[#F4F1EA] mb-1">
                  {t('settings.appearanceTitle')}
                </h3>
                <p className="text-xs text-[#9297A1] mb-3">
                  {t('settings.appearanceDesc')}
                </p>
                <div className="p-3.5 rounded-xl border border-[#262932] bg-[#111318] flex items-center justify-between max-w-sm">
                  <div className="flex items-center gap-2.5 text-xs text-[#F4F1EA] font-medium">
                    <Moon className="w-4 h-4 text-[#C9B58A]" />
                    <span>Obsidian Dark (Standard)</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#78C99A]" />
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card className="flex flex-col gap-5 p-6">
              <div>
                <h3 className="text-base font-semibold text-[#F4F1EA]">
                  {t('settings.securityTitle')}
                </h3>
                <p className="text-xs text-[#9297A1] mt-0.5">
                  {t('settings.securityDesc')}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#111318] border border-[#262932] flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9297A1]">{t('settings.authenticatedAccount')}</span>
                  <span className="font-mono text-[#F4F1EA]">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9297A1]">{t('settings.databaseAuth')}</span>
                  <span className="font-mono text-[#78C99A]">{t('settings.rlsActive')}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#262932]">
                <p className="text-xs text-[#9297A1] leading-relaxed">
                  {t('settings.backupNotice')} Every transaction, category, and budget is cryptographically tied to your user ID.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => logout()}
                  icon={<LogOut className="w-3.5 h-3.5" />}
                >
                  {t('nav.logout')}
                </Button>
              </div>
            </Card>
          )}

          {activeSection === 'data' && (
            <Card className="flex flex-col gap-5 p-6">
              <div>
                <h3 className="text-base font-semibold text-[#F4F1EA]">
                  {t('settings.dataTitle')}
                </h3>
                <p className="text-xs text-[#9297A1] mt-0.5">
                  {t('settings.dataDesc')}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#111318] border border-[#262932] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-[#F4F1EA]">
                    {t('settings.exportCsvBtn')}
                  </h4>
                  <p className="text-xs text-[#9297A1] mt-0.5">
                    Download an offline CSV ledger backup of all your transactions.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExportCSV}
                  icon={<Download className="w-3.5 h-3.5" />}
                >
                  {t('analytics.export')}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
