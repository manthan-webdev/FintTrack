import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '../components/common/Input.js';
import { Button } from '../components/common/Button.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { supabase, isLiveSupabaseAvailable } from '../services/supabase.js';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { updateUserPassword, signOut } = useAuth();
  const { showToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingSession, setValidatingSession] = useState(true);
  const [error, setError] = useState('');
  const [linkExpired, setLinkExpired] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function verifyRecoverySession() {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashClean = window.location.hash.startsWith('#')
          ? window.location.hash.substring(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hashClean);

        // 1. Check for error parameters returned from Supabase auth redirects
        const errorParam =
          searchParams.get('error') ||
          searchParams.get('error_code') ||
          hashParams.get('error') ||
          hashParams.get('error_code');
        const errorDesc =
          searchParams.get('error_description') || hashParams.get('error_description');

        if (errorParam) {
          if (mounted) {
            setLinkExpired(true);
            setError(
              errorDesc?.replace(/\+/g, ' ') ||
                'This password reset link is invalid or has expired. Please request a new recovery link.'
            );
            setValidatingSession(false);
          }
          return;
        }

        // 2. Handle PKCE code exchange if query parameter contains ?code=...
        const code = searchParams.get('code');
        if (code && isLiveSupabaseAvailable && supabase) {
          try {
            const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeErr) {
              if (mounted) {
                setLinkExpired(true);
                setError(
                  exchangeErr.message ||
                    'This recovery link is invalid or has expired. Please request a new link.'
                );
                setValidatingSession(false);
              }
              return;
            }
          } catch (err: any) {
            if (mounted) {
              setLinkExpired(true);
              setError(err?.message || 'Failed to verify recovery code.');
              setValidatingSession(false);
            }
            return;
          }
        }

        // 3. Check for active session or URL token in hash
        if (isLiveSupabaseAvailable && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          const hasHashToken =
            hashParams.has('access_token') ||
            hashParams.has('refresh_token') ||
            hashParams.get('type') === 'recovery';

          if (!session && !code && !hasHashToken) {
            // Briefly yield to allow the Supabase client to parse URL hash tokens
            await new Promise((resolve) => setTimeout(resolve, 600));
            const { data: { session: delayedSession } } = await supabase.auth.getSession();
            if (!delayedSession && mounted) {
              setLinkExpired(true);
              setError(
                'No active password reset session found. Password reset links are single-use and time-sensitive. Please request a new recovery link.'
              );
              setValidatingSession(false);
              return;
            }
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || 'Unable to verify recovery link');
        }
      } finally {
        if (mounted) {
          setValidatingSession(false);
        }
      }
    }

    verifyRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await updateUserPassword(password);
      if (res.success) {
        setSuccess(true);
        showToast('Password updated successfully! Please sign in.', 'success');
        // Clean up recovery session
        await signOut();
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      } else {
        const msg = res.error?.toLowerCase() || '';
        if (
          msg.includes('session') ||
          msg.includes('expired') ||
          msg.includes('jwt') ||
          msg.includes('token') ||
          msg.includes('not logged in') ||
          msg.includes('unauthorized')
        ) {
          setLinkExpired(true);
          setError(
            res.error ||
              'Your password recovery session has expired. Please request a fresh reset link.'
          );
        } else {
          setError(res.error || 'Failed to update password. Please request a fresh reset link.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Password update failed');
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
          Set new password
        </h2>
        <p className="mt-1.5 text-xs text-[#8E929B]">
          Choose a secure password for your FinTrack account
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#15171C] py-8 px-6 sm:px-10 border border-[#252830] rounded-xl shadow-xl">
          {validatingSession ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#C9B58A] border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-[#8E929B]">Verifying recovery link...</p>
            </div>
          ) : linkExpired ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#E98282]/10 border border-[#E98282]/25 text-[#E98282] mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#F4F1EA]">Recovery Link Expired or Invalid</h3>
              <p className="text-xs text-[#8E929B] leading-relaxed">
                {error || 'This password reset link has expired or has already been used.'}
              </p>
              <Link to="/forgot-password" className="block w-full">
                <Button variant="primary" size="md" className="w-full mt-2">
                  Request New Reset Link
                </Button>
              </Link>
              <div className="pt-2">
                <Link to="/login" className="text-xs text-[#8E929B] hover:text-[#F4F1EA] transition-colors">
                  Return to sign in
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#7ED6A5]/10 border border-[#7ED6A5]/25 text-[#7ED6A5] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#F4F1EA]">Password Updated!</h3>
              <p className="text-xs text-[#8E929B] leading-relaxed">
                Your password has been changed successfully. Redirecting you to sign in...
              </p>
              <Link to="/login" className="block w-full">
                <Button variant="secondary" size="md" className="w-full mt-2">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-[#E98282]/10 border border-[#E98282]/25 text-xs text-[#E98282]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Update Password
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-[#252830] text-center">
                <Link to="/login" className="text-xs text-[#C9B58A] hover:underline">
                  Return to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

