import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (authError) setError(authError.message);
    } catch (err) {
      setError(err?.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check if profile exists — new Google users need to pick their role
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();
        if (profileData) {
          navigate('/');
        } else {
          navigate('/register/username');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (loginError) {
        if (loginError.message.toLowerCase().includes('email not confirmed')) {
          await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
              emailRedirectTo: window.location.origin
            }
          });
          setError('Email not confirmed. A new confirmation email has been sent to your inbox.');
        } else {
          setError(loginError.message);
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen auth-gradient-bg flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-sm glass-premium p-8 rounded-3xl shadow-2xl border border-white/20 animate-fade-in-scale">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/50 backdrop-blur-md mb-4 shadow-sm border border-white/40">
            <img src="/krishivoice-icon.png" alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">KrishiVoice</h1>
          <p className="text-primary text-[11px] font-bold mt-1.5 uppercase tracking-widest">कृषि आवाज़</p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-xl py-3 px-4 font-semibold text-gray-700 hover:bg-gray-50 transition-all hover:shadow-md mb-6"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          {t('auth.continueWithGoogle') || 'Continue with Google'}
        </button>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-gray-400 tracking-widest leading-none">
            <span className="bg-white px-3">or <span className="text-[8px] font-normal">/ या</span></span>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-500/10 backdrop-blur-sm text-red-600 text-xs px-4 py-3 rounded-xl border border-red-200/50 flex items-center gap-2 animate-pulse">
            <AlertCircle size={14} />
            <span className="font-semibold">{error}</span>
          </div>
        )}



        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-semibold text-gray-800">
              Email Address <span className="text-xs text-gray-400 font-normal">/ ईमेल पता</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary border p-3 text-sm outline-none bg-white text-gray-900 dark:bg-slate-800 dark:text-white dark:border-slate-700"
              placeholder="example@email.com"
            />
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-800">Password <span className="text-xs text-gray-400 font-normal">/ पासवर्ड</span></label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary border p-3 text-sm outline-none bg-white text-gray-900 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className={`w-full mt-6 text-white py-4 rounded-2xl font-bold transition-all shadow-lg flex flex-col items-center group relative overflow-hidden ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-sky-500 hover:-translate-y-0.5 active:translate-y-0.5'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
            <span className="relative">{loading ? 'Logging in...' : 'Login'}</span>
            <span className="relative text-[10px] font-medium opacity-80 leading-tight uppercase tracking-wide">
              लॉगिन करें
            </span>
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100/50 text-center">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
            {t('auth.noAccount')} <span className="text-gray-400 font-normal">/ {t('auth.noAccountHi')}</span>
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 text-primary font-black hover:text-sky-600 transition-colors py-2 px-6 rounded-xl bg-sky-50/50 border border-sky-100/50 hover:bg-sky-100/50">
            {t('auth.registerHere')}
            <span className="text-xs font-bold opacity-70">/ {t('auth.registerHereHi')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
