import { useState, useEffect } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { auth, db } from "../../firebase";
import { collection, query, where, getDocs, doc, updateDoc, orderBy, getDoc } from "firebase/firestore";

const AppointmentList = ({ gnStatus, theme }) => {
  const t = getThemeClasses(theme);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [gnDivision, setGnDivision] = useState("");

useEffect(() => {
  const fetchAppointments = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Get GN officer's division name directly by document ID
      const { getDoc } = await import("firebase/firestore");
      const officerSnap = await getDoc(doc(db, "gn_officers", user.uid));

      let divisionName = "";
      if (officerSnap.exists()) {
        divisionName = officerSnap.data().gnDivisionName || "";
        setGnDivision(divisionName);
        console.log("GN Division:", divisionName);
      }

      if (!divisionName) {
        console.log("No division name found!");
        setLoading(false);
        return;
      }

      // Fetch appointments for this GN division
      const q = query(
        collection(db, "appointments"),
        where("gnDiv", "==", divisionName),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("Appointments found:", data.length);
      setAppointments(data);

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
    await updateDoc(doc(db, "appointments", appointment.id), {
      status: "Confirmed",
    });
    setAppointments((prev) =>
      prev.map((a) => a.id === appointment.id ? { ...a, status: "Confirmed" } : a)
    );
  } catch (err) {
    console.error("Confirm error:", err);
  }
};

const handleCancel = async (id) => {
  try {
    await updateDoc(doc(db, "appointments", id), {
      status: "Cancelled",
    });
    setAppointments((prev) =>
      prev.map((a) => a.id === id ? { ...a, status: "Cancelled" } : a)
    );
  } catch (err) {
    console.error("Cancel error:", err);
  }
};

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#8B4513]">Appointment List</h1>
      </div>

     {/* Filter Bar */}
<div className={`${t.card} rounded-2xl shadow px-5 py-3 flex items-center gap-4 mb-6`}>
  {["All", "Pending", "Confirmed", "Cancelled"].map((status) => (
    <button
      key={status}
      onClick={() => setFilterStatus(status)}
      className={`text-xs font-semibold px-3 py-1 rounded-full transition
        ${filterStatus === status
          ? "bg-[#E5A800] text-black"
          : `border ${t.border} ${t.subtext}`}`}>
      {status}
    </button>
  ))}
</div>

      {/* Table */}
      <div className={`${t.card} rounded-2xl shadow overflow-hidden`}>
        <table className="w-full text-sm">
          <thead className={`${t.tableHead} uppercase text-xs`}>
            <tr>
              <th className="px-6 py-3 text-left">Time</th>
              <th className="px-6 py-3 text-left">Citizen</th>
              <th className="px-6 py-3 text-left">Service</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>

         <tbody className={t.divider}>
  {loading ? (
    <tr>
      <td colSpan={5} className="px-6 py-12 text-center">
        <p className={`text-sm ${t.subtext}`}>Loading appointments...</p>
      </td>
    </tr>
  ) : appointments.length === 0 ? (
    <tr>
      <td colSpan={5} className="px-6 py-12 text-center">
        <p className={`text-sm ${t.subtext}`}>No appointments found.</p>
      </td>
    </tr>
  ) : (
    appointments
      .filter((a) => filterStatus === "All" || a.status === filterStatus)
      .map((a) => (
        <tr key={a.id} className={t.tableRow}>
          <td className={`px-6 py-4 ${t.subtext}`}>{a.slot}</td>
          <td className="px-6 py-4">
            <p className="font-semibold text-[#8B4513]">{a.fullName}</p>
            <p className={`text-xs ${t.subtext}`}>NIC: {a.nic}</p>
          </td>
          <td className={`px-6 py-4 ${t.subtext}`}>{a.service}</td>
          <td className="px-6 py-4">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full
              ${a.status === "Confirmed" ? "bg-blue-100 text-blue-700" :
                a.status === "Cancelled" ? "bg-red-100 text-red-700" :
                a.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                "bg-gray-100 text-gray-500"}`}>
              {a.status}
            </span>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-2">
              {a.status === "Pending" && (
                <>
                  <button
                    onClick={() => handleConfirm(a)}
                    className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-lg hover:bg-green-200 transition">
                    ✓ Confirm
                  </button>
                  <button
                    onClick={() => handleCancel(a.id)}
                    className="text-xs bg-red-100 text-red-700 font-semibold px-3 py-1 rounded-lg hover:bg-red-200 transition">
                    ✕ Cancel
                  </button>
                </>
              )}
              {a.status === "Confirmed" && (
                <span className="text-xs text-green-600 font-semibold">✓ Confirmed</span>
              )}
              {a.status === "Cancelled" && (
                <span className="text-xs text-red-500 font-semibold">✕ Cancelled</span>
              )}
            </div>
          </td>
        </tr>
      ))
  )}
</tbody> 
        </table>

        {/* Pagination */}
        <div className={`px-6 py-4 flex items-center justify-between border-t ${t.border}`}>
          <p className={`text-xs ${t.subtext}`}>Showing 1-4 of 24 appointments</p>
          <div className="flex items-center gap-2">
            <button className="w-7 h-7 rounded-full bg-[#E5A800] text-black text-xs font-bold">1</button>
            <button className={`w-7 h-7 rounded-full ${t.tableRow} ${t.subtext} text-xs`}>2</button>
            <button className={`w-7 h-7 rounded-full ${t.tableRow} ${t.subtext} text-xs`}>3</button>
            <button className={`w-7 h-7 rounded-full ${t.tableRow} ${t.subtext} text-xs`}>›</button>
          </div>
        </div>

      </div>

    </GNLayout>
  );
};

export default AppointmentList;