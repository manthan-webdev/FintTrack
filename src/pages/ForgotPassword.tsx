import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Input } from '../components/common/Input.js';
import { Button } from '../components/common/Button.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { getPasswordResetRedirectUrl } from '../utils/url.js';

export const ForgotPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your account email');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await resetPassword(email.trim());
      if (res.success) {
        setSubmitted(true);
        showToast('Password recovery instructions sent', 'success');
      } else {
        setError(res.error || 'Failed to send recovery email');
      }
    } catch (err: any) {
      setError(err?.message || 'Error processing request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090B] flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-9 h-9 rounded-lg bg-[#C9B58A] flex items-center justify-center font-bold text-[#08090B] text-base shadow-sm">
            FT
          </div>
          <span className="text-xl font-bold tracking-tight text-[#F4F1EA]">FinTrack</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-[#F4F1EA]">
          Reset your password
        </h2>
        <p className="mt-1.5 text-xs text-[#8E929B]">
          Enter your registered email and we&apos;ll send recovery instructions
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#15171C] py-8 px-6 sm:px-10 border border-[#252830] rounded-xl shadow-xl">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-[#7ED6A5]/10 border border-[#7ED6A5]/25 text-[#7ED6A5] mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#F4F1EA] mb-2">Check your email</h3>
              <p className="text-xs text-[#8E929B] leading-relaxed mb-4">
                We sent a secure password reset link to <strong className="text-[#F4F1EA]">{email}</strong>.
              </p>
              <div className="p-3 mb-6 rounded-lg bg-[#1C1F26] border border-[#252830] text-left text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#C9B58A] font-medium text-[11px]">Recovery Destination</span>
                  <span className="text-[10px] text-[#8E929B]">Route: /reset-password</span>
                </div>
                <p className="font-mono text-[11px] text-[#F4F1EA] break-all bg-[#08090B] p-2 rounded border border-[#252830]">
                  {getPasswordResetRedirectUrl()}
                </p>
                <p className="text-[11px] text-[#8E929B] leading-normal">
                  If opening on a phone, ensure this URL is added to Supabase Auth &gt; URL Configuration &gt; Redirect URLs.
                </p>
              </div>
              <Link to="/login">
                <Button variant="secondary" size="md" className="w-full">
                  Return to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-[#E98282]/10 border border-[#E98282]/25 text-xs text-[#E98282]">
                  {error}
                </div>
              )}

              <Input
                label="Registered Email"
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full mt-2 font-semibold"
              >
                Send Reset Link
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-[#252830] text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-[#8E929B] hover:text-[#F4F1EA] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
