import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { supabase } from '../../supabaseClient';
import { CheckCircle, XCircle, Trash2, Filter, AlertTriangle, CheckCheck } from 'lucide-react';

export default function AdminListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchListings = async () => {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select(`
        *,
        profiles:user_id (full_name, username, phone)
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);

    const { data, error } = await query;
    if (!error && data) setListings(data);
    setLoading(false);
  };

  useEffect(() => { fetchListings(); }, [statusFilter]);

  const handleApprove = async (listing) => {
    setActionLoading(listing.id + '_approve');
    const { error } = await supabase
      .from('listings')
      .update({ is_approved: true, status: 'available' })
      .eq('id', listing.id);
    if (!error) {
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, is_approved: true, status: 'available' } : l));
      showToast('Listing approved!');
    } else showToast('Approve failed.', 'error');
    setActionLoading(null);
  };

  const handleReject = async (listing) => {
    setActionLoading(listing.id + '_reject');
    const { error } = await supabase
      .from('listings')
      .update({ is_approved: false, status: 'sold' })
      .eq('id', listing.id);
    if (!error) {
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, is_approved: false } : l));
      showToast('Listing rejected.');
    } else showToast('Reject failed.', 'error');
    setActionLoading(null);
  };

  const handleDelete = async (listing) => {
    if (!window.confirm('Delete this listing permanently?')) return;
    setActionLoading(listing.id + '_delete');
    const { error } = await supabase.from('listings').delete().eq('id', listing.id);
    if (!error) {
      setListings(prev => prev.filter(l => l.id !== listing.id));
      showToast('Listing deleted.');
    } else showToast('Delete failed.', 'error');
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex font-sans">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold ${toast.type === 'error' ? 'bg-red-900 text-red-200 border border-red-700' : 'bg-green-900 text-green-200 border border-green-700'}`}>
            {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCheck size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Listings Verification</h1>
            <p className="text-gray-500 text-sm mt-0.5">{listings.length} listings</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-500" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="in_transit">In Transit</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/60 border-b border-gray-800">
              <tr>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Crop</th>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Seller</th>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Quantity</th>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Price</th>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-600">Loading listings...</td></tr>
              ) : listings.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-600">No listings found</td></tr>
              ) : listings.map(l => (
                <tr key={l.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="p-4">
                    <p className="text-white font-bold">{l.crop_name}</p>
                    <p className="text-gray-500 text-xs">{l.crop_name_hindi}</p>
                    {l.voice_transcript && (
                      <p className="text-gray-600 text-[10px] mt-0.5 italic">🎙 {l.voice_transcript.substring(0, 40)}...</p>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="text-gray-300 font-medium">{l.profiles?.full_name || '—'}</p>
                    <p className="text-gray-500 text-xs">@{l.profiles?.username}</p>
                  </td>
                  <td className="p-4 text-gray-300">{l.quantity} {l.unit}</td>
                  <td className="p-4 text-green-400 font-bold">₹{l.price_per_unit}/{l.price_unit}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${l.status === 'available' ? 'bg-green-900/40 text-green-400' : l.status === 'sold' ? 'bg-red-900/40 text-red-400' : 'bg-blue-900/40 text-blue-400'}`}>
                        {l.status?.toUpperCase()}
                      </span>
                      {!l.is_approved && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/40 text-amber-400 w-fit">PENDING</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(l)}
                        disabled={actionLoading === l.id + '_approve' || l.is_approved}
                        title="Approve"
                        className="p-2 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-900/60 disabled:opacity-30 transition-colors"
                      >
                        <CheckCircle size={15} />
                      </button>
                      <button
                        onClick={() => handleReject(l)}
                        disabled={actionLoading === l.id + '_reject'}
                        title="Reject"
                        className="p-2 rounded-lg bg-amber-900/30 text-amber-400 hover:bg-amber-900/60 transition-colors"
                      >
                        <XCircle size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(l)}
                        disabled={actionLoading === l.id + '_delete'}
                        title="Delete"
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
