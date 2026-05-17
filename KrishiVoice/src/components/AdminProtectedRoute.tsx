import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminProtectedRoute({ children }) {
  const { adminUser, adminLoading } = useAdminAuth();

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600 font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return <Navigate to="/1234/admin" replace />;
  }

  return children;
}
