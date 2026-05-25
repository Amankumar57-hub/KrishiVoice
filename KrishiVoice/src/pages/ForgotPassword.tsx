import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState<'email' | 'otp' | 'password' | 'initializing'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── On mount: detect if user arrived via Supabase password-reset email link ──
  // The link looks like: /forgot-password#access_token=xxx&refresh_token=yyy&type=recovery
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.replace('#', ''));
    const type = params.get('type');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (type === 'recovery' && accessToken && refreshToken) {
      // Show a brief "initializing" state while we establish the session
      setStep('initializing');
      setError(null);

      // Establish the authenticated session from the recovery tokens
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error: sessionError }) => {
          if (sessionError) {
            setError('Your reset link has expired or is invalid. Please request a new one.');
            setStep('email');
          } else {
            // Clean the URL hash so the tokens aren't visible
            window.history.replaceState(null, '', window.location.pathname);
            setStep('password');
          }
        })
        .catch(() => {
          setError('Failed to verify reset link. Please request a new one.');
          setStep('email');
        });
    }
  }, []);

  // ── Step 1: Send reset email ──
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/forgot-password`,
      });
      if (error) throw error;
      setStep('otp');
    } catch (err: any) {
      const msg: string = err?.message || '';
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('sending limit')) {
        setError(
          'Email sending limit reached (Supabase free-tier). Please wait ~1 hour and try again, or ask admin to configure a custom SMTP provider.'
        );
      } else {
        setError(msg || 'Failed to send reset email.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 (OTP path): Verify token emailed as a 6-digit OTP ──
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: 'recovery',
      });
      if (error) throw error;
      setStep('password');
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired OTP. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Update password ──
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) return;

    setLoading(true);
    setError(null);

    try {
      // Verify we still have a valid session before trying to update
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session expired. Please request a new password reset link.');
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setLoading(false);
      setSuccessMessage('✅ Password updated successfully! Redirecting to login...');
      setPassword('');

      // Sign out cleanly then redirect
      supabase.auth.signOut().catch(() => {});
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      console.error('Password update error:', err);
      setError(err?.message || 'Failed to update password. Please try again.');
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/forgot-password`,
      });
      if (error) throw error;
      setSuccessMessage('A new reset email has been sent.');
    } catch (err: any) {
      setError(err?.message || 'Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-gradient-bg flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-sm glass-premium p-8 rounded-3xl shadow-2xl border border-white/20 animate-fade-in-scale">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Forgot Password</h1>
          <p className="text-primary text-[11px] font-bold mt-1.5 uppercase tracking-widest">पासवर्ड भूल गए</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-500/10 backdrop-blur-sm text-red-600 text-xs px-4 py-3 rounded-xl border border-red-200/50 flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-6 bg-green-500/10 backdrop-blur-sm text-green-600 text-xs px-4 py-3 rounded-xl border border-green-200/50 flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* ── Initializing (detecting recovery token from URL) ── */}
        {step === 'initializing' && (
          <div className="flex flex-col items-center gap-3 py-8 text-gray-500">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm font-semibold">Verifying reset link…</p>
            <p className="text-xs text-gray-400">Please wait a moment</p>
          </div>
        )}

        {/* ── Step 1: Enter email ── */}
        {step === 'email' && (
          <form className="space-y-5" onSubmit={handleSendOtp}>
            <div>
              <label className="block text-sm font-semibold text-gray-800">
                Email Address <span className="text-xs text-gray-400 font-normal">/ ईमेल</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary border p-3 text-sm outline-none bg-white text-gray-900 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                placeholder="Enter your registered email"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className={`w-full mt-6 text-white py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 relative overflow-hidden ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-sky-500 hover:-translate-y-0.5 active:translate-y-0.5'
              }`}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{loading ? 'Sending…' : 'Send Reset Link'}</span>
            </button>
          </form>
        )}

        {/* ── Step 2: Enter OTP ── */}
        {step === 'otp' && (
          <form className="space-y-5" onSubmit={handleVerifyOtp}>
            <p className="text-xs text-gray-500 text-center bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
              📬 Check <strong>{email}</strong> for a reset link or 6-digit OTP.
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-800">
                OTP Code <span className="text-xs text-gray-400 font-normal">/ ओटीपी</span>
              </label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                inputMode="numeric"
                className="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary border p-3 text-sm outline-none bg-white text-gray-900 tracking-[0.5em] font-mono text-center dark:bg-slate-800 dark:text-white dark:border-slate-700"
                placeholder="123456"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-[10px] text-gray-400">6-digit code from your email</p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className="text-[10px] font-bold text-primary hover:underline disabled:text-gray-400"
                >
                  {resendLoading ? 'Sending…' : 'Resend'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className={`w-full mt-6 text-white py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 relative overflow-hidden ${
                loading || otp.length < 6 ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-sky-500 hover:-translate-y-0.5 active:translate-y-0.5'
              }`}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{loading ? 'Verifying…' : 'Verify OTP'}</span>
            </button>
          </form>
        )}

        {/* ── Step 3: Set new password ── */}
        {step === 'password' && (
          <form className="space-y-5" onSubmit={handleUpdatePassword}>
            <div>
              <label className="block text-sm font-semibold text-gray-800">
                New Password <span className="text-xs text-gray-400 font-normal">/ नया पासवर्ड</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary border p-3 text-sm outline-none bg-white text-gray-900 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                placeholder="Min. 6 characters"
              />
              {password.length > 0 && password.length < 6 && (
                <p className="text-[10px] text-red-500 mt-1">Password must be at least 6 characters.</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || password.length < 6}
              className={`w-full mt-6 text-white py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 relative overflow-hidden ${
                loading || password.length < 6 ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-sky-500 hover:-translate-y-0.5 active:translate-y-0.5'
              }`}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{loading ? 'Updating…' : 'Set New Password'}</span>
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100/50 text-center">
          <Link to="/login" className="text-xs font-bold text-gray-500 hover:text-primary transition-colors">
            Back to Login <span className="font-normal">/ पीछे</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
