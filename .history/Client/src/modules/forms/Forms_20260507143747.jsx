import React from 'react';

const Forms = () => {
  const formList = [
    { id: 1, title: "Residence Certificate", desc: "Proof of residence for official use" },
    { id: 2, title: "Character Certificate", desc: "Proof of income for various purposes" },
    { id: 3, title: "Income Certificate", desc: "Proof of income for various purposes" },
    { id: 4, title: "Valuation Certificate", desc: "Property valuation for legal needs" },
    { id: 5, title: "Identity Card Application", desc: "New or replacement NIC application" },
    { id: 6, title: "Living Funds for Disabled Persons", desc: "Financial assistance application" },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* 1. Sidebar - Using your team's yellow variable */}
      <aside className="w-64 fixed inset-y-0 left-0 shadow-lg" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
        <div className="p-6">
          <img src="/logo.png" alt="Logo" className="h-12 mb-10" />
          <nav className="space-y-4 font-semibold text-gray-800">
            <div className="flex items-center gap-3 p-2 rounded hover:bg-white/20 cursor-pointer"><span>Dashboard</span></div>
            <div className="flex items-center gap-3 p-2 rounded hover:bg-white/20 cursor-pointer"><span>Announcements</span></div>
            <div className="flex items-center gap-3 p-2 rounded hover:bg-white/20 cursor-pointer"><span>Appointments</span></div>
            <div className="flex items-center gap-3 p-2 bg-white rounded shadow-sm cursor-pointer"><span>Forms</span></div>
            <div className="mt-20 pt-10 border-t border-black/10">
              <div className="p-2 cursor-pointer">Profile</div>
              <div className="p-2 cursor-pointer">Settings</div>
              <div className="p-2 cursor-pointer">Logout</div>
            </div>
          </nav>
        </div>
      </aside>

      {/* 2. Main Content */}
      <main className="ml-64 flex-1 p-8">
        {/* Header Area */}
        <header className="flex justify-between items-center mb-8">
          <div className="relative w-1/3">
            <input type="text" placeholder="Search forms..." className="w-full p-2 pl-10 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          </div>
          <div className="flex items-center gap-4">
             <span className="text-sm font-medium">English</span>
             <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center font-bold">W</div>
          </div>
        </header>

        <h2 className="text-2xl font-bold text-amber-900 mb-6">Forms Library</h2>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-300 mb-8 pb-2 text-sm font-semibold text-gray-600">
          <span className="text-amber-900 border-b-2 border-amber-900 pb-2 cursor-pointer">All</span>
          <span className="cursor-pointer hover:text-amber-900">Certificates</span>
          <span className="cursor-pointer hover:text-amber-900">Applications</span>
          <span className="cursor-pointer hover:text-amber-900">Recommendations</span>
          <button className="ml-auto bg-amber-800 text-white px-4 py-1 rounded shadow-sm">My Forms</button>
        </div>

        {/* Forms List */}
        <div className="space-y-4">
          {formList.map((form) => (
            <div key={form.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  {/* Placeholder for Icon */}
                  <div className="w-6 h-6 border-2 border-amber-900 rounded-sm"></div>
                </div>
                <div>
                  <h3 className="font-bold text-amber-950">{form.title}</h3>
                  <p className="text-xs text-gray-500">{form.desc}</p>
                </div>
              </div>
              <button className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
                View Form
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Forms;