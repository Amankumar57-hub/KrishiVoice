import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Shield, Loader2 } from 'lucide-react';

export default function AdminSetup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Security: Check if admin already exists. If yes, redirect to login.
  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('id')
          .limit(1);

        if (!error && data && data.length > 0) {
          // Admin already exists — don't allow setup
          navigate('/1234/admin', { replace: true });
          return;
        }
      } catch (err) {
        console.error('Admin check failed:', err);
      }
      setChecking(false);
    };
    checkAdminExists();
  }, [navigate]);

  const handleSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: 'admin' } }
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // 2. Insert into admin_users table
      const { error: adminInsertError } = await supabase
        .from('admin_users')
        .insert({ email });

      if (adminInsertError) {
        console.error('Admin insert error:', adminInsertError);
        setError('Account created but admin registration failed: ' + adminInsertError.message);
        setLoading(false);
        return;
      }

      navigate('/1234/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Setup failed. Please try again.');
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-green-500" />
          <p className="text-gray-500 text-sm">Verifying setup status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-900/40">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">First Time Setup</h1>
          <p className="text-gray-500 text-sm mt-1 text-center">Create your master admin account to manage KrishiVoice.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-4 bg-red-900/30 border border-red-800 text-red-400 text-xs p-3 rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSetup}>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@krishivoice.in"
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-green-900/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Creating Admin...</>
              ) : (
                'Create Admin Account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          This page is only available for initial setup
        </p>
      </div>
    </div>
  );
}
