import { useState, useEffect } from "react";

// Firebase SDK imports (CDN-based, injected via script tags in index.html)
// This component assumes Firebase is initialized externally and passed via props
// OR uses the firebaseConfig approach below

// ──────────────────────────────────────────────
// PASTE YOUR FIREBASE CONFIG HERE
// ──────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// ──────────────────────────────────────────────
// Lazy Firebase loader (avoids duplicate init)
// ──────────────────────────────────────────────
let _db = null;
async function getDb() {
  if (_db) return _db;
  const { initializeApp, getApps } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"
  );
  const { getFirestore, collection, getDocs, doc, updateDoc } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
  );

  const app =
    getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
  _db = { db: getFirestore(app), collection, getDocs, doc, updateDoc };
  return _db;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function formatDate(val) {
  if (!val) return "—";
  if (val?.toDate) return val.toDate().toLocaleDateString("en-GB");
  if (val instanceof Date) return val.toLocaleDateString("en-GB");
  return String(val);
}

function StatusBadge({ status }) {
  const map = {
    pending:  { bg: "#FFF3CD", color: "#856404", label: "Pending"  },
    approved: { bg: "#D1FAE5", color: "#065F46", label: "Approved" },
    rejected: { bg: "#FEE2E2", color: "#991B1B", label: "Rejected" },
  };
  const s = map[(status || "pending").toLowerCase()] || map.pending;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        letterSpacing: 0.3,
      }}
    >
      {s.label}
    </span>
  );
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────
export default function RegistrationRequestApproval() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({}); // { docId: 'approve'|'reject' }
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null); // { msg, type }
  const [confirmModal, setConfirmModal] = useState(null); // { docId, uid, name, action }

  // ── Fetch from Firestore ──
  useEffect(() => {
    (async () => {
      try {
        const { db, collection, getDocs } = await getDb();
        const snap = await getDocs(collection(db, "gn_officers"));
        const rows = snap.docs.map((d) => ({ _docId: d.id, ...d.data() }));
        setOfficers(rows);
      } catch (e) {
        setError(e.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Show toast ──
  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }

  // ── Update status ──
  async function updateStatus(docId, newStatus) {
    setActionLoading((p) => ({ ...p, [docId]: newStatus }));
    try {
      const { db, doc, updateDoc } = await getDb();
      await updateDoc(doc(db, "gn_officers", docId), { status: newStatus });
      setOfficers((prev) =>
        prev.map((o) =>
          o._docId === docId ? { ...o, status: newStatus } : o
        )
      );
      showToast(
        `Officer ${newStatus === "approved" ? "approved" : "rejected"} successfully.`,
        newStatus === "approved" ? "success" : "error"
      );
    } catch (e) {
      showToast("Update failed: " + (e.message || "Unknown error"), "error");
    } finally {
      setActionLoading((p) => {
        const n = { ...p };
        delete n[docId];
        return n;
      });
    }
  }

  // ── Filtered rows ──
  const filtered = officers.filter((o) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (o.fullName || "").toLowerCase().includes(q) ||
      (o.uid || "").toLowerCase().includes(q) ||
      (o.email || "").toLowerCase().includes(q) ||
      (o.gnDivision || "").toLowerCase().includes(q) ||
      (o.district || "").toLowerCase().includes(q)
    );
  });

  // ──────────────────────────────────────────────
  // STYLES
  // ──────────────────────────────────────────────
  const palette = {
    cream: "#F5F0E1",
    darkBrown: "#5C1A1A",
    medBrown: "#8B3A3A",
    gold: "#C8860A",
    lightGold: "#E8A020",
    white: "#FFFFFF",
    tableHead: "#7A2828",
    rowHover: "#FDF6E8",
    border: "#DDD0B3",
    textDark: "#2C1A0E",
    textMid: "#5A3E28",
    shadow: "0 4px 24px rgba(92,26,26,0.10)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: palette.cream,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        color: palette.textDark,
      }}
    >
      {/* ── Toast ── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            background: toast.type === "success" ? "#065F46" : "#991B1B",
            color: "#fff",
            padding: "12px 22px",
            borderRadius: 10,
            fontFamily: "'Trebuchet MS', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.22)",
            animation: "fadeInDown 0.3s ease",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirmModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(44,26,14,0.45)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: palette.white,
              borderRadius: 14,
              padding: "32px 36px",
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 8px 40px rgba(92,26,26,0.22)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 40,
                marginBottom: 10,
              }}
            >
              {confirmModal.action === "approved" ? "✅" : "❌"}
            </div>
            <h3
              style={{
                color: palette.darkBrown,
                margin: "0 0 8px",
                fontSize: 20,
              }}
            >
              {confirmModal.action === "approved" ? "Approve" : "Reject"} Officer?
            </h3>
            <p
              style={{
                color: palette.textMid,
                fontFamily: "'Trebuchet MS', sans-serif",
                fontSize: 14,
                marginBottom: 24,
              }}
            >
              Are you sure you want to{" "}
              <strong>
                {confirmModal.action === "approved" ? "approve" : "reject"}
              </strong>{" "}
              the registration of <strong>{confirmModal.name}</strong>?
            </p>
            <div
              style={{ display: "flex", gap: 12, justifyContent: "center" }}
            >
              <button
                onClick={() => setConfirmModal(null)}
                style={{
                  padding: "9px 22px",
                  borderRadius: 8,
                  border: `1.5px solid ${palette.border}`,
                  background: "#f5f5f5",
                  color: palette.textMid,
                  fontFamily: "'Trebuchet MS', sans-serif",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateStatus(confirmModal.docId, confirmModal.action);
                  setConfirmModal(null);
                }}
                style={{
                  padding: "9px 22px",
                  borderRadius: 8,
                  border: "none",
                  background:
                    confirmModal.action === "approved" ? "#065F46" : "#991B1B",
                  color: "#fff",
                  fontFamily: "'Trebuchet MS', sans-serif",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div
        style={{
          background: palette.white,
          borderBottom: `3px solid ${palette.darkBrown}`,
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 68,
          boxShadow: "0 2px 12px rgba(92,26,26,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${palette.darkBrown}, ${palette.medBrown})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            🌴
          </div>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: palette.darkBrown,
              letterSpacing: 0.4,
            }}
          >
            Smart Grama Sewa
          </span>
        </div>

        {/* Search */}
        <div style={{ position: "relative", width: 320 }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#aaa",
              fontSize: 16,
            }}
          >
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, UID, email…"
            style={{
              width: "100%",
              padding: "9px 14px 9px 36px",
              borderRadius: 24,
              border: `1.5px solid ${palette.border}`,
              fontFamily: "'Trebuchet MS', sans-serif",
              fontSize: 14,
              outline: "none",
              background: palette.cream,
              color: palette.textDark,
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 22 }}>🔔</span>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: palette.darkBrown,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            👤
          </div>
        </div>
      </div>

      {/* ── Layout ── */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 68px)" }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 220,
            background: palette.cream,
            borderRight: `1.5px solid ${palette.border}`,
            padding: "28px 0",
            flexShrink: 0,
          }}
        >
          {[
            { icon: "⊞", label: "Dashboard", active: false },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 22px",
                cursor: "pointer",
                borderRadius: "0 24px 24px 0",
                marginRight: 12,
                background: item.active ? `${palette.darkBrown}18` : "transparent",
                color: item.active ? palette.darkBrown : palette.textMid,
                fontWeight: item.active ? 700 : 500,
                fontFamily: "'Trebuchet MS', sans-serif",
                fontSize: 14,
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </div>
          ))}

          <div
            style={{
              padding: "10px 22px 4px",
              fontSize: 11,
              fontWeight: 700,
              color: palette.gold,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              fontFamily: "'Trebuchet MS', sans-serif",
              marginTop: 8,
            }}
          >
            GN Management
          </div>
          {["Registration Requests", "Transfer Request"].map((label) => (
            <div
              key={label}
              style={{
                padding: "9px 22px 9px 32px",
                cursor: "pointer",
                color:
                  label === "Registration Requests"
                    ? palette.darkBrown
                    : palette.textMid,
                fontWeight: label === "Registration Requests" ? 700 : 400,
                fontFamily: "'Trebuchet MS', sans-serif",
                fontSize: 13.5,
                background:
                  label === "Registration Requests"
                    ? `${palette.darkBrown}12`
                    : "transparent",
                borderLeft:
                  label === "Registration Requests"
                    ? `3px solid ${palette.darkBrown}`
                    : "3px solid transparent",
              }}
            >
              {label}
            </div>
          ))}

          <div
            style={{
              padding: "10px 22px 4px",
              fontSize: 11,
              fontWeight: 700,
              color: palette.gold,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              fontFamily: "'Trebuchet MS', sans-serif",
              marginTop: 8,
            }}
          >
            Reports
          </div>
          {["System reports", "Individual user access", "GN activity reports"].map(
            (label) => (
              <div
                key={label}
                style={{
                  padding: "9px 22px 9px 32px",
                  cursor: "pointer",
                  color: palette.textMid,
                  fontFamily: "'Trebuchet MS', sans-serif",
                  fontSize: 13.5,
                }}
              >
                {label}
              </div>
            )
          )}

          {["Announcements", "Notifications"].map((label) => (
            <div
              key={label}
              style={{
                padding: "10px 22px 4px",
                fontSize: 11,
                fontWeight: 700,
                color: palette.gold,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                fontFamily: "'Trebuchet MS', sans-serif",
                marginTop: 8,
              }}
            >
              {label}
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: "36px 32px" }}>
          <h1
            style={{
              color: palette.darkBrown,
              fontSize: 28,
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 6,
              letterSpacing: 0.5,
            }}
          >
            Registration Request Approval
          </h1>
          <hr
            style={{
              border: "none",
              borderTop: `2px solid ${palette.border}`,
              marginBottom: 28,
            }}
          />

          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            {[
              {
                label: "Total Requests",
                value: officers.length,
                icon: "📋",
                bg: "#EEF2FF",
                col: "#3730A3",
              },
              {
                label: "Pending",
                value: officers.filter(
                  (o) =>
                    !o.status || o.status.toLowerCase() === "pending"
                ).length,
                icon: "⏳",
                bg: "#FFF3CD",
                col: "#856404",
              },
              {
                label: "Approved",
                value: officers.filter(
                  (o) => o.status?.toLowerCase() === "approved"
                ).length,
                icon: "✅",
                bg: "#D1FAE5",
                col: "#065F46",
              },
              {
                label: "Rejected",
                value: officers.filter(
                  (o) => o.status?.toLowerCase() === "rejected"
                ).length,
                icon: "❌",
                bg: "#FEE2E2",
                col: "#991B1B",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: s.bg,
                  borderRadius: 12,
                  padding: "14px 22px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minWidth: 150,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <span style={{ fontSize: 26 }}>{s.icon}</span>
                <div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: s.col,
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: s.col,
                      fontFamily: "'Trebuchet MS', sans-serif",
                      opacity: 0.8,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div
            style={{
              background: palette.white,
              borderRadius: 14,
              boxShadow: palette.shadow,
              overflow: "hidden",
              border: `1.5px solid ${palette.border}`,
            }}
          >
            {loading ? (
              <div
                style={{
                  padding: "60px 0",
                  textAlign: "center",
                  color: palette.textMid,
                  fontFamily: "'Trebuchet MS', sans-serif",
                  fontSize: 16,
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
                Loading registration requests…
              </div>
            ) : error ? (
              <div
                style={{
                  padding: "60px 0",
                  textAlign: "center",
                  color: "#991B1B",
                  fontFamily: "'Trebuchet MS', sans-serif",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
                {error}
                <br />
                <small style={{ opacity: 0.7 }}>
                  Check your Firebase config at the top of the file.
                </small>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                    fontFamily: "'Trebuchet MS', sans-serif",
                  }}
                >
                  <thead>
                    <tr style={{ background: palette.tableHead }}>
                      {[
                        "User ID",
                        "User Name",
                        "Gender",
                        "GN Division",
                        "DS Division",
                        "District",
                        "Province",
                        "Contact Number",
                        "Email",
                        "Requested Date",
                        "Status",
                        "Action",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "12px 14px",
                            textAlign: "left",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 12,
                            letterSpacing: 0.5,
                            whiteSpace: "nowrap",
                            borderRight: "1px solid rgba(255,255,255,0.12)",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={12}
                          style={{
                            padding: "48px",
                            textAlign: "center",
                            color: palette.textMid,
                            fontStyle: "italic",
                          }}
                        >
                          {search
                            ? "No results match your search."
                            : "No registration requests found."}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((o, i) => {
                        const isLoading = !!actionLoading[o._docId];
                        const statusLower = (o.status || "pending").toLowerCase();
                        return (
                          <tr
                            key={o._docId}
                            style={{
                              background:
                                i % 2 === 0 ? palette.white : "#FAF6EE",
                              borderBottom: `1px solid ${palette.border}`,
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                palette.rowHover)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background =
                                i % 2 === 0 ? palette.white : "#FAF6EE")
                            }
                          >
                            {/* User ID */}
                            <td
                              style={{
                                padding: "11px 14px",
                                color: palette.medBrown,
                                fontWeight: 600,
                                maxWidth: 100,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {o.uid || o._docId || "—"}
                            </td>
                            {/* User Name */}
                            <td
                              style={{
                                padding: "11px 14px",
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {o.fullName || "—"}
                            </td>
                            {/* Gender */}
                            <td style={{ padding: "11px 14px" }}>
                              {o.gender || "—"}
                            </td>
                            {/* GN Division */}
                            <td style={{ padding: "11px 14px" }}>
                              {o.gnDivision || o.gnDivisionName || "—"}
                            </td>
                            {/* DS Division */}
                            <td style={{ padding: "11px 14px" }}>
                              {o.divisionalSecretariat || o.dsDiv || "—"}
                            </td>
                            {/* District */}
                            <td style={{ padding: "11px 14px" }}>
                              {o.district || "—"}
                            </td>
                            {/* Province */}
                            <td style={{ padding: "11px 14px" }}>
                              {o.province || "—"}
                            </td>
                            {/* Contact Number */}
                            <td
                              style={{
                                padding: "11px 14px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {o.mobile || "—"}
                            </td>
                            {/* Email */}
                            <td
                              style={{
                                padding: "11px 14px",
                                maxWidth: 160,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {o.email || "—"}
                            </td>
                            {/* Requested Date */}
                            <td
                              style={{
                                padding: "11px 14px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatDate(o.createdAt)}
                            </td>
                            {/* Status */}
                            <td style={{ padding: "11px 14px" }}>
                              <StatusBadge status={o.status} />
                            </td>
                            {/* Action */}
                            <td style={{ padding: "11px 14px" }}>
                              <div
                                style={{ display: "flex", gap: 6, alignItems: "center" }}
                              >
                                <button
                                  disabled={
                                    isLoading || statusLower === "approved"
                                  }
                                  onClick={() =>
                                    setConfirmModal({
                                      docId: o._docId,
                                      name: o.fullName || o.uid,
                                      action: "approved",
                                    })
                                  }
                                  style={{
                                    padding: "5px 13px",
                                    borderRadius: 6,
                                    border: "none",
                                    background:
                                      statusLower === "approved"
                                        ? "#A7F3D0"
                                        : "#065F46",
                                    color:
                                      statusLower === "approved"
                                        ? "#065F46"
                                        : "#fff",
                                    fontWeight: 700,
                                    fontSize: 12,
                                    cursor:
                                      isLoading || statusLower === "approved"
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity:
                                      isLoading || statusLower === "approved"
                                        ? 0.6
                                        : 1,
                                    transition: "opacity 0.15s",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {actionLoading[o._docId] === "approved"
                                    ? "…"
                                    : "Approve"}
                                </button>
                                <button
                                  disabled={
                                    isLoading || statusLower === "rejected"
                                  }
                                  onClick={() =>
                                    setConfirmModal({
                                      docId: o._docId,
                                      name: o.fullName || o.uid,
                                      action: "rejected",
                                    })
                                  }
                                  style={{
                                    padding: "5px 13px",
                                    borderRadius: 6,
                                    border: "none",
                                    background:
                                      statusLower === "rejected"
                                        ? "#FECACA"
                                        : "#991B1B",
                                    color:
                                      statusLower === "rejected"
                                        ? "#991B1B"
                                        : "#fff",
                                    fontWeight: 700,
                                    fontSize: 12,
                                    cursor:
                                      isLoading || statusLower === "rejected"
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity:
                                      isLoading || statusLower === "rejected"
                                        ? 0.6
                                        : 1,
                                    transition: "opacity 0.15s",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {actionLoading[o._docId] === "rejected"
                                    ? "…"
                                    : "Reject"}
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

          {/* Footer count */}
          {!loading && !error && (
            <p
              style={{
                marginTop: 14,
                color: palette.textMid,
                fontFamily: "'Trebuchet MS', sans-serif",
                fontSize: 13,
                textAlign: "right",
              }}
            >
              Showing{" "}
              <strong>
                {filtered.length} of {officers.length}
              </strong>{" "}
              officer{officers.length !== 1 ? "s" : ""}
            </p>
          )}
        </main>
      </div>

      {/* ── Footer ── */}
      <footer
        style={{
          background: palette.darkBrown,
          color: "#D4B896",
          textAlign: "center",
          padding: "18px",
          fontFamily: "'Trebuchet MS', sans-serif",
          fontSize: 13,
        }}
      >
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
