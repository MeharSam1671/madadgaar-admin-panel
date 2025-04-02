import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap CSS

// Dummy data representing emergency vehicles
const dummyAmbulances = [
  { id: "1", name: "Rescue 1122 Fire Brigade", type: "Fire Brigade", location: "Lahore", status: "Available" },
  { id: "2", name: "City Ambulance Van", type: "Ambulance Van", location: "Karachi", status: "Busy" },
  { id: "3", name: "Emergency Bike Response", type: "Bike", location: "Islamabad", status: "Available" },
];

const AmbulancesScreen = () => {
  // State to store the list of emergency vehicles
  const [ambulances, setAmbulances] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // State for search input

  useEffect(() => {
    // Simulating data fetch with dummy data when the component mounts
    setAmbulances(dummyAmbulances);
  }, []);

  // Filter ambulances based on search term
  const filteredAmbulances = ambulances.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mt-4">
      {/* Page heading */}
      <h2 className="text-center mb-4">Emergency Vehicles</h2>
      
      {/* Search Input */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search by name, type, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Displaying emergency vehicles in a Bootstrap grid */}
      <div className="row">
        {filteredAmbulances.length > 0 ? (
          filteredAmbulances.map(vehicle => (
            <div key={vehicle.id} className="col-md-4 mb-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  {/* Display vehicle details */}
                  <h5 className="card-title">{vehicle.name}</h5>
                  <p className="card-text"><strong>Type:</strong> {vehicle.type}</p>
                  <p className="card-text"><strong>Location:</strong> {vehicle.location}</p>
                  <p className="card-text"><strong>Status:</strong> {vehicle.status}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center">No vehicles found.</p>
        )}
      </div>
    </div>
  );
};

export default AmbulancesScreen;