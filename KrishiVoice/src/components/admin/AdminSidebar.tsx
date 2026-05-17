import { Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { LayoutDashboard, Users, List, Truck, LogOut, Shield } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/1234/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', path: '/1234/admin/users', icon: Users },
  { label: 'Listings', path: '/1234/admin/listings', icon: List },
  { label: 'Transporters', path: '/1234/admin/transporters', icon: Truck },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const { adminSignOut, adminUser } = useAdminAuth();

  return (
    <div className="w-64 bg-gray-950 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-50">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-extrabold text-base tracking-tight leading-none">KrishiVoice</h2>
            <p className="text-green-400 text-[10px] font-semibold mt-0.5 uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.path || pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-green-500 text-white shadow-lg shadow-green-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <item.icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="px-4 py-5 border-t border-gray-800">
        {adminUser && (
          <p className="text-xs text-gray-500 mb-3 truncate px-1">{adminUser.email}</p>
        )}
        <button
          onClick={adminSignOut}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}
