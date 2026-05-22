import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GNDashboard from './modules/gn/pages/GNDashboard.jsx';
import GNAppointmentList from './modules/gn/pages/GNAppointmentList.jsx';
import GNCurrentStatus from './modules/gn/pages/GNCurrentStatus.jsx';
import GNCreateAnnouncement from './modules/gn/pages/GNCreateAnnouncement.jsx';
import GNAnnouncementList from './modules/gn/pages/GNAnnouncementList.jsx';
import GNSchedule from './modules/gn/pages/GNSchedule.jsx';
import GNCitizenSearch from './modules/gn/pages/GNCitizenSearch.jsx';
import GNProfile from './modules/gn/pages/GNProfile.jsx';
import GNSettings from './modules/gn/pages/GNSettings.jsx';
import GNChangeGNDivision from './modules/gn/pages/GNChangeGNDivision.jsx';
import GNLogin  from './modules/gn/pages/GNLogin.jsx';
import GNSignUp from './modules/gn/pages/GNSignUp.jsx';
import ProtectedRoute from './modules/gn/components/ProtectedRoute.jsx';
import GNForgotPassword from './modules/gn/pages/GNForgotPassword.jsx';
import Home from './modules/home/Home.jsx';
import SignUpSelect from './modules/gn/pages/SignUpSelect.jsx';


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
    {/* Landing page */}
  <Route path="/home" element={<Home />} />

  {/* Public Routes */}
  <Route path="/gn-login" element={<GNLogin />} />
  <Route path="/gn-signup" element={<GNSignUp />} />
  <Route path="/gn-forgot-password" element={<GNForgotPassword />} />

  {/* Root redirects to home */}
  <Route path="/" element={<Navigate to="/home" replace />} />


  {/* Protected Routes */}
  <Route path="/gn-dashboard"         element={<ProtectedRoute><GNDashboard gnStatus={gnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/gn-appointments" element={<ProtectedRoute><GNAppointmentList gnStatus={gnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/gn-current-status" element={<ProtectedRoute><GNCurrentStatus gnStatus={gnStatus} setGnStatus={setGnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/gn-create-announcement" element={<ProtectedRoute><GNCreateAnnouncement gnStatus={gnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/gn-announcement-list" element={<ProtectedRoute><GNAnnouncementList gnStatus={gnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/gn-schedule" element={<ProtectedRoute><GNSchedule gnStatus={gnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/gn-citizen-search" element={<ProtectedRoute><GNCitizenSearch gnStatus={gnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/gn-profile" element={<ProtectedRoute><GNProfile gnStatus={gnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/gn-settings" element={<ProtectedRoute><GNSettings gnStatus={gnStatus} theme={theme} setTheme={setTheme} fontSize={fontSize} setFontSize={setFontSize} /></ProtectedRoute>} />
  <Route path="/gn-change-gn-division" element={<ProtectedRoute><GNChangeGNDivision gnStatus={gnStatus} theme={theme} /></ProtectedRoute>} />
  <Route path="/signup-select" element={<SignUpSelect />} />
  
</Routes>
  </div>
);
}

export default App;