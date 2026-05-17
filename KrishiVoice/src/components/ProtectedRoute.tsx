import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen auth-gradient-bg flex items-center justify-center p-6">
        <div className="glass-premium p-10 rounded-3xl flex flex-col items-center gap-6 animate-fade-in-scale border border-white/20">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute inset-0" />
            <div className="w-8 h-8 bg-sky-100 rounded-lg absolute inset-4 animate-pulse-amber" />
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-gray-900 leading-none">KrishiVoice</p>
            <p className="text-primary text-[10px] font-bold uppercase tracking-widest mt-1">कृषि आवाज़</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return <Navigate to="/register/username" replace />;
  }

  return children;
}
