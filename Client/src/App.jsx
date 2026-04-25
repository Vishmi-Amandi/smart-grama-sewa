import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GNDashboard from './modules/gn/pages/dashboard.jsx';
import AppointmentList from './modules/gn/pages/AppointmentList.jsx';
import CurrentStatus from './modules/gn/pages/CurrentStatus.jsx';
import CreateAnnouncement from './modules/gn/pages/CreateAnnouncement.jsx';
import AnnouncementList from './modules/gn/pages/AnnouncementList.jsx';
import Schedule from './modules/gn/pages/Schedule.jsx';
import CitizenSearch from './modules/gn/pages/CitizenSearch.jsx';
import Profile from './modules/gn/pages/Profile.jsx';
import Settings from './modules/gn/pages/Settings.jsx';
import TransferRequest from './modules/gn/pages/TransferRequest.jsx';
import Login  from './modules/gn/pages/Login.jsx';
import SignUp from './modules/gn/pages/SignUp.jsx';


function App() {
  const [gnStatus, setGnStatus] = useState("Available");
  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState("medium");

  const fontSizeMap = {
  small: "12px",
  medium: "16px",
  large: "18px",
};

return (
  <div style={{ fontSize: fontSizeMap[fontSize] }}>
  <Routes>
      <Route path="/" element={<GNDashboard gnStatus={gnStatus} theme={theme} />} />
      <Route path="/appointments" element={<AppointmentList gnStatus={gnStatus} theme={theme} />} />
      <Route path="/current-status" element={<CurrentStatus gnStatus={gnStatus} setGnStatus={setGnStatus} theme={theme} />} />
      <Route path="/create-announcement" element={<CreateAnnouncement gnStatus={gnStatus} theme={theme} />} />
      <Route path="/announcement-list" element={<AnnouncementList gnStatus={gnStatus} theme={theme} />} />
      <Route path="/schedule" element={<Schedule gnStatus={gnStatus} theme={theme} />} />
      <Route path="/citizen-search" element={<CitizenSearch gnStatus={gnStatus} theme={theme} />} />
      <Route path="/profile" element={<Profile gnStatus={gnStatus} theme={theme} />} />
      <Route path="/settings" element={<Settings gnStatus={gnStatus} theme={theme} setTheme={setTheme} fontSize={fontSize} setFontSize={setFontSize} />} />
      <Route path="/transfer-request" element={<TransferRequest gnStatus={gnStatus} theme={theme} />} />
      <Route path="/login"  element={<Login  gnStatus={gnStatus} theme={theme}/>} />
      <Route path="/signup" element={<SignUp gnStatus={gnStatus} theme={theme}/>} />
      <Route path="/signup-select" element={<SignUp gnStatus={gnStatus} theme={theme} />} />
    </Routes>
  </div>
);
}

export default App;