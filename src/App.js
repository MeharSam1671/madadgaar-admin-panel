import { Routes, Route } from "react-router-dom";
import Sidebar from "./Components/SideBar/Sidebar";
import Dashboard from "./Components/Dashboard/dashboard";
import LiveTracking from "./Components/Live Tracking/LiveTracking";
import ManageRequests from "./Components/Manage Requests/managerequests";
import Ambulances from "./Components/Ambulances/ambulance";
import Auth from "./Components/Login/login"; // ✅ Import Auth component
import Profile from "./Components/Profile/Profile";

const Reports = () => <h1 className="p-5">Reports</h1>;
const Settings = () => <h1 className="p-5">Settings</h1>;

function App() {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-4 bg-light overflow-auto" style={{ marginLeft: "250px", height: "100vh" }}>
        <Routes>
        <Route path="/app" element={<Dashboard />} />
        <Route path="/" element={<Dashboard />} />

        <Route path="/profile" element={<Profile />} />
          <Route path="/ambulances" element={<Ambulances />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/livetracking" element={<LiveTracking />} />
          <Route path="/managerequests" element={<ManageRequests />} />
          <Route path="/auth" element={<Auth />} /> {/* ✅ Add Auth Route */}
        </Routes>
      </div>
    </div>
  );
}

export default App;
