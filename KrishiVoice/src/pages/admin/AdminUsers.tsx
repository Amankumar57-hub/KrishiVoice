import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { supabase } from '../../supabaseClient';
import { Search, UserX, UserCheck, Trash2, Shield, AlertTriangle } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleBanToggle = async (user) => {
    setActionLoading(user.id + '_ban');
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !user.is_banned })
      .eq('id', user.id);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_banned: !u.is_banned } : u));
      showToast(user.is_banned ? `${user.full_name || user.username} unbanned.` : `${user.full_name || user.username} banned.`);
    } else showToast('Action failed.', 'error');
    setActionLoading(null);
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete profile for ${user.full_name || user.username}? This cannot be undone.`)) return;
    setActionLoading(user.id + '_delete');
    const { error } = await supabase.from('profiles').delete().eq('id', user.id);
    if (!error) {
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showToast('User deleted.');
    } else showToast('Delete failed.', 'error');
    setActionLoading(null);
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-950 flex font-sans">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${toast.type === 'error' ? 'bg-red-900 text-red-200 border border-red-700' : 'bg-green-900 text-green-200 border border-green-700'}`}>
            {toast.type === 'error' ? <AlertTriangle size={16} /> : <Shield size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Users Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">{users.length} total users</p>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-green-500 w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/60 border-b border-gray-800">
              <tr>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">User</th>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Role</th>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">State</th>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Joined</th>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-600">Loading users...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-600">No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(u.full_name || u.username || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{u.full_name || '—'}</p>
                        <p className="text-gray-500 text-xs">@{u.username} · {u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${u.role === 'farmer' ? 'bg-green-900/40 text-green-400' : 'bg-blue-900/40 text-blue-400'}`}>
                      {u.role || 'farmer'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-xs">{u.state || '—'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${u.is_banned ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                      {u.is_banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBanToggle(u)}
                        disabled={actionLoading === u.id + '_ban'}
                        title={u.is_banned ? 'Unban user' : 'Ban user'}
                        className={`p-2 rounded-lg transition-colors ${u.is_banned ? 'bg-green-900/30 text-green-400 hover:bg-green-900/60' : 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/60'}`}
                      >
                        {u.is_banned ? <UserCheck size={15} /> : <UserX size={15} />}
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={actionLoading === u.id + '_delete'}
                        title="Delete user"
                        className="p-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/60 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
