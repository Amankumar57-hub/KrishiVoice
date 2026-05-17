import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { supabase } from '../../supabaseClient';
import { Users, List, Truck, UserPlus, RefreshCw, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, listings: 0, transporters: 0, todaySignups: 0 });
  const [recentListings, setRecentListings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const [usersRes, listingsRes, transportersRes, todayRes, recentL, recentU] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('listings').select('id', { count: 'exact', head: true }),
        supabase.from('transporters').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('listings').select('id, crop_name, crop_name_hindi, quantity, unit, price_per_unit, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('id, full_name, username, role, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        users: usersRes.count || 0,
        listings: listingsRes.count || 0,
        transporters: transportersRes.count || 0,
        todaySignups: todayRes.count || 0,
      });
      if (recentL.data) setRecentListings(recentL.data);
      if (recentU.data) setRecentUsers(recentU.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-black text-white mt-0.5">{loading ? '—' : value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex font-sans">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Overview</h1>
            <p className="text-gray-500 text-sm mt-0.5">Real-time platform statistics</p>
          </div>
          <button onClick={fetchStats} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Total Users" value={stats.users} color="bg-blue-600" />
          <StatCard icon={List} label="Active Listings" value={stats.listings} color="bg-green-600" />
          <StatCard icon={UserPlus} label="Today's Signups" value={stats.todaySignups} color="bg-purple-600" />
          <StatCard icon={Truck} label="Transporters" value={stats.transporters} color="bg-amber-600" />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Listings */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={16} className="text-green-400" />
              <h3 className="text-white font-bold text-sm">Recent Listings</h3>
            </div>
            {recentListings.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-6">No listings yet</p>
            ) : (
              <div className="space-y-3">
                {recentListings.map(l => (
                  <div key={l.id} className="flex justify-between items-center py-2.5 border-b border-gray-800 last:border-0">
                    <div>
                      <p className="text-white text-sm font-semibold">{l.crop_name} <span className="text-gray-500 text-xs">{l.crop_name_hindi}</span></p>
                      <p className="text-gray-500 text-xs">{l.quantity} {l.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-sm">₹{l.price_per_unit}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${l.status === 'available' ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>{l.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Users */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Users size={16} className="text-blue-400" />
              <h3 className="text-white font-bold text-sm">Recent Users</h3>
            </div>
            {recentUsers.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-6">No users yet</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map(u => (
                  <div key={u.id} className="flex justify-between items-center py-2.5 border-b border-gray-800 last:border-0">
                    <div>
                      <p className="text-white text-sm font-semibold">{u.full_name || u.username || 'Unknown'}</p>
                      <p className="text-gray-500 text-xs">@{u.username}</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${u.role === 'farmer' ? 'bg-green-900/40 text-green-400' : 'bg-blue-900/40 text-blue-400'}`}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
