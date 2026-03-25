import { useState } from "react";
import GNLayout from "../components/gnlayout";
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

const Schedule = ({ gnStatus }) => {
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

  const days = getWeekDays(weekStart);
  const today = new Date().toDateString();

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const currentWeek = () => setWeekStart(getMonday(new Date()));

  const openModal = (time, day) => {
    setSelectedSlot({ time, day });
    setForm({ title: "", sub: "", type: "appointment" });
    setShowModal(true);
  };

  const saveSlot = () => {
    if (!form.title) return;
    const key = `${selectedSlot.time}-${selectedSlot.day}`;
    setEvents((prev) => ({
      ...prev,
      [key]: {
        type: form.type,
        label: typeLabels[form.type].toUpperCase(),
        title: form.title,
        sub: form.sub,
      },
    }));
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
    <GNLayout gnStatus={gnStatus}>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#8B4513]">Schedule</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="text-gray-400 hover:text-gray-600 px-2">‹</button>
            <button onClick={prevWeek} className="text-sm text-gray-500 hover:bg-gray-100 px-3 py-1 rounded-lg">Previous week</button>
            <button onClick={currentWeek} className="text-sm bg-[#E5A800] text-black font-semibold px-3 py-1 rounded-lg">Current week</button>
            <button onClick={nextWeek} className="text-sm text-gray-500 hover:bg-gray-100 px-3 py-1 rounded-lg">Next week</button>
            <button onClick={nextWeek} className="text-gray-400 hover:text-gray-600 px-2">›</button>
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
      <div className="bg-white rounded-2xl shadow overflow-auto">
        <table className="w-full text-sm">

          {/* Day Headers */}
          <thead className="sticky top-0 bg-white z-10 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase w-24">Time</th>
              {days.map((d) => (
                <th key={d.day} className="px-2 py-3 text-center min-w-32">
                  <p className="text-xs text-gray-400">{d.day}</p>
                  <p className={`text-lg font-bold ${d.full === today ? "text-[#E5A800]" : "text-gray-700"}`}>
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
          <tbody className="divide-y divide-gray-100">
            {times.map((time) => (
              <tr key={time}>
                <td className="px-4 py-2 text-xs text-gray-400 whitespace-nowrap align-top pt-3">{time}</td>
                {days.map((d) => {
                  const key = `${time}-${d.day}`;
                  const event = events[key];
                  return (
                    <td
                      key={d.day}
                      className="px-2 py-1 align-top cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => !event && openModal(time, d.day)}
                    >
                      {event ? (
                        <div className={`rounded-lg p-2 text-xs ${typeStyles[event.type]} relative group`}>
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
                        <div className="h-8 rounded-lg border border-dashed border-transparent hover:border-gray-300 transition" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend */}
        <div className="px-6 py-4 border-t flex items-center gap-6 flex-wrap">
          {Object.entries(typeLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                key === "appointment" ? "bg-[#8B4513]" :
                key === "field" ? "bg-green-500" :
                key === "meeting" ? "bg-blue-500" :
                key === "active" ? "bg-yellow-500" :
                "bg-orange-500"
              }`}></span>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
          <div className="ml-auto text-xs text-gray-400">
            ⓘ Click on any empty slot to add an event.
          </div>
        </div>

      </div>

      {/* Add Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-96">

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#8B4513]">Add Slot</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Time + Day - Editable */}
<div className="flex gap-3 mb-4">
  <div className="flex-1">
    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Day</label>
    <select
      value={selectedSlot?.day}
      onChange={(e) => setSelectedSlot({ ...selectedSlot, day: e.target.value })}
      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800]"
    >
      {days.map((d) => (
        <option key={d.day} value={d.day}>{d.day} {d.date}</option>
      ))}
    </select>
  </div>
  <div className="flex-1">
    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Time</label>
    <select
      value={selectedSlot?.time}
      onChange={(e) => setSelectedSlot({ ...selectedSlot, time: e.target.value })}
      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800]"
    >
      {times.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  </div>
</div>

            {/* Title */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Land Permit Issue"
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800]"
              />
            </div>

            {/* Sub / Person */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Person / Note</label>
              <input
                type="text"
                value={form.sub}
                onChange={(e) => setForm({ ...form, sub: e.target.value })}
                placeholder="e.g., Nimal Silva"
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800]"
              />
            </div>

            {/* Type */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800]"
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
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-xl hover:bg-gray-50 transition">
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