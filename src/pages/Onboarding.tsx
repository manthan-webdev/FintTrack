import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  MoreHorizontal,
  Coins,
} from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { LanguageSelector } from '../components/common/LanguageSelector.js';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../context/LanguageContext.js';
import { useToast } from '../context/ToastContext.js';
import { CURRENCY_CONFIGS, SupportedCurrency } from '../utils/currency.js';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfileData } = useAuth();
  const { t, language } = useTranslation();
  const { showToast } = useToast();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // Form states
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [avgSpending, setAvgSpending] = useState<string>('');
  const [avgSavings, setAvgSavings] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [currency, setCurrency] = useState<SupportedCurrency>(user?.currency || 'INR');

  const currencySymbol = CURRENCY_CONFIGS[currency]?.symbol || '₹';

  const paymentOptions = [
    { id: 'UPI', label: 'UPI / Instant Pay', icon: QrCode },
    { id: 'Debit/Credit Card', label: 'Debit / Credit Card', icon: CreditCard },
    { id: 'Bank Transfer', label: 'Bank Transfer / NetBanking', icon: Building },
    { id: 'Cash', label: 'Cash', icon: Banknote },
    { id: 'Other', label: 'Other', icon: MoreHorizontal },
  ];

  const currencyOptions = Object.entries(CURRENCY_CONFIGS).map(([code, config]) => ({
    code: code as SupportedCurrency,
    symbol: config.symbol,
    name: config.name,
  }));

  const handleNext = () => {
    if (step < 4) {
      setStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await updateProfileData({
        monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : 0,
        average_monthly_spending: avgSpending ? parseFloat(avgSpending) : 0,
        average_monthly_savings: avgSavings ? parseFloat(avgSavings) : 0,
        preferred_payment_method: paymentMethod,
        currency: currency,
        onboarding_completed: true,
        preferred_language: language,
      });

      showToast(t('common.success'), 'success');
      navigate('/dashboard', { replace: true });
    } catch {
      showToast(t('common.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090B] text-[#F4F1EA] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Header with Brand & Language Selector */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C9B58A] flex items-center justify-center font-bold text-[#08090B] text-sm shadow-sm">
            FT
          </div>
          <span className="text-base font-bold tracking-tight text-[#F4F1EA]">FinTrack</span>
        </div>
        <LanguageSelector />
      </header>

      {/* Main Container */}
      <main className="max-w-xl w-full mx-auto my-auto">
        <div className="bg-[#111318] border border-[#262932] rounded-2xl p-6 sm:p-8 shadow-xl">
          {/* Header */}
          <div className="mb-6 pb-5 border-b border-[#262932]">
            <span className="text-xs font-mono font-medium text-[#C9B58A] block mb-1">
              {t('onboarding.stepOf', { current: step, total: 4 })}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4F1EA]">
              {t('onboarding.welcomeTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-[#9297A1] mt-1 leading-relaxed">
              {t('onboarding.welcomeSub')}
            </p>
          </div>

          {/* Step 1: Monthly Income */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-semibold text-[#F4F1EA] mb-1">
                  {t('onboarding.step1Title')}
                </h2>
                <p className="text-xs text-[#9297A1]">
                  {t('onboarding.step1Question')}
                </p>
              </div>

              <div className="py-2">
                <Input
                  type="number"
                  placeholder={t('onboarding.step1Placeholder')}
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  icon={<span className="font-mono font-bold text-[#C9B58A]">{currencySymbol}</span>}
                  autoFocus
                />
                <p className="text-xs text-[#9297A1] mt-2">
                  {t('onboarding.step1Helper')}
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Spending & Savings */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-semibold text-[#F4F1EA] mb-1">
                  {t('onboarding.step2Title')}
                </h2>
                <p className="text-xs text-[#9297A1]">
                  Give a rough monthly estimate to help establish baseline guidelines.
                </p>
              </div>

              <div className="flex flex-col gap-4 py-2">
                <Input
                  label={t('onboarding.step2QuestionSpending')}
                  type="number"
                  placeholder={t('onboarding.step2PlaceholderSpending')}
                  value={avgSpending}
                  onChange={(e) => setAvgSpending(e.target.value)}
                  icon={<span className="font-mono font-bold text-[#C9B58A]">{currencySymbol}</span>}
                  autoFocus
                />

                <Input
                  label={t('onboarding.step2QuestionSavings')}
                  type="number"
                  placeholder={t('onboarding.step2PlaceholderSavings')}
                  value={avgSavings}
                  onChange={(e) => setAvgSavings(e.target.value)}
                  icon={<span className="font-mono font-bold text-[#C9B58A]">{currencySymbol}</span>}
                />
              </div>
            </div>
          )}

          {/* Step 3: Payment Preference */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold text-[#F4F1EA] mb-1">
                  {t('onboarding.step3Title')}
                </h2>
                <p className="text-xs text-[#9297A1]">
                  {t('onboarding.step3Question')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-2">
                {paymentOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = paymentMethod === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setPaymentMethod(opt.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left text-xs transition-all ${
                        isSelected
                          ? 'bg-[#17191F] border-[#C9B58A] text-[#F4F1EA]'
                          : 'bg-[#111318] border-[#262932] text-[#9297A1] hover:text-[#F4F1EA] hover:border-[#363A45]'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected ? 'bg-[#C9B58A]/15 text-[#C9B58A]' : 'bg-[#17191F] text-[#9297A1]'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                      </div>
                      <span className="font-medium flex-1">{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#C9B58A] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Currency */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold text-[#F4F1EA] mb-1">
                  {t('onboarding.step4Title')}
                </h2>
                <p className="text-xs text-[#9297A1]">
                  {t('onboarding.step4QuestionCurrency')}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 py-2">
                {currencyOptions.map((opt) => {
                  const isSelected = currency === opt.code;
                  return (
                    <button
                      type="button"
                      key={opt.code}
                      onClick={() => setCurrency(opt.code)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'bg-[#17191F] border-[#C9B58A] text-[#F4F1EA]'
                          : 'bg-[#111318] border-[#262932] text-[#9297A1] hover:text-[#F4F1EA] hover:border-[#363A45]'
                      }`}
                    >
                      <span className="font-mono text-base font-bold text-[#C9B58A] mb-1">
                        {opt.symbol}
                      </span>
                      <span className="text-xs font-semibold text-[#F4F1EA]">{opt.code}</span>
                      <span className="text-[10px] text-[#9297A1] truncate mt-0.5">{opt.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-[#262932]">
            {step > 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                {t('onboarding.back')}
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                {t('onboarding.next')}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleComplete}
                loading={loading}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                {t('onboarding.finish')}
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Footer reassurance */}
      <footer className="max-w-xl w-full mx-auto text-center pt-6 text-[11px] text-[#9297A1]">
        FinTrack uses database-enforced Row Level Security. Your data remains strictly private.
      </footer>
    </div>
  );
};
