import { useNavigate, useLocation, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuthContext } from '../context/AuthContext';

export default function RegisterUsername() {
  const { user, profile, loading: authLoading, refreshProfile, signOut } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation() as { state: { formData?: any, method?: string } };
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Derive initial data from nav state or user session
  const [localFormData, setLocalFormData] = useState(() => {
    const fromState = location.state?.formData;
    if (fromState) return fromState;
    if (user) {
      return {
        fullName: user.user_metadata?.full_name || '',
        email: user.email || '',
        password: '',
        gender: 'male',
        dob: ''
      };
    }
    return { fullName: '', email: '', password: '', gender: 'male', dob: '' };
  });

  const method = 'email';
  const [step, setStep] = useState<'send' | 'verify' | 'info' | 'emailSent'>(user ? 'info' : 'send'); 
  const [role, setRole] = useState('farmer');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (!authLoading && profile) {
      navigate('/');
    }
  }, [authLoading, profile, navigate]);

  useEffect(() => {
    // If user is authenticated but no profile, ensure we are on the 'info' step
    // This handles both Google and pre-verified Firebase users
    if (user && !profile) {
      setStep('info');
    }
  }, [user, profile]);

  const handleSendOtpOrSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResendMessage(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: localFormData.email.trim(),
        password: localFormData.password,
        options: { 
          data: { full_name: localFormData.fullName },
          emailRedirectTo: window.location.origin
        }
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setError('An account with this email already exists. Please log in.');
      } else {
        setStep('verify');
      }
    } catch (err: any) {
      setError(err?.message || 'Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: localFormData.email.trim(),
        token: otp,
        type: 'signup',
      });

      if (verifyError) {
        setError(verifyError.message);
      } else {
        setStep('info');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError(null);
    setResendMessage(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: localFormData.email.trim(),
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) {
        setError(error.message);
      } else {
        setResendMessage('A new OTP has been sent to your email.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleFinishProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in to finish your profile.');
      return;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profileData: any = {
        id: user.id, // This is either Supabase UUID or Firebase UID
        full_name: localFormData.fullName,
        username: username,
        role: role,
        gender: localFormData.gender || 'male',
        dob: localFormData.dob || null,
        language_pref: 'hi',
        is_banned: false,
      };
      
      if (user.email) profileData.email = user.email;

      const { error: upsertError } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });
      
      if (upsertError) {
        setError(upsertError.message);
      } else {
        await refreshProfile();
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (step === 'send') return handleSendOtpOrSignUp(e);
    if (step === 'verify') return handleVerifyOtp(e);
    if (step === 'info') return handleFinishProfile(e);
  };

  return (
    <div className="min-h-screen auth-gradient-bg flex flex-col justify-center items-center px-4 pt-12 pb-32">
      <div className="w-full max-w-sm glass-premium p-8 rounded-3xl shadow-2xl border border-white/20 animate-fade-in-scale my-auto">
        <div className="mb-10 text-center">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-1">Almost Done</h1>
            <p className="text-primary text-[11px] font-bold uppercase tracking-widest mb-6">लगभग हो गया</p>
            
            <div className="w-full bg-gray-200/50 backdrop-blur-sm h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-primary h-full w-full rounded-full transition-all duration-1000 ease-out" />
            </div>
            <p className="text-[10px] uppercase font-bold text-gray-400 mt-2 tracking-tighter">Step 2 of 2 <span className="mx-1">•</span> <span className="text-primary/60">Final Touches</span></p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 backdrop-blur-sm text-red-600 text-xs px-4 py-3 rounded-xl border border-red-200/50 flex items-center gap-2 animate-pulse">
            <AlertCircle size={14} />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>

          
          {/* Role selection - always show in 'info' step */}
          {step === 'info' && (
            <div>
              <label className="block text-sm font-bold text-gray-800 text-center mb-4">
                I am a: <span className="text-[11px] font-normal text-gray-400 block mt-0.5">मैं एक हूं:</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('farmer')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center transition-all ${role === 'farmer' ? 'border-primary bg-sky-50 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <span className="text-3xl mb-1">👨🏽‍🌾</span>
                  <span className={`font-bold mt-1 ${role === 'farmer' ? 'text-primary' : 'text-gray-600'}`}>Farmer</span>
                  <span className={`text-[10px] ${role === 'farmer' ? 'text-sky-600' : 'text-gray-400'}`}>किसान</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center transition-all ${role === 'buyer' ? 'border-primary bg-sky-50 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <span className="text-3xl mb-1">🛒</span>
                  <span className={`font-bold mt-1 ${role === 'buyer' ? 'text-primary' : 'text-gray-600'}`}>Buyer</span>
                  <span className={`text-[10px] ${role === 'buyer' ? 'text-sky-600' : 'text-gray-400'}`}>खरीदार</span>
                </button>
              </div>
            </div>
          )}

          {/* Username - always show in 'info' step */}
          {step === 'info' && (
            <div>
              <label className="block text-sm font-semibold text-gray-800">
                Choose Username <span className="text-xs font-normal text-gray-400">/ उपयोगकर्ता नाम</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none p-3 pr-10 text-sm font-medium text-gray-900 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
                  placeholder="ramesh_kumar"
                />
                {username.length >= 3 && (
                  <CheckCircle className="absolute right-3 top-3 text-green-500" size={20} />
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Only lowercase letters, numbers, underscores</p>
            </div>
          )}

          {/* OTP */}
          {step === 'verify' && (
            <div>
              <label className="block text-sm font-semibold text-gray-800">
                OTP <span className="text-xs font-normal text-gray-400">/ ओटीपी</span>
              </label>
              <input
                type="text"
                required
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary p-2.5 text-sm outline-none bg-white text-gray-900 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                placeholder="123456"
                maxLength={6}
              />
              <div className="flex justify-between items-center mt-1">
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
              {resendMessage && <p className="text-[10px] text-green-600 mt-1">{resendMessage}</p>}
            </div>
          )}

          {step === 'emailSent' && (
            <div className="text-center py-4 bg-sky-50/50 rounded-2xl border border-sky-100/50 animate-pulse">
              <span className="text-3xl mb-4 block">📧</span>
              <p className="text-sm font-bold text-gray-900 mb-2">Check Your Email / ईमेल चेक करें</p>
              <p className="text-xs text-gray-600 px-4">
                We've sent a link to **{localFormData?.email || 'your email'}**. Please click it to confirm your account.
              </p>
              <p className="text-[10px] text-gray-400 mt-6 uppercase tracking-widest font-bold">Then return to login</p>
              <Link to="/login" className="inline-block mt-4 text-primary font-black hover:underline text-sm">
                Back to Login / लॉगिन पर वापस जाएं
              </Link>
            </div>
          )}

          {step !== 'emailSent' && (
            <button
              type="submit"
              disabled={loading || (step === 'verify' && otp.length !== 6) || (step === 'info' && username.length < 3)}
              className={`w-full mt-8 text-white py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 group relative overflow-hidden ${loading || (step === 'verify' && otp.length !== 6) || (step === 'info' && username.length < 3) ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-sky-500 hover:-translate-y-0.5 active:translate-y-0.5'}`}
            >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
            <span className="relative flex items-center gap-2">
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> {step === 'send' ? 'Processing...' : 'Processing...'}</>
            ) : (
              step === 'send' ? <>Sign Up <span className="text-[10px] font-normal opacity-70">/ साइन अप करें</span></> :
              step === 'verify' ? <>Verify Login <span className="text-[10px] font-normal opacity-70">/ लॉगिन सत्यापित करें</span></> :
              <>Finish Setup <span className="text-[10px] font-normal opacity-70">/ सेटअप पूरा करें</span></>
            )}
            </span>
            </button>
          )}

          {step !== 'emailSent' && (
            <button
              type="button"
              onClick={() => setStep('send')}
              className="w-full mt-2 text-primary py-2 rounded-xl font-medium text-sm hover:underline"
            >
              Back / पीछे
            </button>
          )}

          {user && (
            <div className="pt-4 border-t border-gray-100/50 mt-4 text-center">
              <button 
                type="button"
                onClick={() => signOut()}
                className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
              >
                Not you? Log Out / लॉगआउट करें
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
