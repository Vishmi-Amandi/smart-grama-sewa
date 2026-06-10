// Client/src/modules/admin/statisticalChanges.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';

import {
  doc, getDoc, setDoc, collection, getDocs, serverTimestamp,
} from 'firebase/firestore';

import {
  LayoutDashboard, ArrowLeftRight, BarChart2, UserCheck,
  Activity, Megaphone, Calendar, Bell, Search, ChevronDown, User,
  LogOut, Save, RefreshCw, AlertCircle, CheckCircle2, Loader2,
  Users, Shield, TrendingUp, Info, Clock, Edit3,
} from 'lucide-react';

// ─── Theme (matches dashboard) ────────────────────────────────────────────
const COLORS = {
  primary:   '#7B2D00',
  accent:    '#F5A623',
  bg:        '#F5F0E8',
  cardBrown: '#6B2400',
  cardDark:  '#3D1500',
  text:      '#2C1200',
  textMuted: '#7A5C44',
  white:     '#FFFFFF',
  border:    '#DDD0BC',
  inputBg:   '#FFF9F0',
  inputBorder: '#C8B89A',
};

// ─── Helpers ──────────────────────────────────────────────────────────────
function fmtNumber(n) {
  if (!n && n !== 0) return '—';
  return Number(n).toLocaleString();
}

