import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminSignIn } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminSignIn(email, password);
      navigate('/1234/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-gradient-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-in-scale">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-primary/20 text-primary">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Admin Access</h1>
          <p className="text-primary text-[10px] font-bold mt-1.5 uppercase tracking-widest">KrishiVoice Control Panel</p>
        </div>

        {/* Card */}
        <div className="glass-premium p-8 rounded-3xl shadow-2xl border border-white/20">
          {error && (
            <div className="flex items-start gap-2 mb-6 bg-red-500/10 backdrop-blur-sm border border-red-200/50 text-red-600 text-xs p-3 rounded-xl animate-pulse">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@krishivoice.in"
                className="w-full bg-white/50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-primary text-white py-4 rounded-2xl font-bold transition-all shadow-lg hover:bg-sky-500 hover:-translate-y-0.5 active:translate-y-0.5 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
              <span className="relative">{loading ? 'Verifying...' : 'Login to Admin'}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-8">
          Unauthorized access is strictly prohibited
        </p>
      </div>
    </div>
  );
}
