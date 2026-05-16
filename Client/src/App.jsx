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
import ProtectedRoute from './modules/gn/components/ProtectedRoute.jsx';
import ForgotPassword from './modules/gn/pages/ForgotPassword.jsx';


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
  {/* Public Routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<SignUp />} />
  <Route path="/signup-select" element={<SignUp />} />

  {/* Protected Routes */}
  <Route path="/" element={<ProtectedRoute><GNDashboard gnStatus={gnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/appointments" element={<ProtectedRoute><AppointmentList gnStatus={gnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/current-status" element={<ProtectedRoute><CurrentStatus gnStatus={gnStatus} setGnStatus={setGnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/create-announcement" element={<ProtectedRoute><CreateAnnouncement gnStatus={gnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/announcement-list" element={<ProtectedRoute><AnnouncementList gnStatus={gnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/schedule" element={<ProtectedRoute><Schedule gnStatus={gnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/citizen-search" element={<ProtectedRoute><CitizenSearch gnStatus={gnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/profile" element={<ProtectedRoute><Profile gnStatus={gnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/settings" element={<ProtectedRoute><Settings gnStatus={gnStatus} theme={theme} setTheme={setTheme} fontSize={fontSize} setFontSize={setFontSize} /></ProtectedRoute>} />
  <Route path="/transfer-request" element={<ProtectedRoute><TransferRequest gnStatus={gnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
</Routes>
  </div>
);
}

export default App;