function fmtDateTime(ts) {
  if (!ts) return 'Never';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Strip non-numeric except digits
function digitsOnly(val) {
  return val.replace(/[^0-9]/g, '');
}

// ─── Nav Item ─────────────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, active, bold, onClick }) {
  return (
    <li onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all ${
        active  ? 'bg-amber-700 text-white font-bold'
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
        <img src="/logo2.png" alt="Logo" />
      </div>

      <ul className="flex flex-col gap-1 flex-1">
        <NavItem icon={LayoutDashboard} label="Dashboard"
          onClick={() => navigate('/admin/dashboard')} />

        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>
          GN management
        </li>
        <NavItem icon={UserCheck}      label="Registration Requests"
          onClick={() => navigate('/admin/registrationrequestapproval')} />
        <NavItem icon={ArrowLeftRight} label="Transfer Request"
          onClick={() => navigate('/admin/transferrequestapproval')} />

        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>
          Reports
        </li>
        <NavItem icon={BarChart2} label="System reports"
          onClick={() => navigate('/admin/reports/system')} />
        <NavItem icon={User}      label="Individual user access"
          onClick={() => navigate('/admin/reports/useraccess')} />
        <NavItem icon={Activity}  label="GN activity reports"
          onClick={() => navigate('/admin/reports/gnactivity')} />

        <li className="pt-4">
          <NavItem icon={Megaphone} label="Announcements" bold
            onClick={() => navigate('/admin/announcements')} />
        </li>
        <li className="pt-4">
          <NavItem icon={Calendar} label="Appointment Calendar" bold
            onClick={() => navigate('/admin/calendar')} />
        </li>
        <li className="pt-2">
          <NavItem icon={TrendingUp} label="Statistical Changes" bold active
            onClick={() => navigate('/admin/statistical-changes')} />
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
          style={{ borderColor: COLORS.inputBorder, background: COLORS.inputBg, color: COLORS.text }}
          placeholder="search..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
        />
      </div>
      <button className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-full border"
        style={{ borderColor: COLORS.inputBorder, color: COLORS.text, background: COLORS.inputBg }}>
        English <ChevronDown size={14} />
      </button>
      <button className="relative w-10 h-10 rounded-full flex items-center justify-center border"
        style={{ borderColor: COLORS.inputBorder, background: COLORS.inputBg }}>
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

// ─── Stat Preview Card ────────────────────────────────────────────────────
// Shows a live preview of what the dashboard donut will look like
function PreviewCard({ label, current, target, color }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex items-center gap-4 rounded-xl p-4"
      style={{ background: 'rgba(255,255,255,0.55)', border: `1px solid ${COLORS.border}` }}>
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={r} fill="none" stroke="#DDD0BC" strokeWidth="10" />
        <circle cx="38" cy="38" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          strokeDashoffset={circ * 0.25}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="38" y="43" textAnchor="middle"
          fill={COLORS.text} fontSize="13" fontWeight="700" fontFamily="Georgia, serif">
          {pct}%
        </text>
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold leading-tight mb-1" style={{ color: COLORS.primary }}>
          {label}
        </p>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          {fmtNumber(current)} registered
        </p>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          out of {target > 0 ? fmtNumber(target) : '—'} target
        </p>
      </div>
    </div>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────
function StatInput({ label, description, value, onChange, icon: Icon, placeholder, error }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={15} style={{ color: COLORS.primary }} />}
        <label className="text-sm font-bold" style={{ color: COLORS.text }}>{label}</label>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: COLORS.textMuted }}>{description}</p>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(digitsOnly(e.target.value))}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
        style={{
          borderColor: error ? '#FCA5A5' : COLORS.inputBorder,
          background: COLORS.inputBg,
          color: COLORS.text,
          focusRingColor: COLORS.accent,
        }}
      />
      {error && (
        <p className="text-xs flex items-center gap-1" style={{ color: '#DC2626' }}>
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

// ─── History Row ──────────────────────────────────────────────────────────
function HistoryRow({ entry, isLatest }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0"
      style={{ borderColor: '#EDE5D8' }}>
      <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
        style={{ background: isLatest ? COLORS.accent : '#E8DDD0' }}>
        <Clock size={12} color={isLatest ? COLORS.cardDark : COLORS.textMuted} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {isLatest && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: COLORS.accent, color: COLORS.cardDark }}>
              Current
            </span>
          )}
          <p className="text-xs font-semibold" style={{ color: COLORS.text }}>
            Updated by {entry.updatedBy || 'Admin'}
          </p>
        </div>
        <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
          {fmtDateTime(entry.updatedAt)}
        </p>
        <div className="flex gap-4 mt-1.5">
          <p className="text-xs" style={{ color: COLORS.text }}>
            Population: <span className="font-semibold">{fmtNumber(entry.totalPopulation)}</span>
          </p>
          <p className="text-xs" style={{ color: COLORS.text }}>
            Working GN: <span className="font-semibold">{fmtNumber(entry.totalWorkingGnOfficers)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function AdminStatisticalChanges() {
  const navigate = useNavigate();

  const [adminName,   setAdminName]   = useState('');
  const [adminUid,    setAdminUid]    = useState('');

  // Current saved values (from Firestore)
  const [savedPopulation,    setSavedPopulation]    = useState(0);
  const [savedWorkingGn,     setSavedWorkingGn]     = useState(0);
  const [lastUpdatedAt,      setLastUpdatedAt]       = useState(null);
  const [lastUpdatedBy,      setLastUpdatedBy]       = useState('');
  const [history,            setHistory]            = useState([]);

  // Live totals from collections (read-only, for preview)
  const [totalUsers,         setTotalUsers]         = useState(0);
  const [totalGnOfficers,    setTotalGnOfficers]    = useState(0);

  // Form state (what the admin is currently typing)
  const [formPopulation,     setFormPopulation]     = useState('');
  const [formWorkingGn,      setFormWorkingGn]      = useState('');

  // UI state
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [errors,     setErrors]     = useState({});
  const [isDirty,    setIsDirty]    = useState(false);

  // ── Auth + admin name ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { navigate('/login'); return; }
      setAdminUid(user.uid);
      try {
        const snap = await getDoc(doc(db, 'gn_officers', user.uid));
        if (snap.exists()) setAdminName(snap.data().fullName || 'Admin');
        else setAdminName('Admin');
      } catch {
        setAdminName('Admin');
      }
    });
    return () => unsub();
  }, [navigate]);

  // ── Load system_stats/config + history ────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // Load current config
        const configSnap = await getDoc(doc(db, 'system_stats', 'config'));
        if (configSnap.exists()) {
          const d = configSnap.data();
          const pop = Number(d.totalPopulation) || 0;
          const gn  = Number(d.totalWorkingGnOfficers) || 0;
          setSavedPopulation(pop);
          setSavedWorkingGn(gn);
          setLastUpdatedAt(d.updatedAt || null);
          setLastUpdatedBy(d.updatedBy || '');
          setFormPopulation(pop > 0 ? String(pop) : '');
          setFormWorkingGn(gn > 0 ? String(gn) : '');
        }

        // Load change history (stored in system_stats/config_history as array, or subcollection)
        // We store history as a subcollection: system_stats/config/history/{docId}
        try {
          const histSnap = await getDocs(
            collection(db, 'system_stats', 'config', 'history')
          );
          const entries = histSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => {
              const ta = a.updatedAt?.toDate?.() ?? new Date(0);
              const tb = b.updatedAt?.toDate?.() ?? new Date(0);
              return tb - ta;
            });
          setHistory(entries);
        } catch {
          // History subcollection may not exist yet — that's fine
        }

        // Load live counts for preview
        const [usersSnap, gnSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'gn_officers')),
        ]);
        setTotalUsers(usersSnap.size);
        setTotalGnOfficers(gnSnap.size);

      } catch (err) {
        console.error('Load failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Track dirty state
  useEffect(() => {
    const popChanged = formPopulation !== (savedPopulation > 0 ? String(savedPopulation) : '');
    const gnChanged  = formWorkingGn  !== (savedWorkingGn  > 0 ? String(savedWorkingGn)  : '');
    setIsDirty(popChanged || gnChanged);
  }, [formPopulation, formWorkingGn, savedPopulation, savedWorkingGn]);

  // ── Validate ────────────────────────────────────────────────────────────
  function validate() {
    const errs = {};
    if (!formPopulation || Number(formPopulation) === 0)
      errs.population = 'Please enter a valid total population greater than 0.';
    if (!formWorkingGn || Number(formWorkingGn) === 0)
      errs.workingGn = 'Please enter a valid working GN officer count greater than 0.';
    if (Number(formWorkingGn) > Number(formPopulation))
      errs.workingGn = 'Working GN officers cannot exceed total population.';
    return errs;
  }

  // ── Save ─────────────────────────────────────────────────────────────
  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);
    setSaveStatus(null);

    const newPop = Number(formPopulation);
    const newGn  = Number(formWorkingGn);

    try {
      const now = serverTimestamp();

      // Write main config doc
      await setDoc(doc(db, 'system_stats', 'config'), {
        totalPopulation:        newPop,
        totalWorkingGnOfficers: newGn,
        updatedAt:              now,
        updatedBy:              adminName,
        updatedByUid:           adminUid,
      });

      // Write a history entry
      const histRef = doc(collection(db, 'system_stats', 'config', 'history'));
      await setDoc(histRef, {
        totalPopulation:        newPop,
        totalWorkingGnOfficers: newGn,
        updatedAt:              now,
        updatedBy:              adminName,
        updatedByUid:           adminUid,
      });

      // Update local state
      setSavedPopulation(newPop);
      setSavedWorkingGn(newGn);
      setLastUpdatedBy(adminName);

      // Prepend to history list (use JS Date since serverTimestamp is async)
      const localEntry = {
        id: histRef.id,
        totalPopulation: newPop,
        totalWorkingGnOfficers: newGn,
        updatedAt: { toDate: () => new Date() },
        updatedBy: adminName,
      };
      setHistory(prev => [localEntry, ...prev]);
      setLastUpdatedAt({ toDate: () => new Date() });

      setSaveStatus('success');
      setIsDirty(false);
      setTimeout(() => setSaveStatus(null), 4000);

    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  // ── Reset form to last saved values ───────────────────────────────────
  function handleReset() {
    setFormPopulation(savedPopulation > 0 ? String(savedPopulation) : '');
    setFormWorkingGn(savedWorkingGn > 0 ? String(savedWorkingGn) : '');
    setErrors({});
    setSaveStatus(null);
  }

  // ── Logout ─────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try { await signOut(auth); navigate('/login'); }
    catch (err) { console.error('Logout failed:', err); }
  };

  // Live preview values (use form input if valid number, else saved)
  const previewPop = Number(formPopulation) || savedPopulation;
  const previewGn  = Number(formWorkingGn)  || savedWorkingGn;

  return (
    <div className="flex min-h-screen" style={{ background: COLORS.bg, fontFamily: "'Lato', sans-serif" }}>
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 flex flex-col min-h-screen">
        <Topbar adminName={adminName} />

        <div className="flex-1 p-6 flex flex-col gap-6">

          {/* Page header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: COLORS.cardBrown }}>
              <TrendingUp size={18} color={COLORS.accent} />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif', color: COLORS.primary }}>
                Statistical Changes
              </h1>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                Set the target population and working GN officer count used in dashboard percentages
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={32} className="animate-spin" style={{ color: COLORS.accent }} />
            </div>
          ) : (
            <div className="flex gap-6 flex-wrap items-start">

              {/* ── Left column: form ──────────────────────────────────── */}
              <div className="flex flex-col gap-5 flex-1 min-w-[320px]">

                {/* Info notice */}
                <div className="flex gap-3 rounded-xl px-4 py-3 text-xs leading-relaxed"
                  style={{ background: '#FFF7E6', border: '1px solid #F5A623', color: COLORS.cardBrown }}>
                  <Info size={14} className="flex-shrink-0 mt-0.5" />
                  <span>
                    These values set the denominator for the dashboard donut charts.
                    Card 1 shows <strong>registered citizens ÷ total population</strong>.
                    Card 2 shows <strong>registered GN officers ÷ working GN positions</strong>.
                    Update these whenever the official census or staffing figures change.
                  </span>
                </div>

                {/* Form card */}
                <div className="rounded-2xl p-6 flex flex-col gap-6"
                  style={{ background: COLORS.white, border: `1px solid ${COLORS.border}` }}>

                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold flex items-center gap-2"
                      style={{ color: COLORS.primary }}>
                      <Edit3 size={15} />
                      Update target figures
                    </h2>
                    {lastUpdatedAt && (
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>
                        Last saved: {fmtDateTime(lastUpdatedAt)}
                      </p>
                    )}
                  </div>

                  <StatInput
                    label="Total Population"
                    description="The total registered population of all GN divisions in the system. Used to calculate what percentage of citizens have registered."
                    value={formPopulation}
                    onChange={setFormPopulation}
                    icon={Users}
                    placeholder="e.g. 2500000"
                    error={errors.population}
                  />

                  <StatInput
                    label="Total Working GN Officer Positions"
                    description="The total number of active Grama Niladhari officer positions across all divisions. Used to calculate what percentage of positions are filled in the system."
                    value={formWorkingGn}
                    onChange={setFormWorkingGn}
                    icon={Shield}
                    placeholder="e.g. 14000"
                    error={errors.workingGn}
                  />

                  {/* Save status */}
                  {saveStatus === 'success' && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' }}>
                      <CheckCircle2 size={14} />
                      Values saved successfully. Dashboard percentages will update on next load.
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}>
                      <AlertCircle size={14} />
                      Save failed. Check your connection and try again.
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleSave}
                      disabled={saving || !isDirty}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: COLORS.cardBrown, color: COLORS.white }}>
                      {saving
                        ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                        : <><Save size={14} /> Save changes</>
                      }
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={saving || !isDirty}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ borderColor: COLORS.inputBorder, color: COLORS.textMuted }}>
                      <RefreshCw size={14} /> Reset
                    </button>
                  </div>
                </div>

                {/* Current saved values summary */}
                <div className="rounded-2xl p-5"
                  style={{ background: COLORS.cardBrown, color: COLORS.white }}>
                  <p className="text-xs font-bold opacity-80 mb-3 uppercase tracking-wider">
                    Currently saved values
                  </p>
                  <div className="flex gap-6 flex-wrap">
                    <div>
                      <p className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                        {savedPopulation > 0 ? fmtNumber(savedPopulation) : '—'}
                      </p>
                      <p className="text-xs opacity-70 mt-0.5">Total population</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                        {savedWorkingGn > 0 ? fmtNumber(savedWorkingGn) : '—'}
                      </p>
                      <p className="text-xs opacity-70 mt-0.5">Working GN positions</p>
                    </div>
                  </div>
                  {lastUpdatedBy && (
                    <p className="text-xs opacity-50 mt-3">Last updated by {lastUpdatedBy}</p>
                  )}
                </div>
              </div>

              {/* ── Right column: live preview + history ───────────────── */}
              <div className="flex flex-col gap-5" style={{ width: '300px', minWidth: '260px' }}>

                {/* Live preview */}
                <div className="rounded-2xl p-5 flex flex-col gap-4"
                  style={{ background: COLORS.white, border: `1px solid ${COLORS.border}` }}>
                  <h2 className="text-sm font-bold flex items-center gap-2"
                    style={{ color: COLORS.primary }}>
                    <TrendingUp size={15} />
                    Dashboard preview
                  </h2>
                  <p className="text-xs -mt-2" style={{ color: COLORS.textMuted }}>
                    Updates live as you type
                  </p>

                  <PreviewCard
                    label="Registered Citizens"
                    current={totalUsers}
                    target={previewPop}
                    color={COLORS.accent}
                  />
                  <PreviewCard
                    label="Registered GN Officers"
                    current={totalGnOfficers}
                    target={previewGn}
                    color="#60a5fa"
                  />
                </div>

                {/* Change history */}
                <div className="rounded-2xl p-5 flex flex-col gap-1"
                  style={{ background: COLORS.white, border: `1px solid ${COLORS.border}` }}>
                  <h2 className="text-sm font-bold flex items-center gap-2 mb-2"
                    style={{ color: COLORS.primary }}>
                    <Clock size={15} />
                    Change history
                  </h2>

                  {history.length === 0 ? (
                    <p className="text-xs py-4 text-center" style={{ color: COLORS.textMuted }}>
                      No changes saved yet.
                    </p>
                  ) : (
                    <div className="max-h-72 overflow-y-auto pr-1">
                      {history.map((entry, i) => (
                        <HistoryRow key={entry.id} entry={entry} isLatest={i === 0} />
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

        <footer className="text-center text-xs py-4"
          style={{ background: COLORS.cardDark, color: '#C8A882' }}>
          © 2026 Smart Grama Sewa. All rights reserved.
        </footer>
      </main>
    </div>
  );
}