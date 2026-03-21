import GNLayout from "../components/gnlayout";

const AppointmentList = ({ gnStatus }) => {
  return (
    <GNLayout gnStatus={gnStatus}>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#8B4513]">Appointment List</h1>
      </div>

      {/* Filter Bar */}
<div className="bg-white rounded-2xl shadow px-5 py-3 flex items-center gap-4 mb-6">

  {/* Date Filter */}
  <div className="flex items-center gap-2">
    <span className="text-xs text-gray-400 uppercase font-semibold">Date</span>
    <button className="bg-[#E5A800] text-black text-xs font-semibold px-3 py-1 rounded-full">
      Today
    </button>
  </div>

  {/* Divider */}
  <div className="w-px h-5 bg-gray-200"></div>

  {/* Status Filter */}
  <div className="flex items-center gap-2">
    <span className="text-xs text-gray-400 uppercase font-semibold">Status</span>
    <button className="bg-[#E5A800] text-black text-xs font-semibold px-3 py-1 rounded-full">
      All Status
    </button>
  </div>

  {/* Divider */}
  <div className="w-px h-5 bg-gray-200"></div>

  {/* Sort By */}
  <div className="flex items-center gap-2 ml-auto">
    <span className="text-xs text-gray-400 uppercase font-semibold">Sort By</span>
    <button className="border text-xs font-semibold px-3 py-1 rounded-full text-gray-600">
      Time (Asc) ▾
    </button>
  </div>

</div>

{/* Table */}
<div className="bg-white rounded-2xl shadow overflow-hidden">
  
  {/* Table Header */}
  <table className="w-full text-sm">
    <thead className="bg-gray-50 text-gray-400 uppercase text-xs">
      <tr>
        <th className="px-6 py-3 text-left">Time</th>
        <th className="px-6 py-3 text-left">Citizen</th>
        <th className="px-6 py-3 text-left">Service</th>
        <th className="px-6 py-3 text-left">Status</th>
        <th className="px-6 py-3 text-left">Action</th>
      </tr>
    </thead>

    <tbody className="divide-y divide-gray-100">

      {/* Row 1 */}
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 text-gray-600">09:00 AM</td>
        <td className="px-6 py-4">
          <p className="font-semibold text-[#8B4513]">Amara Siriwardena</p>
          <p className="text-xs text-gray-400">NIC: 947320634V</p>
        </td>
        <td className="px-6 py-4 text-gray-600">Land Registry</td>
        <td className="px-6 py-4">
          <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full">Pending</span>
        </td>
        <td className="px-6 py-4 flex items-center gap-3">
          <button className="text-gray-400 hover:text-gray-600">👁</button>
          <button className="text-gray-400 hover:text-gray-600">✏️</button>
        </td>
      </tr>

      {/* Row 2 */}
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 text-gray-600">10:30 AM</td>
        <td className="px-6 py-4">
          <p className="font-semibold text-[#8B4513]">Sunil Perera</p>
          <p className="text-xs text-gray-400">NIC: 910237465V</p>
        </td>
        <td className="px-6 py-4 text-gray-600">Identity Card Renewal</td>
        <td className="px-6 py-4">
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">Confirmed</span>
        </td>
        <td className="px-6 py-4 flex items-center gap-3">
          <button className="text-gray-400 hover:text-gray-600">👁</button>
          <button className="text-gray-400 hover:text-gray-600">✏️</button>
        </td>
      </tr>

      {/* Row 3 */}
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 text-gray-600">01:15 PM</td>
        <td className="px-6 py-4">
          <p className="font-semibold text-[#8B4513]">Komal Gunaratne</p>
          <p className="text-xs text-gray-400">NIC: 885643210V</p>
        </td>
        <td className="px-6 py-4 text-gray-600">Character Certificate</td>
        <td className="px-6 py-4">
          <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">Arrived</span>
        </td>
        <td className="px-6 py-4 flex items-center gap-3">
          <button className="text-gray-400 hover:text-gray-600">👁</button>
          <button className="text-gray-400 hover:text-gray-600">✏️</button>
        </td>
      </tr>

      {/* Row 4 */}
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 text-gray-600">02:45 PM</td>
        <td className="px-6 py-4">
          <p className="font-semibold text-[#8B4513]">Nimmi Fernando</p>
          <p className="text-xs text-gray-400">NIC: 956789043V</p>
        </td>
        <td className="px-6 py-4 text-gray-600">Residency Verification</td>
        <td className="px-6 py-4">
          <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full">Pending</span>
        </td>
        <td className="px-6 py-4 flex items-center gap-3">
          <button className="text-gray-400 hover:text-gray-600">👁</button>
          <button className="text-gray-400 hover:text-gray-600">✏️</button>
        </td>
      </tr>

    </tbody>
  </table>

  {/* Pagination */}
  <div className="px-6 py-4 flex items-center justify-between border-t">
    <p className="text-xs text-gray-400">Showing 1-4 of 24 appointments</p>
    <div className="flex items-center gap-2">
      <button className="w-7 h-7 rounded-full bg-[#E5A800] text-black text-xs font-bold">1</button>
      <button className="w-7 h-7 rounded-full hover:bg-gray-100 text-gray-600 text-xs">2</button>
      <button className="w-7 h-7 rounded-full hover:bg-gray-100 text-gray-600 text-xs">3</button>
      <button className="w-7 h-7 rounded-full hover:bg-gray-100 text-gray-600 text-xs">›</button>
    </div>
  </div>

</div>

    </GNLayout>
  );
};

export default AppointmentList;