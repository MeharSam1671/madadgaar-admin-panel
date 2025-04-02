import React from "react";
import { Navigate, NavLink } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { auth } from "../../Firestore/firestore";

const requests = [
  { id: 1, patient: "Ali Khan", location: "Lahore", status: "Pending", type: "Bike" },
  { id: 2, patient: "Sara Ahmed", location: "Karachi", status: "Completed", type: "Van" },
  { id: 3, patient: "Sara Ahmed", location: "Karachi", status: "Pending", type: "Van" },
  { id: 4, patient: "Bilal Raza", location: "Islamabad", status: "Pending", type: "Fire Brigade" },
  { id: 5, patient: "Hassan Riaz", location: "Faisalabad", status: "Pending", type: "Bike" },
  { id: 6, patient: "Zainab Gul", location: "Rawalpindi", status: "Completed", type: "Van" },
  { id: 7, patient: "Hamza Tariq", location: "Multan", status: "Pending", type: "Bike" },
  { id: 8, patient: "Farhan Ali", location: "Peshawar", status: "Pending", type: "Van" },
  { id: 9, patient: "Ayesha Noor", location: "Quetta", status: "Completed", type: "Fire Brigade" },
  { id: 10, patient: "Saad Mahmood", location: "Lahore", status: "Pending", type: "Bike" },
  { id: 11, patient: "Rehan Siddiqui", location: "Hyderabad", status: "Pending", type: "Van" },
  { id: 12, patient: "Nadia Khan", location: "Sialkot", status: "Completed", type: "Bike" },
  { id: 13, patient: "Usman Ghani", location: "Gujranwala", status: "Pending", type: "Van" },
  { id: 14, patient: "Tariq Mehmood", location: "Sargodha", status: "Pending", type: "Fire Brigade" },
  { id: 15, patient: "Fatima Baig", location: "Bahawalpur", status: "Pending", type: "Bike" },
  { id: 16, patient: "Shahzad Alam", location: "Sukkur", status: "Completed", type: "Van" },
  { id: 17, patient: "Maira Javed", location: "Mardan", status: "Pending", type: "Fire Brigade" },
  { id: 18, patient: "Danish Ahmed", location: "Abbottabad", status: "Pending", type: "Van" },
  { id: 19, patient: "Rabia Malik", location: "Larkana", status: "Completed", type: "Bike" },
  { id: 20, patient: "Waleed Akram", location: "Gujrat", status: "Pending", type: "Bike" }
];

const pendingRequestsCount = requests.filter(req => req.status === "Pending").length;
const handleLogout=async ()=>{
try {
  await auth.signOut();
  Navigate("/"); // Redirect to login after logout
} catch (error) {
  console.error("Logout Error:", error.message);
}
}
const Sidebar = () => {
  
  return (
    <div className="bg-dark text-white vh-100 position-fixed top-0 start-0 p-2" style={{ width: "250px" }}>
      
      <ul className="nav flex-column">
        <li className="nav-item">
          <NavLink to="/" className="nav-link text-white"><h4>{auth.currentUser.displayName}</h4></NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/" className="nav-link text-white">
            Dashboard
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/livetracking" className="nav-link text-white">
            Live Tracking
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/managerequests" className="nav-link text-white">
            Manage Requests <span className="badge bg-danger">{pendingRequestsCount}</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/ambulances" className="nav-link text-white">
            Ambulances
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/reports" className="nav-link text-white">
            Reports
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/settings" className="nav-link text-white">
            Settings
          </NavLink>
        </li>
        <button onClick={handleLogout} class="btn btn-danger">Logout</button>
      </ul>
    </div>
  );
};

export default Sidebar;
