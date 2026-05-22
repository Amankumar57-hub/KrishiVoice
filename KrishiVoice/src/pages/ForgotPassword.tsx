import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      setStep('otp');
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: 'recovery'
      });
      if (error) throw error;
      setStep('password');
    } catch (err: any) {
      setError(err?.message || 'Invalid OTP. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      navigate('/'); // Go to home/dashboard since they are now logged in
    } catch (err: any) {
      setError(err?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError(null);
    setResendMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      setResendMessage('A new OTP has been sent to your email.');
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP.');
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

        {error && (
          <div className="mb-6 bg-red-500/10 backdrop-blur-sm text-red-600 text-xs px-4 py-3 rounded-xl border border-red-200/50 flex items-center gap-2 animate-pulse">
            <AlertCircle size={14} />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {resendMessage && (
          <div className="mb-6 bg-green-500/10 backdrop-blur-sm text-green-600 text-xs px-4 py-3 rounded-xl border border-green-200/50 flex items-center gap-2">
            <span className="font-semibold">{resendMessage}</span>
          </div>
        )}

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
              className={`w-full mt-6 text-white py-4 rounded-2xl font-bold transition-all shadow-lg flex flex-col items-center group relative overflow-hidden ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-sky-500 hover:-translate-y-0.5 active:translate-y-0.5'}`}
            >
              <span className="relative">{loading ? 'Sending OTP...' : 'Send OTP'}</span>
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form className="space-y-5" onSubmit={handleVerifyOtp}>
            <div>
              <label className="block text-sm font-semibold text-gray-800">
                OTP <span className="text-xs text-gray-400 font-normal">/ ओटीपी</span>
              </label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary border p-3 text-sm outline-none bg-white text-gray-900 tracking-widest font-mono text-center dark:bg-slate-800 dark:text-white dark:border-slate-700"
                placeholder="123456"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-[10px] text-gray-400">Enter the 6-digit OTP sent to your email</p>
                <button 
                  type="button" 
                  onClick={handleResendOtp} 
                  disabled={resendLoading}
                  className="text-[10px] font-bold text-primary hover:underline disabled:text-gray-400"
                >
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className={`w-full mt-6 text-white py-4 rounded-2xl font-bold transition-all shadow-lg flex flex-col items-center group relative overflow-hidden ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-sky-500 hover:-translate-y-0.5 active:translate-y-0.5'}`}
            >
              <span className="relative">{loading ? 'Verifying...' : 'Verify OTP'}</span>
            </button>
          </form>
        )}

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
                placeholder="Enter new password"
              />
            </div>
            <button
              type="submit"
              disabled={loading || password.length < 6}
              className={`w-full mt-6 text-white py-4 rounded-2xl font-bold transition-all shadow-lg flex flex-col items-center group relative overflow-hidden ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-sky-500 hover:-translate-y-0.5 active:translate-y-0.5'}`}
            >
              <span className="relative">{loading ? 'Updating...' : 'Set New Password'}</span>
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
