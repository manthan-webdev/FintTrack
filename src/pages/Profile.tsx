import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Coins, LogOut, Check, CreditCard } from 'lucide-react';
import { Card } from '../components/common/Card.js';
import { Input } from '../components/common/Input.js';
import { Select } from '../components/common/Select.js';
import { Button } from '../components/common/Button.js';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../context/LanguageContext.js';
import { useToast } from '../context/ToastContext.js';
import { formatDate } from '../utils/date.js';
import { SupportedCurrency, CURRENCY_CONFIGS, formatCurrency } from '../utils/currency.js';

export const Profile: React.FC = () => {
  const { user, updateProfileData, logout } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [currency, setCurrency] = useState<SupportedCurrency>(
    user?.currency || 'INR'
  );
  const [monthlyIncome, setMonthlyIncome] = useState<string>(
    user?.monthly_income !== undefined ? String(user.monthly_income) : '0'
  );
  const [avgSpending, setAvgSpending] = useState<string>(
    user?.average_monthly_spending !== undefined ? String(user.average_monthly_spending) : '0'
  );
  const [avgSavings, setAvgSavings] = useState<string>(
    user?.average_monthly_savings !== undefined ? String(user.average_monthly_savings) : '0'
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(
    user?.preferred_payment_method || 'UPI'
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setCurrency(user.currency || 'INR');
      setMonthlyIncome(user.monthly_income !== undefined ? String(user.monthly_income) : '0');
      setAvgSpending(user.average_monthly_spending !== undefined ? String(user.average_monthly_spending) : '0');
      setAvgSavings(user.average_monthly_savings !== undefined ? String(user.average_monthly_savings) : '0');
      setPaymentMethod(user.preferred_payment_method || 'UPI');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    setLoading(true);
    try {
      await updateProfileData({
        full_name: fullName.trim(),
        currency: currency,
        monthly_income: parseFloat(monthlyIncome) || 0,
        average_monthly_spending: parseFloat(avgSpending) || 0,
        average_monthly_savings: parseFloat(avgSavings) || 0,
        preferred_payment_method: paymentMethod,
      });
      showToast(t('profile.profileUpdatedSuccess'), 'success');
    } catch {
      showToast(t('common.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const currencyOptions = Object.entries(CURRENCY_CONFIGS).map(([code, config]) => ({
    value: code,
    label: `${config.symbol} ${config.code} — ${config.name}`,
  }));

  const paymentOptions = [
    { value: 'UPI', label: 'UPI' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Debit/Credit Card', label: 'Debit / Credit Card' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4F1EA]">
          {t('profile.title')}
        </h1>
        <p className="text-xs sm:text-sm text-[#9297A1] mt-1">
          {t('profile.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Profile Overview Card */}
        <div className="md:col-span-1">
          <Card className="flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-[#C9B58A] flex items-center justify-center font-bold text-xl text-[#08090B] mb-3 shadow-md select-none">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <h2 className="text-base font-semibold text-[#F4F1EA]">{user?.full_name}</h2>
            <p className="text-xs text-[#9297A1] mt-0.5 truncate max-w-full">{user?.email}</p>

            <div className="w-full pt-4 mt-4 border-t border-[#262932] flex flex-col gap-2.5 text-xs text-left">
              <div className="flex items-center justify-between text-[#9297A1]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {t('profile.memberSince')}
                </span>
                <span className="font-mono text-[#F4F1EA]">
                  {formatDate(user?.created_at || new Date().toISOString())}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#9297A1]">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  {t('profile.currency')}
                </span>
                <span className="font-mono text-[#C9B58A] font-semibold">
                  {user?.currency || 'INR'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#9297A1]">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  {t('profile.paymentMethod')}
                </span>
                <span className="text-[#F4F1EA] font-medium">
                  {user?.preferred_payment_method || 'UPI'}
                </span>
              </div>
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={() => logout()}
              icon={<LogOut className="w-3.5 h-3.5" />}
              className="w-full mt-6"
            >
              {t('nav.logout')}
            </Button>
          </Card>
        </div>

        {/* Right Settings Form */}
        <div className="md:col-span-2">
          <Card className="p-6">
            <h3 className="text-base font-semibold text-[#F4F1EA] mb-4 pb-3 border-b border-[#262932]">
              {t('profile.accountDetails')}
            </h3>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <Input
                label={t('profile.fullName')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label={t('profile.emailAddress')}
                value={user?.email || ''}
                disabled
                icon={<Mail className="w-4 h-4" />}
                helperText="Email is bound to your authentication login."
              />

              <Select
                label={t('profile.currency')}
                value={currency}
                onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                options={currencyOptions}
              />

              <div className="pt-3 border-t border-[#262932]">
                <h4 className="text-sm font-semibold text-[#F4F1EA] mb-3">
                  {t('profile.financialProfile')}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label={t('profile.monthlyIncome')}
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                  />

                  <Input
                    label={t('profile.avgSpending')}
                    type="number"
                    value={avgSpending}
                    onChange={(e) => setAvgSpending(e.target.value)}
                  />

                  <Input
                    label={t('profile.avgSavings')}
                    type="number"
                    value={avgSavings}
                    onChange={(e) => setAvgSavings(e.target.value)}
                  />

                  <Select
                    label={t('profile.paymentMethod')}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    options={paymentOptions}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262932] mt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={loading}
                  icon={<Check className="w-4 h-4" />}
                >
                  {t('profile.saveProfileChanges')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
