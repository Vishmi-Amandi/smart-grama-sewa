import { useState, useEffect } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { auth, db } from "../../firebase";
import { collection, query, where, getDocs, doc, updateDoc, orderBy, getDoc } from "firebase/firestore";
import { X, User, Calendar, Clock, FileText, Phone, MapPin, Hash } from "lucide-react";

const parseSlot = (slot = "") => {
  const isoMatch = slot.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (isoMatch) return { date: isoMatch[1], slotTime: isoMatch[2] };
  return { date: "", slotTime: "" };
};

// ── Detail Modal ──────────────────────────────────────────────────────────────
const AppointmentDetailModal = ({ appointment: a, theme, onClose, onConfirm, onCancel }) => {
  const t = getThemeClasses(theme);

  if (!a) return null;

  const statusColor =
    a.status === "Confirmed" ? "bg-blue-100 text-blue-700" :
    a.status === "Cancelled" ? "bg-red-100 text-red-700" :
    a.status === "Pending"   ? "bg-yellow-100 text-yellow-700" :
    "bg-gray-100 text-gray-500";

  const Field = ({ icon, label, value }) => (
    value ? (
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex-shrink-0 ${t.subtext}`}>{icon}</span>
        <div>
          <p className={`text-[10px] uppercase font-semibold mb-0.5 ${t.subtext}`}>{label}</p>
          <p className={`text-sm font-medium ${t.text}`}>{value}</p>
        </div>
      </div>
    ) : null
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4 pointer-events-none">
      <div className={`${t.card} rounded-2xl shadow-xl w-full max-w-md pointer-events-auto`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-opacity-20"
          style={{ borderColor: theme === "dark" ? "#444" : "#e5e7eb" }}>
          <div>
            <h2 className="text-lg font-bold text-[#8B4513]">Appointment Details</h2>
            <p className={`text-xs mt-0.5 ${t.subtext}`}>#{a.id?.slice(-8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>
              {a.status}
            </span>
            <button onClick={onClose} className={`${t.subtext} hover:text-gray-600 transition`}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Citizen info */}
          <div className={`rounded-xl p-4 space-y-3 ${theme === "dark" ? "bg-gray-800" : "bg-[#fefde8]"}`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${t.subtext}`}>Citizen</p>
            <Field icon={<User size={14} />}    label="Full Name"   value={a.fullName} />
            <Field icon={<Hash size={14} />}    label="NIC"         value={a.nic} />
            <Field icon={<Phone size={14} />}   label="Phone"       value={a.phone || a.contactNo || a.mobile} />
            <Field icon={<MapPin size={14} />}  label="Address"     value={a.address} />
          </div>

          {/* Appointment info */}
          <div className={`rounded-xl p-4 space-y-3 ${theme === "dark" ? "bg-gray-800" : "bg-[#fefde8]"}`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${t.subtext}`}>Appointment</p>
            <Field icon={<FileText size={14} />} label="Service"     value={a.service} />
            <Field icon={<Calendar size={14} />} label="Date / Slot" value={a.slot} />
            <Field icon={<Clock size={14} />}    label="Booked On"
              value={a.createdAt?.toDate
                ? a.createdAt.toDate().toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" })
                : a.createdAt} />
            {a.notes && (
              <Field icon={<FileText size={14} />} label="Notes" value={a.notes} />
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className={`px-6 pb-5 flex gap-3`}>
          {a.status === "Pending" && (
            <>
              <button
                onClick={() => { onConfirm(a); onClose(); }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                ✓ Confirm
              </button>
              <button
                onClick={() => { onCancel(a.id); onClose(); }}
                className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2.5 rounded-xl transition text-sm">
                ✕ Cancel
              </button>
            </>
          )}
          {a.status !== "Pending" && (
            <button
              onClick={onClose}
              className={`flex-1 border ${t.border} ${t.subtext} font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm`}>
              Close
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const GNAppointmentList = ({ gnStatus, theme }) => {
  const t = getThemeClasses(theme);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [gnDivision, setGnDivision] = useState("");
  const [selected, setSelected] = useState(null); // appointment open in modal

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const officerSnap = await getDoc(doc(db, "gn_officers", user.uid));
        let divisionName = "";
        if (officerSnap.exists()) {
          divisionName = officerSnap.data().gnDivisionName || officerSnap.data().gnDiv || "";
          setGnDivision(divisionName);
        }
        if (!divisionName) { setLoading(false); return; }

        const q = query(
          collection(db, "appointments"),
          where("gnDiv", "==", divisionName),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const handleConfirm = async (appointment) => {
    try {
      const { date, slotTime } = parseSlot(appointment.slot || "");
      await updateDoc(doc(db, "appointments", appointment.id), {
        status: "Confirmed",
        ...(date     && { date }),
        ...(slotTime && { slotTime }),
      });
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointment.id ? { ...a, status: "Confirmed", date, slotTime } : a
        )
      );
      // Keep modal in sync if it's still open
      if (selected?.id === appointment.id)
        setSelected((s) => ({ ...s, status: "Confirmed", date, slotTime }));
    } catch (err) {
      console.error("Confirm error:", err);
    }
  };

  const handleCancel = async (id) => {
    try {
      await updateDoc(doc(db, "appointments", id), { status: "Cancelled" });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "Cancelled" } : a))
      );
      if (selected?.id === id) setSelected((s) => ({ ...s, status: "Cancelled" }));
    } catch (err) {
      console.error("Cancel error:", err);
    }
  };

  const filtered = appointments.filter(
    (a) => filterStatus === "All" || a.status === filterStatus
  );

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513]">Appointment List</h1>
      </div>

      {/* Filter bar */}
      <div className={`${t.card} rounded-2xl shadow px-3 sm:px-5 py-2.5 sm:py-3 flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6`}>
        {["All", "Pending", "Confirmed", "Cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full transition whitespace-nowrap
              ${filterStatus === status
                ? "bg-[#E5A800] text-black"
                : `border ${t.border} ${t.subtext}`}`}>
            {status}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={`${t.card} rounded-2xl shadow overflow-x-auto`}>
        <div className="min-w-[600px] md:min-w-full">
          <table className="w-full text-sm">
            <thead className={`${t.tableHead} uppercase text-xs`}>
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left">Slot</th>
                <th className="px-4 sm:px-6 py-3 text-left">Citizen</th>
                <th className="px-4 sm:px-6 py-3 text-left">Service</th>
                <th className="px-4 sm:px-6 py-3 text-left">Status</th>
                <th className="px-4 sm:px-6 py-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody className={t.divider}>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className={`text-sm ${t.subtext}`}>Loading appointments...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className={`text-sm ${t.subtext}`}>No appointments found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className={`${t.tableRow} cursor-pointer hover:bg-yellow-50 transition`}>
                    <td className={`px-4 sm:px-6 py-3 sm:py-4 ${t.subtext} text-xs sm:text-sm`}>{a.slot}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <p className="font-semibold text-[#8B4513] text-sm sm:text-base">{a.fullName}</p>
                      <p className={`text-[10px] sm:text-xs ${t.subtext}`}>NIC: {a.nic}</p>
                    </td>
                    <td className={`px-4 sm:px-6 py-3 sm:py-4 ${t.subtext} text-xs sm:text-sm`}>{a.service}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full whitespace-nowrap
                        ${a.status === "Confirmed" ? "bg-blue-100 text-blue-700" :
                          a.status === "Cancelled" ? "bg-red-100 text-red-700" :
                          a.status === "Pending"   ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-500"}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-2"
                        onClick={(e) => e.stopPropagation()} /* prevent row click when clicking buttons */
                      >
                        {a.status === "Pending" && (
                          <>
                            <button
                              onClick={() => handleConfirm(a)}
                              className="text-[10px] sm:text-xs bg-green-100 text-green-700 font-semibold px-2.5 sm:px-3 py-1 rounded-lg hover:bg-green-200 transition whitespace-nowrap">
                              ✓ Confirm
                            </button>
                            <button
                              onClick={() => handleCancel(a.id)}
                              className="text-[10px] sm:text-xs bg-red-100 text-red-700 font-semibold px-2.5 sm:px-3 py-1 rounded-lg hover:bg-red-200 transition whitespace-nowrap">
                              ✕ Cancel
                            </button>
                          </>
                        )}
                        {a.status === "Confirmed" && (
                          <span className="text-[10px] sm:text-xs text-green-600 font-semibold whitespace-nowrap">✓ Confirmed</span>
                        )}
                        {a.status === "Cancelled" && (
                          <span className="text-[10px] sm:text-xs text-red-500 font-semibold whitespace-nowrap">✕ Cancelled</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={`px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-t ${t.border}`}>
          <p className={`text-[10px] sm:text-xs ${t.subtext}`}>
            Showing {filtered.length} appointment{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <AppointmentDetailModal
          appointment={selected}
          theme={theme}
          onClose={() => setSelected(null)}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

    </GNLayout>
  );
};

export default GNAppointmentList;