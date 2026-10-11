import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, CheckCircle2 } from 'lucide-react';
import { Input } from '../components/common/Input.js';
import { Button } from '../components/common/Button.js';
import { LanguageSelector } from '../components/common/LanguageSelector.js';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../context/LanguageContext.js';
import { useToast } from '../context/ToastContext.js';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { user, signup, resendVerificationEmail } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Verification state
  const [verificationPending, setVerificationPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (user) {
      if (user.onboarding_completed === false) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) {
      errs.fullName = 'Full name is required';
    } else if (fullName.trim().length > 100) {
      errs.fullName = 'Full name cannot exceed 100 characters';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await signup(fullName.trim(), email.trim(), password);
      if (res.success) {
        if (res.requiresVerification) {
          setVerificationPending(true);
          setResendCooldown(60);
          showToast('Verification email sent! Please check your inbox.', 'success');
        } else {
          showToast(t('common.success'), 'success');
          navigate('/onboarding', { replace: true });
        }
      } else {
        showToast(res.error || 'Failed to create account', 'error');
        setErrors({ general: res.error || 'Registration failed' });
      }
    } catch (err: any) {
      showToast(err.message || 'Signup failure', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      const res = await resendVerificationEmail(email.trim());
      if (res.success) {
        showToast('A fresh verification link has been sent to your email.', 'success');
        setResendCooldown(60);
      } else {
        showToast(res.error || 'Unable to resend email right now.', 'error');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090B] flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      {/* Top right language selector */}
      <div className="absolute top-6 right-6">
        <LanguageSelector />
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-9 h-9 rounded-lg bg-[#C9B58A] flex items-center justify-center font-bold text-[#08090B] text-base shadow-sm group-hover:scale-105 transition-transform">
            FT
          </div>
          <span className="text-xl font-bold tracking-tight text-[#F4F1EA]">FinTrack</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-[#F4F1EA]">
          {verificationPending ? 'Verify your email' : t('auth.createAccountTitle')}
        </h2>
        <p className="mt-1.5 text-xs text-[#9297A1]">
          {verificationPending ? 'Activate your FinTrack financial ledger' : t('auth.createAccountSub')}
        </p>
      </div>

      {/* Auth Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#111318] py-8 px-6 sm:px-10 border border-[#262932] rounded-2xl shadow-xl">
          {verificationPending ? (
            <div className="text-center py-2 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#7ED6A5]/10 border border-[#7ED6A5]/25 text-[#7ED6A5] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-[#F4F1EA]">Check your inbox</h3>
              <p className="text-xs text-[#9297A1] leading-relaxed">
                We sent a secure confirmation link to <strong className="text-[#F4F1EA]">{email}</strong>. Please click the link to verify your email address.
              </p>

              <div className="pt-2 space-y-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resending}
                  className="w-full text-xs"
                >
                  {resending
                    ? 'Sending...'
                    : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Verification Email'}
                </Button>

                <Link to="/login" className="block">
                  <Button variant="ghost" size="md" className="w-full text-xs text-[#9297A1]">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {errors.general && (
                <div className="mb-5 p-3 rounded-lg bg-[#D97979]/10 border border-[#D97979]/25 text-xs text-[#D97979]">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label={t('auth.fullName')}
                  type="text"
                  placeholder="Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  error={errors.fullName}
                  icon={<User className="w-4 h-4" />}
                  required
                />

                <Input
                  label={t('auth.email')}
                  type="email"
                  autoComplete="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  icon={<Mail className="w-4 h-4" />}
                  required
                />

                <div>
                  <label className="text-xs font-medium text-[#9297A1] mb-1.5 block">{t('auth.password')}</label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                    icon={<Lock className="w-4 h-4" />}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[#9297A1] hover:text-[#F4F1EA] transition-colors focus:outline-none"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    required
                  />
                </div>

                <Input
                  label={t('auth.confirmPassword')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                  icon={<Lock className="w-4 h-4" />}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={loading}
                  className="w-full mt-2 font-semibold"
                >
                  {t('auth.createAccountBtn')}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-[#262932] text-center">
                <p className="text-xs text-[#9297A1]">
                  {t('auth.haveAccount')}{' '}
                  <Link to="/login" className="text-[#C9B58A] font-medium hover:underline">
                    {t('auth.signInLink')}
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
