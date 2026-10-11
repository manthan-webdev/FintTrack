import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, isLiveSupabaseAvailable } from '../services/supabase.js';
import { setAuthTokenGetter, api } from '../services/api.js';
import { SupportedCurrency } from '../utils/currency.js';
import { getPasswordResetRedirectUrl, getEmailConfirmRedirectUrl } from '../utils/url.js';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  currency: SupportedCurrency;
  monthly_income?: number;
  average_monthly_spending?: number;
  average_monthly_savings?: number;
  preferred_payment_method?: string;
  onboarding_completed?: boolean;
  preferred_language?: string;
  created_at?: string;
  user_metadata?: Record<string, any>;
}

export interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  sessionToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; onboardingCompleted?: boolean; requiresVerification?: boolean; unverifiedEmail?: string }>;
  signUp: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean; unverifiedEmail?: string }>;
  signOut: () => Promise<void>;
  getUser: () => Promise<UserProfile | null>;
  getSession: () => Promise<Session | null>;
  // Aliases for compatibility
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; onboardingCompleted?: boolean; requiresVerification?: boolean; unverifiedEmail?: string }>;
  signup: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean; unverifiedEmail?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_SESSION_KEY = 'fintrack_auth_session';

// Helper to generate a clean 3-part simulated JWT for offline multi-user isolation
function createLocalToken(userId: string, email: string, fullName: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: userId,
    id: userId,
    email,
    user_metadata: { full_name: fullName },
    iat: Math.floor(Date.now() / 1000),
  }));
  const signature = btoa('fintrack_local_secret_sig');
  return `${header}.${payload}.${signature}`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Configure API token provider so backend requests carry the verified JWT
  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (isLiveSupabaseAvailable && supabase) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        return currentSession?.access_token || null;
      }
      return sessionToken || localStorage.getItem('fintrack_token') || null;
    });
  }, [sessionToken]);

  // Load and sync profile for a Supabase user
  const loadSupabaseUserProfile = useCallback(async (supabaseUser: any): Promise<UserProfile> => {
    let profileData: any = null;
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .maybeSingle();

        if (!error && data) {
          profileData = data;
        }
      }
    } catch {
      // Ignored
    }

    if (!profileData) {
      try {
        profileData = await api.getProfile();
      } catch {
        // Ignored
      }
    }

    const cur = (profileData?.currency || 'INR') as SupportedCurrency;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      full_name: profileData?.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Member',
      avatar_url: profileData?.avatar_url || supabaseUser.user_metadata?.avatar_url || null,
      currency: cur,
      monthly_income: Number(profileData?.monthly_income || 0),
      average_monthly_spending: Number(profileData?.average_monthly_spending || 0),
      average_monthly_savings: Number(profileData?.average_monthly_savings || 0),
      preferred_payment_method: profileData?.preferred_payment_method || 'UPI',
      onboarding_completed: Boolean(profileData?.onboarding_completed),
      preferred_language: profileData?.preferred_language || 'en',
      created_at: supabaseUser.created_at,
      user_metadata: supabaseUser.user_metadata,
    };
  }, []);

  // Initial Auth Check & Auth State Subscription
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (isLiveSupabaseAvailable && supabase) {
          // 1. Live Supabase Auth
          const { data: { session: initialSession } } = await supabase.auth.getSession();

          if (initialSession?.user) {
            if (mounted) {
              setSession(initialSession);
              setSessionToken(initialSession.access_token);
            }
            const profile = await loadSupabaseUserProfile(initialSession.user);
            if (mounted) setUser(profile);
          } else {
            if (mounted) {
              setSession(null);
              setSessionToken(null);
              setUser(null);
            }
          }

          // Listen for Supabase auth state changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (!mounted) return;

              if (event === 'SIGNED_OUT') {
                setSession(null);
                setSessionToken(null);
                setUser(null);
                return;
              }

              if (event === 'PASSWORD_RECOVERY') {
                if (newSession) {
                  setSession(newSession);
                  setSessionToken(newSession.access_token);
                }
                return;
              }

              if (newSession?.user) {
                setSession(newSession);
                setSessionToken(newSession.access_token);
                const profile = await loadSupabaseUserProfile(newSession.user);
                if (mounted) setUser(profile);
              } else {
                setSession(null);
                setSessionToken(null);
                setUser(null);
              }
            }
          );

          return () => {
            subscription.unsubscribe();
          };
        } else {
          // 2. Local Session (offline dev mode with strictly isolated users)
          const stored = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed?.user && parsed?.token) {
                if (mounted) {
                  setUser(parsed.user);
                  setSessionToken(parsed.token);
                  setSession({
                    access_token: parsed.token,
                    refresh_token: '',
                    expires_in: 3600,
                    token_type: 'bearer',
                    user: parsed.user,
                  } as any);
                }
              }
            } catch {
              localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
            }
          }
        }
      } catch (err) {
        console.error('[FinTrack Auth] Init session error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, [loadSupabaseUserProfile]);

  // signIn Implementation
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; onboardingCompleted?: boolean; requiresVerification?: boolean; unverifiedEmail?: string }> => {
    try {
      if (isLiveSupabaseAvailable && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('email not confirmed') || msg.includes('not confirmed') || msg.includes('unverified')) {
            return {
              success: false,
              error: 'Email not confirmed. Please verify your email before logging in.',
              requiresVerification: true,
              unverifiedEmail: email.trim(),
            };
          }
          if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
            return { success: false, error: 'Invalid email or password. Please check your credentials or reset your password.' };
          }
          if (msg.includes('rate') || msg.includes('limit') || msg.includes('too many requests')) {
            return { success: false, error: 'Too many login attempts. Please wait a moment before trying again.' };
          }
          return { success: false, error: error.message };
        }

        if (data.session && data.user) {
          setSession(data.session);
          setSessionToken(data.session.access_token);

          const profile = await loadSupabaseUserProfile(data.user);
          setUser(profile);

          return {
            success: true,
            onboardingCompleted: Boolean(profile.onboarding_completed),
          };
        }
        return { success: true };
      }

      // Local / Offline auth mode with strict user data isolation
      const cleanEmail = email.trim().toLowerCase();
      const userId = `user-${btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}`;
      const cleanName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const simulatedToken = createLocalToken(userId, cleanEmail, cleanName);

      // Check if user previously saved profile in localStorage
      const userStorageKey = `fintrack_user_${userId}`;
      const savedUserStr = localStorage.getItem(userStorageKey);
      let localUser: UserProfile;

      if (savedUserStr) {
        try {
          localUser = JSON.parse(savedUserStr);
        } catch {
          localUser = {
            id: userId,
            email: cleanEmail,
            full_name: cleanName,
            currency: 'INR',
            monthly_income: 0,
            average_monthly_spending: 0,
            average_monthly_savings: 0,
            preferred_payment_method: 'UPI',
            onboarding_completed: false,
            preferred_language: 'en',
            created_at: new Date().toISOString(),
          };
        }
      } else {
        localUser = {
          id: userId,
          email: cleanEmail,
          full_name: cleanName,
          currency: 'INR',
          monthly_income: 0,
          average_monthly_spending: 0,
          average_monthly_savings: 0,
          preferred_payment_method: 'UPI',
          onboarding_completed: false,
          preferred_language: 'en',
          created_at: new Date().toISOString(),
        };
      }

      const simSession: any = {
        access_token: simulatedToken,
        refresh_token: '',
        expires_in: 3600,
        token_type: 'bearer',
        user: localUser,
      };

      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify({ user: localUser, token: simulatedToken }));
      localStorage.setItem('fintrack_token', simulatedToken);
      localStorage.setItem(userStorageKey, JSON.stringify(localUser));

      setSession(simSession);
      setSessionToken(simulatedToken);
      setUser(localUser);

      return {
        success: true,
        onboardingCompleted: Boolean(localUser.onboarding_completed),
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed' };
    }
  };

  // signUp Implementation
  const signUp = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; requiresVerification?: boolean; unverifiedEmail?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim();

      if (isLiveSupabaseAvailable && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanName,
            },
            emailRedirectTo: getEmailConfirmRedirectUrl(),
          },
        });

        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('already registered') || msg.includes('duplicate')) {
            return { success: false, error: 'An account with this email address already exists. Please log in or reset your password.' };
          }
          if (msg.includes('rate') || msg.includes('limit') || msg.includes('too many')) {
            return { success: false, error: 'Too many signup attempts. Please wait a few moments before trying again.' };
          }
          return { success: false, error: error.message };
        }

        // Check if email confirmation is required (data.user exists, but data.session is null)
        if (data.user && !data.session) {
          return {
            success: true,
            requiresVerification: true,
            unverifiedEmail: cleanEmail,
          };
        }

        if (data.user && data.session) {
          const userId = data.user.id;

          // 1. Ensure basic profile record is created in profiles table
          try {
            await supabase.from('profiles').upsert(
              {
                id: userId,
                full_name: cleanName,
                currency: 'INR',
                onboarding_completed: false,
                monthly_income: 0,
                average_monthly_spending: 0,
                average_monthly_savings: 0,
                preferred_payment_method: 'UPI',
              },
              { onConflict: 'id' }
            );
          } catch (pErr) {
            console.warn('Initial profile provision notice:', pErr);
          }

          // 2. Initialize default categories for this user (NO fake transactions or budgets)
          try {
            await supabase.from('categories').upsert(
              [
                { user_id: userId, name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#E98282' },
                { user_id: userId, name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#D4A373' },
                { user_id: userId, name: 'Transport', type: 'expense', icon: 'Car', color: '#90A4AE' },
                { user_id: userId, name: 'Bills & Utilities', type: 'expense', icon: 'FileText', color: '#E57373' },
                { user_id: userId, name: 'Entertainment', type: 'expense', icon: 'Film', color: '#BA68C8' },
                { user_id: userId, name: 'Health & Medical', type: 'expense', icon: 'Activity', color: '#4DB6AC' },
                { user_id: userId, name: 'Salary', type: 'income', icon: 'Briefcase', color: '#7ED6A5' },
                { user_id: userId, name: 'Freelance', type: 'income', icon: 'Laptop', color: '#81C784' },
                { user_id: userId, name: 'Investments', type: 'income', icon: 'DollarSign', color: '#C9B58A' },
                { user_id: userId, name: 'Other Income', type: 'income', icon: 'PlusCircle', color: '#8E929B' },
              ],
              { onConflict: 'user_id,name,type' }
            );
          } catch (cErr) {
            console.warn('Initial categories provision notice:', cErr);
          }

          setSession(data.session);
          setSessionToken(data.session.access_token);

          setUser({
            id: userId,
            email: data.user.email || cleanEmail,
            full_name: cleanName,
            currency: 'INR',
            onboarding_completed: false,
            monthly_income: 0,
            average_monthly_spending: 0,
            average_monthly_savings: 0,
            preferred_payment_method: 'UPI',
            preferred_language: 'en',
            created_at: data.user.created_at,
            user_metadata: data.user.user_metadata,
          });

          return { success: true, requiresVerification: false };
        }
        return { success: true };
      }

      // Local / Offline auth mode with strict user data isolation
      const userId = `user-${btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}`;
      const simulatedToken = createLocalToken(userId, cleanEmail, cleanName);

      const newUser: UserProfile = {
        id: userId,
        email: cleanEmail,
        full_name: cleanName,
        currency: 'INR',
        monthly_income: 0,
        average_monthly_spending: 0,
        average_monthly_savings: 0,
        preferred_payment_method: 'UPI',
        onboarding_completed: false,
        preferred_language: 'en',
        created_at: new Date().toISOString(),
      };

      const userStorageKey = `fintrack_user_${userId}`;
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify({ user: newUser, token: simulatedToken }));
      localStorage.setItem('fintrack_token', simulatedToken);
      localStorage.setItem(userStorageKey, JSON.stringify(newUser));

      const simSession: any = {
        access_token: simulatedToken,
        refresh_token: '',
        expires_in: 3600,
        token_type: 'bearer',
        user: newUser,
      };

      setSession(simSession);
      setSessionToken(simulatedToken);
      setUser(newUser);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Signup failed' };
    }
  };

  // signOut Implementation
  const signOut = async (): Promise<void> => {
    try {
      if (isLiveSupabaseAvailable && supabase) {
        await supabase.auth.signOut();
      }
    } finally {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      localStorage.removeItem('fintrack_token');
      setSession(null);
      setSessionToken(null);
      setUser(null);
    }
  };

  // getUser Implementation
  const getUser = async (): Promise<UserProfile | null> => {
    if (isLiveSupabaseAvailable && supabase) {
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (!sbUser) return null;
      return loadSupabaseUserProfile(sbUser);
    }
    return user;
  };

  // getSession Implementation
  const getSession = async (): Promise<Session | null> => {
    if (isLiveSupabaseAvailable && supabase) {
      const { data: { session: sbSession } } = await supabase.auth.getSession();
      return sbSession;
    }
    return session;
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isLiveSupabaseAvailable && supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: getPasswordResetRedirectUrl(),
        });
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('rate') || msg.includes('limit')) {
            return { success: false, error: 'Too many password reset requests. Please wait a few moments before trying again.' };
          }
          return { success: false, error: error.message };
        }
        return { success: true };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Password reset request failed' };
    }
  };

  const updateUserPassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isLiveSupabaseAvailable && supabase) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return { success: false, error: error.message };
        return { success: true };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Password update failed' };
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isLiveSupabaseAvailable && supabase) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email.trim(),
          options: {
            emailRedirectTo: getEmailConfirmRedirectUrl(),
          },
        });
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('rate') || msg.includes('limit')) {
            return {
              success: false,
              error: 'Please wait a few minutes before requesting another verification email.',
            };
          }
          return { success: false, error: error.message };
        }
        return { success: true };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to resend verification email' };
    }
  };

  const updateProfileData = async (data: Partial<UserProfile>): Promise<void> => {
    if (!user) return;

    try {
      const updated = await api.updateProfile({
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        currency: data.currency,
        monthly_income: data.monthly_income,
        average_monthly_spending: data.average_monthly_spending,
        average_monthly_savings: data.average_monthly_savings,
        preferred_payment_method: data.preferred_payment_method,
        onboarding_completed: data.onboarding_completed,
        preferred_language: data.preferred_language,
      });

      const updatedCur = (data.currency || updated?.currency || user.currency || 'INR') as SupportedCurrency;

      const newUser: UserProfile = {
        ...user,
        ...data,
        full_name: data.full_name ?? updated?.full_name ?? user.full_name,
        currency: updatedCur,
        monthly_income: data.monthly_income !== undefined ? data.monthly_income : (updated?.monthly_income !== undefined ? Number(updated.monthly_income) : user.monthly_income),
        average_monthly_spending: data.average_monthly_spending !== undefined ? data.average_monthly_spending : (updated?.average_monthly_spending !== undefined ? Number(updated.average_monthly_spending) : user.average_monthly_spending),
        average_monthly_savings: data.average_monthly_savings !== undefined ? data.average_monthly_savings : (updated?.average_monthly_savings !== undefined ? Number(updated.average_monthly_savings) : user.average_monthly_savings),
        preferred_payment_method: data.preferred_payment_method ?? updated?.preferred_payment_method ?? user.preferred_payment_method,
        onboarding_completed: data.onboarding_completed !== undefined ? data.onboarding_completed : (updated?.onboarding_completed !== undefined ? Boolean(updated.onboarding_completed) : user.onboarding_completed),
        preferred_language: data.preferred_language ?? updated?.preferred_language ?? user.preferred_language,
      };

      setUser(newUser);

      if (!isLiveSupabaseAvailable) {
        const userStorageKey = `fintrack_user_${user.id}`;
        localStorage.setItem(userStorageKey, JSON.stringify(newUser));
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify({ user: newUser, token: sessionToken }));
      }
    } catch (err: any) {
      console.warn('[FinTrack Auth] Profile update notice:', err?.message || err);
      // Still update local React state gracefully
      const updatedCur = (data.currency || user.currency || 'INR') as SupportedCurrency;
      setUser((prev) => (prev ? { ...prev, ...data, currency: updatedCur } : null));
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!user) return;
    try {
      if (isLiveSupabaseAvailable && supabase) {
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (sbUser) {
          const profile = await loadSupabaseUserProfile(sbUser);
          setUser(profile);
          return;
        }
      }

      const remote = await api.getProfile();
      if (remote) {
        const cur = (remote.currency || user.currency || 'INR') as SupportedCurrency;
        setUser((prev) => ({
          ...prev!,
          full_name: remote.full_name || prev!.full_name,
          avatar_url: remote.avatar_url,
          currency: cur,
          monthly_income: Number(remote.monthly_income || 0),
          average_monthly_spending: Number(remote.average_monthly_spending || 0),
          average_monthly_savings: Number(remote.average_monthly_savings || 0),
          preferred_payment_method: remote.preferred_payment_method || prev!.preferred_payment_method,
          onboarding_completed: Boolean(remote.onboarding_completed),
          preferred_language: remote.preferred_language || prev!.preferred_language,
        }));
      }
    } catch (err) {
      console.warn('Failed to refresh profile:', err);
    }
  };

  const value = useMemo(
    () => ({
      user,
      session,
      sessionToken,
      loading,
      signIn,
      signUp,
      signOut,
      getUser,
      getSession,
      // Aliases
      login: signIn,
      signup: signUp,
      logout: signOut,
      resetPassword,
      updateUserPassword,
      resendVerificationEmail,
      updateProfileData,
      refreshProfile,
    }),
    [user, session, sessionToken, loading, loadSupabaseUserProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

