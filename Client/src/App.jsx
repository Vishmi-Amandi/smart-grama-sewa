import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import GNDashboard from './modules/gn/pages/dashboard.jsx';
import AppointmentList from './modules/gn/pages/AppointmentList.jsx';
import CurrentStatus from './modules/gn/pages/CurrentStatus.jsx';

function App() {
  const [gnStatus, setGnStatus] = useState("Available");

  return (
    <Routes>
      <Route path="/" element={<GNDashboard gnStatus={gnStatus} />} />
      <Route path="/appointments" element={<AppointmentList gnStatus={gnStatus} />} />
      <Route path="/current-status" element={<CurrentStatus gnStatus={gnStatus} setGnStatus={setGnStatus} />} />
    </Routes>
  );
}

export default App;