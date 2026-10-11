import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertTriangle, Send } from 'lucide-react';
import { Input } from '../components/common/Input.js';
import { Button } from '../components/common/Button.js';
import { LanguageSelector } from '../components/common/LanguageSelector.js';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../context/LanguageContext.js';
import { useToast } from '../context/ToastContext.js';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, resendVerificationEmail } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Unverified account handling
  const [unverifiedState, setUnverifiedState] = useState(false);
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
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    }
  }, [user, navigate, location]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
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
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setUnverifiedState(false);
    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        showToast(t('common.success'), 'success');
        if (res.onboardingCompleted === false) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        if (res.requiresVerification) {
          setUnverifiedState(true);
          setErrors({ general: 'Email address not verified yet.' });
        } else {
          showToast(res.error || 'Invalid email or password', 'error');
          setErrors({ general: res.error || 'Invalid credentials' });
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Authentication error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending || !email.trim()) return;
    setResending(true);
    try {
      const res = await resendVerificationEmail(email.trim());
      if (res.success) {
        showToast('Confirmation email resent. Please check your inbox.', 'success');
        setResendCooldown(60);
      } else {
        showToast(res.error || 'Failed to resend confirmation email.', 'error');
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
          {t('auth.signInTitle')}
        </h2>
        <p className="mt-1.5 text-xs text-[#9297A1]">
          {t('auth.signInSub')}
        </p>
      </div>

      {/* Auth Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#111318] py-8 px-6 sm:px-10 border border-[#262932] rounded-2xl shadow-xl">
          {unverifiedState && (
            <div className="mb-5 p-4 rounded-xl bg-[#E98282]/10 border border-[#E98282]/30 text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#E98282] font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Email Verification Required</span>
              </div>
              <p className="text-[#9297A1] leading-relaxed">
                Your email <strong className="text-[#F4F1EA]">{email}</strong> has not been verified yet. Check your inbox for the activation link, or click below to receive a new one.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
                className="mt-2 text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {resending
                  ? 'Sending...'
                  : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend Verification Email'}
              </Button>
            </div>
          )}

          {!unverifiedState && errors.general && (
            <div className="mb-5 p-3 rounded-lg bg-[#D97979]/10 border border-[#D97979]/25 text-xs text-[#D97979]">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#9297A1]">{t('auth.password')}</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#C9B58A] hover:underline"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
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
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full mt-2 font-semibold"
            >
              {t('auth.signInBtn')}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#262932] text-center">
            <p className="text-xs text-[#9297A1]">
              {t('auth.noAccount')}{' '}
              <Link to="/signup" className="text-[#C9B58A] font-medium hover:underline">
                {t('auth.signUpLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
