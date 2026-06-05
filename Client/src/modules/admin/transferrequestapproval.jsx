import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UserCheck, ArrowLeftRight, BarChart2,
  User, Activity, Megaphone, Bell, LogOut, Search,
  ChevronDown, CheckCircle, XCircle
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// ─── Colors ───────────────────────────────────────────────────────────────
const COLORS = {
  bg:        '#F5F0E1',
  primary:   '#7A2828',
  accent:    '#F5A623',
  text:      '#2C1200',
  textMuted: '#7A5C44',
  border:    '#DDD0BC',
  cardBrown: '#6B2400',
  cardDark:  '#3D1500',
};

// ─── Nav Item ─────────────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, active, bold, onClick }) {
  return (
    <li onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all ${
        active ? 'bg-amber-700 text-white font-bold'
        : bold  ? 'text-amber-900 font-bold hover:bg-amber-100'
                : 'text-amber-800 hover:bg-amber-100'
      }`}
      style={{ fontSize: bold && !Icon ? '0.85rem' : '0.82rem' }}>
      {Icon && <Icon size={16} className={active ? 'text-white' : 'text-amber-700'} />}
      <span>{label}</span>
    </li>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────
function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col py-6 px-3 gap-2 border-r"
      style={{ borderColor: COLORS.border, background: COLORS.bg }}>

      <div className="flex items-center gap-2 px-3 mb-6">
        <img src="/logo2.png" alt="Smart Grama Sewa" />
      </div>

      <ul className="flex flex-col gap-1 flex-1">
        <NavItem icon={LayoutDashboard} label="Dashboard"
          onClick={() => navigate('/admin/dashboard')} />

        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>
          GN management
        </li>
        <NavItem icon={UserCheck} label="Registration Requests" 
          onClick={() => navigate('/admin/registrationrequestapproval')} />
        <NavItem icon={ArrowLeftRight} label="Transfer Request" active
          onClick={() => navigate('/admin/transferrequestapproval')} />

        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>
          Reports
        </li>
        <NavItem icon={BarChart2} label="System reports"
          onClick={() => navigate('/admin/reports/system')} />
        <NavItem icon={User} label="Individual user access"
          onClick={() => navigate('/admin/reports/user-access')} />
        <NavItem icon={Activity} label="GN activity reports"
          onClick={() => navigate('/admin/reports/gn-activity')} />

        <li className="pt-4">
          <NavItem icon={Megaphone} label="Announcements" bold
            onClick={() => navigate('/admin/announcements')} />
        </li>
      </ul>

      <div className="px-3 pt-4 border-t" style={{ borderColor: COLORS.border }}>
        <button onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-bold transition-all hover:bg-red-50"
          style={{ color: '#991B1B' }}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────
function Topbar({ adminName }) {
  const [searchVal, setSearchVal] = useState('');
  return (
    <header className="flex items-center gap-4 px-6 py-4 border-b"
      style={{ borderColor: COLORS.border, background: COLORS.bg }}>
      <div className="flex-1 relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: COLORS.textMuted }} />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm focus:outline-none"
          style={{ borderColor: '#C8B89A', background: '#FFF9F0', color: COLORS.text }}
          placeholder="search..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
        />
      </div>
      <button className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-full border"
        style={{ borderColor: '#C8B89A', color: COLORS.text, background: '#FFF9F0' }}>
        English <ChevronDown size={14} />
      </button>
      <button className="relative w-10 h-10 rounded-full flex items-center justify-center border"
        style={{ borderColor: '#C8B89A', background: '#FFF9F0' }}>
        <Bell size={18} style={{ color: COLORS.primary }} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ background: COLORS.accent }} />
      </button>
      <div className="flex items-center gap-2">
        <button className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: COLORS.primary }}>
          <User size={18} color="#fff" />
        </button>
        {adminName && (
          <span className="text-xs font-bold hidden md:block" style={{ color: COLORS.primary }}>
            {adminName}
          </span>
        )}
      </div>
    </header>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function formatDate(val) {
  if (!val) return '—';
  if (val?.toDate) return val.toDate().toLocaleDateString('en-GB');
  if (val instanceof Date) return val.toLocaleDateString('en-GB');
  return String(val);
}

function StatusBadge({ status }) {
  const s = (status || 'pending').toLowerCase();
  const styles = {
    pending:  { bg: '#FEF3C7', color: '#92400E', label: 'Pending'  },
    approved: { bg: '#D1FAE5', color: '#065F46', label: 'Approved' },
    rejected: { bg: '#FEE2E2', color: '#991B1B', label: 'Rejected' },
  };
  const st = styles[s] || styles.pending;
  return (
    <span className="px-3 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: st.bg, color: st.color }}>
      {st.label}
    </span>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────
function ConfirmModal({ modal, onConfirm, onCancel }) {
  if (!modal) return null;
  const isApprove = modal.action === 'approved';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(44,26,14,0.45)' }}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
        <div className="flex justify-center mb-3">
          {isApprove
            ? <CheckCircle size={48} style={{ color: '#065F46' }} />
            : <XCircle    size={48} style={{ color: '#991B1B' }} />}
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.primary }}>
          {isApprove ? 'Approve' : 'Reject'} Registration?
        </h3>
        <p className="text-sm mb-6" style={{ color: COLORS.textMuted }}>
          Are you sure you want to{' '}
          <strong>{isApprove ? 'approve' : 'reject'}</strong> the registration of{' '}
          <strong>{modal.name}</strong>?
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel}
            className="px-5 py-2 rounded-lg text-sm font-semibold border hover:bg-gray-50 transition-all"
            style={{ borderColor: COLORS.border, color: COLORS.textMuted }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: isApprove ? '#065F46' : '#991B1B' }}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function TransferRequestApproval() {
  const [officers,      setOfficers]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [confirmModal,  setConfirmModal]  = useState(null);
  const [toast,         setToast]         = useState(null);

  // ── Fetch ──
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'gn_officers'));
        setOfficers(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
      } catch (e) {
        setError(e.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Toast ──
  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Update status ──
  async function handleStatusUpdate(docId, newStatus) {
    setActionLoading(p => ({ ...p, [docId]: newStatus }));
    try {
      await updateDoc(doc(db, 'gn_officers', docId), { status: newStatus });
      setOfficers(prev =>
        prev.map(o => o._docId === docId ? { ...o, status: newStatus } : o)
      );
      showToast(
        `Officer ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully.`,
        newStatus === 'approved' ? 'success' : 'error'
      );
    } catch (e) {
      showToast('Update failed: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[docId]; return n; });
    }
  }

  const TABLE_COLS = [
    { label: 'User id',        key: 'uid',                   render: o => o.uid || o._docId || '—' },
    { label: 'user name',      key: 'fullName',              render: o => o.fullName || '—' },
    { label: 'gender',         key: 'gender',                render: o => o.gender || '—' },
    { label: 'gn division',    key: 'gnDivision',            render: o => o.gnDivision || o.gnDivisionName || '—' },
    { label: 'ds division',    key: 'divisionalSecretariat', render: o => o.divisionalSecretariat || o.dsDiv || '—' },
    { label: 'district',       key: 'district',              render: o => o.district || '—' },
    { label: 'province',       key: 'province',              render: o => o.province || '—' },
    { label: 'contact number', key: 'mobile',                render: o => o.mobile || '—' },
    { label: 'email',          key: 'email',                 render: o => o.email || '—' },
    { label: 'requested date', key: 'createdAt',             render: o => formatDate(o.createdAt) },
    { label: 'status',         key: 'status',                render: o => <StatusBadge status={o.status} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: COLORS.bg }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-xl"
          style={{
            background: toast.type === 'success' ? '#065F46' : '#991B1B',
            animation: 'fadeSlideIn 0.3s ease',
          }}>
          {toast.msg}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        modal={confirmModal}
        onCancel={() => setConfirmModal(null)}
        onConfirm={() => {
          handleStatusUpdate(confirmModal.docId, confirmModal.action);
          setConfirmModal(null);
        }}
      />

      {/* Sidebar */}
      <Sidebar onLogout={() => {}} />

      {/* Right side */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar adminName="" />

        <main className="flex-1 overflow-y-auto px-8 py-8">

          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-1"
            style={{ color: COLORS.cardBrown }}>
            Transfer Request Approval
          </h1>
          <hr className="mb-6" style={{ borderColor: COLORS.border }} />

          {/* Table card */}
          <div className="rounded-xl overflow-hidden border"
            style={{
              borderColor: COLORS.border,
              background: '#fff',
              boxShadow: '0 2px 16px rgba(92,26,26,0.08)',
            }}>
            {loading ? (
              <div className="py-20 text-center text-sm" style={{ color: COLORS.textMuted }}>
                <div className="text-4xl mb-3">⏳</div>
                Loading registration requests…
              </div>
            ) : error ? (
              <div className="py-20 text-center text-sm" style={{ color: '#991B1B' }}>
                <div className="text-4xl mb-3">⚠️</div>
                {error}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" style={{ fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: COLORS.cardBrown }}>
                      {TABLE_COLS.map(c => (
                        <th key={c.key}
                          className="px-4 py-3 text-left font-semibold text-white whitespace-nowrap"
                          style={{ fontSize: 12, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                          {c.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left font-semibold text-white"
                        style={{ fontSize: 12 }}>
                        action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {officers.length === 0 ? (
                      <tr>
                        <td colSpan={TABLE_COLS.length + 1}
                          className="py-16 text-center text-sm italic"
                          style={{ color: COLORS.textMuted }}>
                          No registration requests found.
                        </td>
                      </tr>
                    ) : (
                      officers.map((o, i) => {
                        const statusLower = (o.status || 'pending').toLowerCase();
                        const busy = !!actionLoading[o._docId];
                        return (
                          <tr key={o._docId}
                            style={{
                              background: i % 2 === 0 ? '#fff' : '#FDFAF4',
                              borderBottom: `1px solid ${COLORS.border}`,
                            }}>
                            {TABLE_COLS.map(c => (
                              <td key={c.key}
                                className="px-4 py-3 whitespace-nowrap"
                                style={{
                                  color: COLORS.text,
                                  maxWidth: (c.key === 'email' || c.key === 'uid') ? 140 : 'none',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}>
                                {c.render(o)}
                              </td>
                            ))}
                            {/* Action buttons */}
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  disabled={busy || statusLower === 'approved'}
                                  onClick={() => setConfirmModal({
                                    docId: o._docId,
                                    name: o.fullName || o.uid || o._docId,
                                    action: 'approved',
                                  })}
                                  className="px-3 py-1 rounded text-xs font-bold text-white transition-all hover:opacity-80"
                                  style={{
                                    background: statusLower === 'approved' ? '#6EE7B7' : '#065F46',
                                    cursor: busy || statusLower === 'approved' ? 'not-allowed' : 'pointer',
                                    opacity: busy || statusLower === 'approved' ? 0.65 : 1,
                                    minWidth: 62,
                                  }}>
                                  {actionLoading[o._docId] === 'approved' ? '…' : 'Approve'}
                                </button>
                                <button
                                  disabled={busy || statusLower === 'rejected'}
                                  onClick={() => setConfirmModal({
                                    docId: o._docId,
                                    name: o.fullName || o.uid || o._docId,
                                    action: 'rejected',
                                  })}
                                  className="px-3 py-1 rounded text-xs font-bold text-white transition-all hover:opacity-80"
                                  style={{
                                    background: statusLower === 'rejected' ? '#FCA5A5' : '#991B1B',
                                    cursor: busy || statusLower === 'rejected' ? 'not-allowed' : 'pointer',
                                    opacity: busy || statusLower === 'rejected' ? 0.65 : 1,
                                    minWidth: 56,
                                  }}>
                                  {actionLoading[o._docId] === 'rejected' ? '…' : 'Reject'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <footer className="text-center text-xs py-4"
          style={{ background: COLORS.cardDark, color: '#C8A882' }}>
          © 2026 Smart Grama Sewa. All rights reserved.
        </footer>

        </main>

        {/* Footer */}
        <footer className="py-4 text-center text-xs border-t"
          style={{ borderColor: COLORS.border, color: COLORS.textMuted, background: COLORS.bg }}>
          © 2026 Smart Grama Sewa. All rights reserved.
        </footer>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}