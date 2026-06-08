import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UserCheck, ArrowLeftRight, BarChart2,
  User, Activity, Megaphone, Calendar, Bell, LogOut, Search,
  ChevronDown, CheckCircle, XCircle, Download, FileText
} from 'lucide-react';
import { db } from '../../firebase';
import {
  collection, getDocs, doc, updateDoc, addDoc, Timestamp, query, where
} from 'firebase/firestore';

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
          onClick={() => navigate('/admin/reports/useraccess')} />
        <NavItem icon={Activity} label="GN activity reports"
          onClick={() => navigate('/admin/reports/gnactivity')} />

        <li className="pt-4">
          <NavItem icon={Megaphone} label="Announcements" bold
            onClick={() => navigate('/admin/announcements')} />
        </li>
        <li className="pt-1">
          <NavItem icon={Calendar} label="Appointment Calendar" bold
            onClick={() => navigate('/admin/calendar')} />
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
  if (typeof val === 'string') return val;
  return String(val);
}

function StatusBadge({ status }) {
  const s = (status || 'pending').toLowerCase();
  const styles = {
    pending:  { bg: '#FEF3C7', color: '#92400E', label: 'Pending'  },
    approved: { bg: '#D1FAE5', color: '#02561d', label: 'Approved' },
    rejected: { bg: '#FEE2E2', color: '#811010', label: 'Rejected' },
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
          {isApprove ? 'Approve' : 'Reject'} Transfer Request?
        </h3>
        <p className="text-sm mb-2" style={{ color: COLORS.textMuted }}>
          Are you sure you want to{' '}
          <strong>{isApprove ? 'approve' : 'reject'}</strong> the transfer request for officer{' '}
          <strong>{modal.uid}</strong>?
        </p>
        {isApprove && (
          <p className="text-xs mb-6 px-2 py-2 rounded-lg"
            style={{ background: '#FEF3C7', color: '#92400E' }}>
            This will update the officer's GN division and all related fields in Firestore,
            and send a notification to the officer.
          </p>
        )}
        {!isApprove && <div className="mb-6" />}
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

// ─── Reason Modal ────────────────────────────────────────────────────────
function ReasonModal({ text, onClose }) {
  if (!text) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(44,26,14,0.45)' }}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <h3 className="text-base font-bold mb-3" style={{ color: COLORS.primary }}>
          Transfer Reason
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: COLORS.text }}>
          {text}
        </p>
        <div className="flex justify-end mt-6">
          <button onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-semibold border hover:bg-gray-50 transition-all"
            style={{ borderColor: COLORS.border, color: COLORS.textMuted }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function TransferRequestApproval() {
  const [requests,      setRequests]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [confirmModal,  setConfirmModal]  = useState(null);
  const [reasonModal,   setReasonModal]   = useState(null);
  const [toast,         setToast]         = useState(null);

  // ── Fetch transfer requests + officer fullNames ──
  useEffect(() => {
    (async () => {
      try {
        const [transferSnap, officerSnap] = await Promise.all([
          getDocs(collection(db, 'gn_change_gn_division')),
          getDocs(collection(db, 'gn_officers')),
        ]);

        // Build uid → fullName lookup from gn_officers
        const nameMap = {};
        officerSnap.docs.forEach(d => {
          const data = d.data();
          if (data.uid) nameMap[data.uid] = data.fullName || '';
        });

        setRequests(
          transferSnap.docs.map(d => ({
            _docId: d.id,
            ...d.data(),
            _fullName: nameMap[d.data().uid] || '',
          }))
        );
      } catch (e) {
        setError(e.message || 'Failed to load transfer requests.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Toast ──
  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Approve: update transfer request + gn_officer fields + send notification ──
  async function handleApprove(request) {
    const docId = request._docId;
    setActionLoading(p => ({ ...p, [docId]: 'approved' }));
    try {
      // 1. Find the gn_officer document by uid
      const officerQuery = query(
        collection(db, 'gn_officers'),
        where('uid', '==', request.uid)
      );
      const officerSnap = await getDocs(officerQuery);

      if (!officerSnap.empty) {
        const officerDoc = officerSnap.docs[0];

        // 2. Update gn_officers with new division/district details
        //    We map fromDivision→toDivision and fromDistrict→toDistrict
        //    and clear/flag officeAddress & officeMobile for the officer to update
        await updateDoc(doc(db, 'gn_officers', officerDoc.id), {
          gnDivision:             request.toDivision   || '',
          gnDivisionName:         request.toDivision   || '',
          gnDiv:                  request.toDivision   || '',
          district:               request.toDistrict   || '',
          divisionalSecretariat:  request.toDistrict   || '',
          dsDiv:                  request.toDistrict   || '',
          gnCode:                 '',   // reset; officer updates after transfer
          province:               '',   // reset; officer updates after transfer
        });

        // 3. Send notification to the GN officer
        await addDoc(collection(db, 'notifications'), {
          uid:       request.uid,
          email:     request.email || '',
          title:     'Transfer Request Approved',
          message:   'Your transfer request has been approved. Please update your office address (officeAddress) and office mobile number (officeMobile) in your profile to reflect your new posting.',
          type:      'transfer_approved',
          read:      false,
          createdAt: Timestamp.now(),
        });
      }

      // 4. Update the transfer request status
      await updateDoc(doc(db, 'gn_change_gn_division', docId), { status: 'approved' });

      setRequests(prev =>
        prev.map(r => r._docId === docId ? { ...r, status: 'approved' } : r)
      );
      showToast('Transfer request approved. Officer notified.', 'success');

    } catch (e) {
      showToast('Approval failed: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[docId]; return n; });
    }
  }

  // ── Reject: just update status ──
  async function handleReject(request) {
    const docId = request._docId;
    setActionLoading(p => ({ ...p, [docId]: 'rejected' }));
    try {
      await updateDoc(doc(db, 'gn_change_gn_division', docId), { status: 'rejected' });
      setRequests(prev =>
        prev.map(r => r._docId === docId ? { ...r, status: 'rejected' } : r)
      );
      showToast('Transfer request rejected.', 'error');
    } catch (e) {
      showToast('Rejection failed: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[docId]; return n; });
    }
  }

  // ── Handle confirm ──
  function handleConfirm() {
    const { request, action } = confirmModal;
    setConfirmModal(null);
    if (action === 'approved') handleApprove(request);
    else                       handleReject(request);
  }

  const TABLE_COLS = [
    {
      label: 'User ID',
      key: 'uid',
      render: r => (
        <span className="font-semibold" style={{ color: COLORS.primary }}>
          {r.uid || '—'}
        </span>
      ),
    },
    {
      label: 'User Name',
      key: '_fullName',
      render: r => r._fullName || '—',
    },
    {
      label: 'Requested Date',
      key: 'createdAt',
      render: r => formatDate(r.createdAt),
    },
    {
      label: 'Current District',
      key: 'fromDistrict',
      render: r => r.fromDistrict || '—',
    },
    {
      label: 'Current Division',
      key: 'fromDivision',
      render: r => r.fromDivision || '—',
    },
    {
      label: 'New District',
      key: 'toDistrict',
      render: r => (
        <span className="font-medium" style={{ color: '#065F46' }}>
          {r.toDistrict || '—'}
        </span>
      ),
    },
    {
      label: 'New Division',
      key: 'toDivision',
      render: r => (
        <span className="font-medium" style={{ color: '#065F46' }}>
          {r.toDivision || '—'}
        </span>
      ),
    },
    {
      label: 'Effective Date',
      key: 'effectiveDate',
      render: r => formatDate(r.effectiveDate),
    },
    {
      label: 'Reason',
      key: 'reason',
      render: r => r.reason ? (
        <button
          onClick={() => setReasonModal(r.reason)}
          className="px-2 py-0.5 rounded text-xs font-semibold underline underline-offset-2 transition-all hover:opacity-70"
          style={{ color: COLORS.primary }}>
          View
        </button>
      ) : '—',
    },
    {
      label: 'Email',
      key: 'email',
      render: r => (
        <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
          {r.email || '—'}
        </span>
      ),
    },
    {
      label: 'Transfer Letter',
      key: 'transferLetter',
      render: r => r.transferLetter ? (
        <a
          href={r.transferLetter}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all hover:opacity-80"
          style={{ background: '#EFF6FF', color: '#1D4ED8', width: 'fit-content' }}>
          <Download size={12} />
          Download
        </a>
      ) : (
        <span className="flex items-center gap-1 text-xs" style={{ color: COLORS.textMuted }}>
          <FileText size={12} />
          N/A
        </span>
      ),
    },
    {
      label: 'Status',
      key: 'status',
      render: r => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: COLORS.bg }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-xl"
          style={{
            background: toast.type === 'success' ? '#065F46' : '#991B1B',
            animation: 'fadeSlideIn 0.3s ease',
            maxWidth: 360,
          }}>
          {toast.msg}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        modal={confirmModal}
        onCancel={() => setConfirmModal(null)}
        onConfirm={handleConfirm}
      />

      {/* Reason Modal */}
      <ReasonModal
        text={reasonModal}
        onClose={() => setReasonModal(null)}
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
                Loading transfer requests…
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
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={TABLE_COLS.length + 1}
                          className="py-16 text-center text-sm italic"
                          style={{ color: COLORS.textMuted }}>
                          No transfer requests found.
                        </td>
                      </tr>
                    ) : (
                      requests.map((r, i) => {
                        const statusLower = (r.status || 'pending').toLowerCase();
                        const busy = !!actionLoading[r._docId];
                        return (
                          <tr key={r._docId}
                            style={{
                              background: i % 2 === 0 ? '#fff' : '#FDFAF4',
                              borderBottom: `1px solid ${COLORS.border}`,
                            }}>
                            {TABLE_COLS.map(c => (
                              <td key={c.key}
                                className="px-4 py-3 whitespace-nowrap"
                                style={{ color: COLORS.text }}>
                                {c.render(r)}
                              </td>
                            ))}
                            {/* Action buttons */}
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  disabled={busy || statusLower === 'approved'}
                                  onClick={() => setConfirmModal({
                                    request: r,
                                    uid: r.uid || r._docId,
                                    action: 'approved',
                                  })}
                                  className="px-3 py-1 rounded text-xs font-bold text-white transition-all hover:opacity-80"
                                  style={{
                                    background: statusLower === 'approved' ? '#6EE7B7' : '#065F46',
                                    cursor: busy || statusLower === 'approved' ? 'not-allowed' : 'pointer',
                                    opacity: busy || statusLower === 'approved' ? 0.65 : 1,
                                    minWidth: 62,
                                  }}>
                                  {actionLoading[r._docId] === 'approved' ? '…' : 'Approve'}
                                </button>
                                <button
                                  disabled={busy || statusLower === 'rejected' || statusLower === 'approved'}
                                  onClick={() => setConfirmModal({
                                    request: r,
                                    uid: r.uid || r._docId,
                                    action: 'rejected',
                                  })}
                                  className="px-3 py-1 rounded text-xs font-bold text-white transition-all hover:opacity-80"
                                  style={{
                                    background: statusLower === 'rejected' ? '#FCA5A5' : '#991B1B',
                                    cursor: busy || statusLower === 'rejected' || statusLower === 'approved' ? 'not-allowed' : 'pointer',
                                    opacity: busy || statusLower === 'rejected' || statusLower === 'approved' ? 0.65 : 1,
                                    minWidth: 56,
                                  }}>
                                  {actionLoading[r._docId] === 'rejected' ? '…' : 'Reject'}
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

        </main>

        {/* Footer */}
        <footer className="text-center text-xs py-4"
          style={{ background: COLORS.cardDark, color: '#C8A882' }}>
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