import { useState } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Plus, X } from "lucide-react";

const typeStyles = {
  appointment: "bg-[#F5DEB3] border-l-4 border-[#8B4513] text-[#8B4513]",
  field: "bg-green-100 border-l-4 border-green-600 text-green-800",
  meeting: "bg-blue-100 border-l-4 border-blue-500 text-blue-800",
  active: "bg-[#E5A800] border-l-4 border-yellow-600 text-black",
  admin: "bg-orange-100 border-l-4 border-orange-500 text-orange-800",
};

const typeLabels = {
  appointment: "Official Appointment",
  field: "Field Visit",
  meeting: "Meeting",
  active: "Active",
  admin: "Admin Work",
};

const times = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM",
];

const getWeekDays = (startDate) => {
  const days = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push({
      day: date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
      date: date.getDate(),
      full: date.toDateString(),
    });
  }
  return days;
};

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
};

const Schedule = ({ gnStatus, theme }) => {
  const t = getThemeClasses(theme);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [events, setEvents] = useState({
    [`09:00 AM-MON`]: { type: "appointment", label: "APPOINTMENT", title: "Land Permit Issue", sub: "Kamil Perera" },
    [`09:30 AM-TUE`]: { type: "field", label: "FIELD VISIT", title: "Address Proof", sub: "Nimal Silva" },
    [`10:00 AM-WED`]: { type: "meeting", label: "MEETING", title: "AG Office Meeting", sub: "" },
    [`11:00 AM-THU`]: { type: "admin", label: "ADMIN TASK", title: "Weekly Reporting", sub: "" },
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ title: "", sub: "", type: "appointment" });
  const [editKey, setEditKey] = useState(null);

  const days = getWeekDays(weekStart);
  const today = new Date().toDateString();

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };
  const currentWeek = () => setWeekStart(getMonday(new Date()));

  const openModal = (time, day) => {
    setSelectedSlot({ time, day });
    setForm({ title: "", sub: "", type: "appointment" });
    setEditKey(null);
    setShowModal(true);
  };

  const openEditModal = (time, day, key) => {
    const event = events[key];
    setSelectedSlot({ time, day });
    setForm({ title: event.title, sub: event.sub, type: event.type });
    setEditKey(key);
    setShowModal(true);
  };

  const saveSlot = () => {
    if (!form.title) return;
    const key = `${selectedSlot.time}-${selectedSlot.day}`;
    setEvents((prev) => {
      const updated = { ...prev };
      if (editKey && editKey !== key) delete updated[editKey];
      updated[key] = {
        type: form.type,
        label: typeLabels[form.type].toUpperCase(),
        title: form.title,
        sub: form.sub,
      };
      return updated;
    });
    setEditKey(null);
    setShowModal(false);
  };

  const deleteEvent = (key) => {
    setEvents((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#8B4513]">Schedule</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className={`${t.subtext} hover:text-gray-600 px-2`}>‹</button>
            <button onClick={prevWeek} className={`text-sm ${t.subtext} hover:bg-gray-100 px-3 py-1 rounded-lg`}>Previous week</button>
            <button onClick={currentWeek} className="text-sm bg-[#E5A800] text-black font-semibold px-3 py-1 rounded-lg">Current week</button>
            <button onClick={nextWeek} className={`text-sm ${t.subtext} hover:bg-gray-100 px-3 py-1 rounded-lg`}>Next week</button>
            <button onClick={nextWeek} className={`${t.subtext} hover:text-gray-600 px-2`}>›</button>
          </div>
          <button
            onClick={() => openModal(times[0], days[0].day)}
            className="bg-[#3B1F0A] text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#2a1506] transition">
            <Plus size={16} />
            Add Slot
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`${t.card} rounded-2xl shadow overflow-auto`}>
        <table className="w-full text-sm">

          {/* Day Headers */}
          <thead className={`sticky top-0 ${t.card} z-10 border-b ${t.border}`}>
            <tr>
              <th className={`px-4 py-3 text-left text-xs uppercase w-24 ${t.subtext}`}>Time</th>
              {days.map((d) => (
                <th key={d.day} className="px-2 py-3 text-center min-w-32">
                  <p className={`text-xs ${t.subtext}`}>{d.day}</p>
                  <p className={`text-lg font-bold ${d.full === today ? "text-[#E5A800]" : t.text}`}>
                    {d.date}
                  </p>
                  {d.full === today && (
                    <span className="text-xs bg-[#E5A800] text-black px-2 py-0.5 rounded-full">TODAY</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* Time Rows */}
          <tbody className={t.divider}>
            {times.map((time) => (
              <tr key={time}>
                <td className={`px-4 py-2 text-xs whitespace-nowrap align-top pt-3 ${t.subtext}`}>{time}</td>
                {days.map((d) => {
                  const key = `${time}-${d.day}`;
                  const event = events[key];
                  return (
                    <td
                      key={d.day}
                      className={`px-2 py-1 align-top cursor-pointer ${t.tableRow} transition`}
                      onClick={() => !event && openModal(time, d.day)}
                    >
                      {event ? (
                        <div
                          onClick={(e) => { e.stopPropagation(); openEditModal(time, d.day, key); }}
                          className={`rounded-lg p-2 text-xs ${typeStyles[event.type]} relative group cursor-pointer`}>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteEvent(key); }}
                            className="absolute top-1 right-1 hidden group-hover:block text-gray-500 hover:text-red-500"
                          >
                            <X size={10} />
                          </button>
                          <p className="font-bold text-xs">{event.label}</p>
                          <p className="font-semibold">{event.title}</p>
                          {event.sub && <p className="opacity-70">{event.sub}</p>}
                        </div>
                      ) : (
                        <div className={`h-8 rounded-lg border border-dashed border-transparent hover:${t.border} transition`} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend */}
        <div className={`px-6 py-4 border-t ${t.border} flex items-center gap-6 flex-wrap`}>
          {Object.entries(typeLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                key === "appointment" ? "bg-[#8B4513]" :
                key === "field" ? "bg-green-500" :
                key === "meeting" ? "bg-blue-500" :
                key === "active" ? "bg-yellow-500" :
                "bg-orange-500"
              }`}></span>
              <span className={`text-xs ${t.subtext}`}>{label}</span>
            </div>
          ))}
          <div className={`ml-auto text-xs ${t.subtext}`}>
            ⓘ Click on any empty slot to add an event.
          </div>
        </div>

      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className={`${t.card} rounded-2xl shadow-xl p-6 w-96`}>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#8B4513]">{editKey ? "Edit Slot" : "Add Slot"}</h2>
              <button onClick={() => setShowModal(false)} className={`${t.subtext} hover:text-gray-600`}>
                <X size={20} />
              </button>
            </div>

            {/* Day + Time */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className={`text-xs font-semibold uppercase mb-1 block ${t.subtext}`}>Day</label>
                <select
                  value={selectedSlot?.day}
                  onChange={(e) => setSelectedSlot({ ...selectedSlot, day: e.target.value })}
                  className={`w-full border ${t.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
                >
                  {days.map((d) => (
                    <option key={d.day} value={d.day}>{d.day} {d.date}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className={`text-xs font-semibold uppercase mb-1 block ${t.subtext}`}>Time</label>
                <select
                  value={selectedSlot?.time}
                  onChange={(e) => setSelectedSlot({ ...selectedSlot, time: e.target.value })}
                  className={`w-full border ${t.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
                >
                  {times.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className={`text-xs font-semibold uppercase mb-1 block ${t.subtext}`}>Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Land Permit Issue"
                className={`w-full border ${t.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
              />
            </div>

            {/* Person / Note */}
            <div className="mb-4">
              <label className={`text-xs font-semibold uppercase mb-1 block ${t.subtext}`}>Person / Note</label>
              <input
                type="text"
                value={form.sub}
                onChange={(e) => setForm({ ...form, sub: e.target.value })}
                placeholder="e.g., Nimal Silva"
                className={`w-full border ${t.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
              />
            </div>

            {/* Type */}
            <div className="mb-6">
              <label className={`text-xs font-semibold uppercase mb-1 block ${t.subtext}`}>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className={`w-full border ${t.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
              >
                <option value="appointment">Official Appointment</option>
                <option value="field">Field Visit</option>
                <option value="meeting">Meeting</option>
                <option value="admin">Admin Work</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className={`flex-1 border ${t.border} ${t.subtext} font-semibold py-2 rounded-xl hover:bg-gray-50 transition`}>
                Cancel
              </button>
              <button
                onClick={saveSlot}
                className="flex-1 bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold py-2 rounded-xl transition">
                Save Slot
              </button>
            </div>

          </div>
        </div>
      )}

    </GNLayout>
  );
};

export default Schedule;