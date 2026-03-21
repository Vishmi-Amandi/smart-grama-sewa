import GNLayout from "../components/gnlayout";

const GNDashboard = () => {
  return (
    <GNLayout>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Total Citizens</p>
          <h2 className="text-2xl font-bold text-gray-800 mt-1">1,245</h2>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Pending Requests</p>
          <h2 className="text-2xl font-bold text-yellow-500 mt-1">38</h2>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Completed Today</p>
          <h2 className="text-2xl font-bold text-green-600 mt-1">12</h2>
        </div>
      </div>

      {/* Placeholder Table */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Requests</h3>
        <p className="text-gray-400 text-sm">No data yet. Start adding citizen requests.</p>
      </div>

    </GNLayout>
  );
};

export default GNDashboard;