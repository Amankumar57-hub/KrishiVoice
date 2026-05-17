import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { supabase } from '../../supabaseClient';
import { ShieldCheck, ShieldOff, Trash2, Plus, X, CheckCheck, AlertTriangle } from 'lucide-react';

export default function AdminTransporters() {
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', region: '', state: '', phone: '', whatsapp: '', vehicle_type: '' });
  const [addLoading, setAddLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTransporters = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transporters')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setTransporters(data);
    setLoading(false);
  };

  useEffect(() => { fetchTransporters(); }, []);

  const handleVerifyToggle = async (t) => {
    setActionLoading(t.id + '_verify');
    const { error } = await supabase
      .from('transporters')
      .update({ verified: !t.verified })
      .eq('id', t.id);
    if (!error) {
      setTransporters(prev => prev.map(x => x.id === t.id ? { ...x, verified: !x.verified } : x));
      showToast(t.verified ? `${t.name} unverified.` : `${t.name} verified!`);
    } else showToast('Action failed.', 'error');
    setActionLoading(null);
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete transporter ${t.name}?`)) return;
    setActionLoading(t.id + '_delete');
    const { error } = await supabase.from('transporters').delete().eq('id', t.id);
    if (!error) {
      setTransporters(prev => prev.filter(x => x.id !== t.id));
      showToast('Transporter deleted.');
    } else showToast('Delete failed.', 'error');
    setActionLoading(null);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    const { error } = await supabase.from('transporters').insert({ ...addForm, verified: false });
    if (!error) {
      showToast('Transporter added!');
      setShowAddModal(false);
      setAddForm({ name: '', region: '', state: '', phone: '', whatsapp: '', vehicle_type: '' });
      fetchTransporters();
    } else showToast('Failed to add.', 'error');
    setAddLoading(false);
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
            <h1 className="text-2xl font-black text-white">Transporters Directory</h1>
            <p className="text-gray-500 text-sm mt-0.5">{transporters.length} transporters</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            <Plus size={16} /> Add Transporter
          </button>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/60 border-b border-gray-800">
              <tr>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Company</th>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Region / State</th>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Vehicle</th>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Phone</th>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Verified</th>
                <th className="text-left p-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-600">Loading...</td></tr>
              ) : transporters.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-600">No transporters yet. Add one!</td></tr>
              ) : transporters.map(t => (
                <tr key={t.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="p-4 text-white font-bold">{t.name}</td>
                  <td className="p-4">
                    <p className="text-gray-300">{t.region || '—'}</p>
                    <p className="text-gray-500 text-xs">{t.state || '—'}</p>
                  </td>
                  <td className="p-4 text-gray-400">{t.vehicle_type || '—'}</td>
                  <td className="p-4">
                    <p className="text-gray-300">{t.phone}</p>
                    {t.whatsapp && <p className="text-green-500 text-xs">{t.whatsapp}</p>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${t.verified ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                      {t.verified ? 'VERIFIED' : 'UNVERIFIED'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVerifyToggle(t)}
                        disabled={actionLoading === t.id + '_verify'}
                        title={t.verified ? 'Unverify' : 'Verify'}
                        className={`p-2 rounded-lg transition-colors ${t.verified ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/60' : 'bg-green-900/30 text-green-400 hover:bg-green-900/60'}`}
                      >
                        {t.verified ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        disabled={actionLoading === t.id + '_delete'}
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

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-white">Add Transporter</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                {[
                  { key: 'name', label: 'Company Name', required: true },
                  { key: 'region', label: 'Region' },
                  { key: 'state', label: 'State' },
                  { key: 'phone', label: 'Phone', required: true },
                  { key: 'whatsapp', label: 'WhatsApp' },
                  { key: 'vehicle_type', label: 'Vehicle Type' },
                ].map(({ key, label, required }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">{label}{required && ' *'}</label>
                    <input
                      type="text"
                      required={required}
                      value={addForm[key]}
                      onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500"
                    />
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={addLoading}
                  className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm mt-2 transition-colors"
                >
                  {addLoading ? 'Adding...' : 'Add Transporter'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
