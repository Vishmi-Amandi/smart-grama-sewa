import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import GNDashboard from './modules/gn/pages/dashboard.jsx';
import AppointmentList from './modules/gn/pages/AppointmentList.jsx';
import CurrentStatus from './modules/gn/pages/CurrentStatus.jsx';
import CreateAnnouncement from './modules/gn/pages/CreateAnnouncement.jsx';
import AnnouncementList from './modules/gn/pages/AnnouncementList.jsx';
import Schedule from './modules/gn/pages/Schedule.jsx';

function App() {
  const [gnStatus, setGnStatus] = useState("Available");

  return (
    <Routes>
      <Route path="/" element={<GNDashboard gnStatus={gnStatus} />} />
      <Route path="/appointments" element={<AppointmentList gnStatus={gnStatus} />} />
      <Route path="/current-status" element={<CurrentStatus gnStatus={gnStatus} setGnStatus={setGnStatus} />} />
      <Route path="/create-announcement" element={<CreateAnnouncement gnStatus={gnStatus} />} />
      <Route path="/announcement-list" element={<AnnouncementList gnStatus={gnStatus} />} />
      <Route path="/schedule" element={<Schedule gnStatus={gnStatus} />} />
    </Routes>
  );
}

export default App;