import { useState, useEffect } from "react";


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

export default function ManageRequests() {
  const [requestList, setRequestList] = useState(requests);
  const [count, setCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState(""); 


  useEffect(() => {
    setCount(requestList.filter((req) => req.status != "Completed").length);
  }, [requestList]);

  const handleAccept = (id) => {
    setRequestList((prevRequests) =>
      prevRequests.map((req) =>
        req.id === id ? { ...req, status: "Completed" } : req
      )
    );
  };

  const filteredRequests = requestList.filter(req =>
    req.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  

  return (
    <div className="p-4">
      <h1>Manage Requests</h1>
      <hr />
      <div className="container mt-4">
        <h2 className="text-center mb-3">🚑 Current Requests</h2>
        <div className="table-responsive mx-auto" style={{ maxWidth: "800px" }}>
          <table className="table table-bordered table-striped shadow-sm rounded">
            <thead className="table-dark text-center">
              <tr>
                <th>User Name</th>
                <th>Ambulance Type</th>
                <th>City</th>
                <th>Distance</th>
                <th>Status</th>
                <th>Choose</th>
              </tr>
            </thead>
            <tbody>
              {requestList
                .filter((req) => req.status !== "Completed")
                .map((req) => (
                  <tr key={req.id} className="align-middle text-center">
                    <td className="fw-bold">{req.patient}</td>
                    <td className="text-muted">{req.type}</td>
                    <td className="text-muted">{req.location}</td>
                    <td>2km</td>
                    <td className={`fw-bold ${req.status === "Pending" ? "text-warning" : "text-success"}`}>
                      {req.status === "Pending" ? "⏳ Pending" : "✅ Completed"}
                    </td>
                    <td>
                      {req.status !== "Completed" ? (
                        <button
                          type="button"
                          className="btn btn-primary me-2 fw-bold px-3 py-1 shadow-sm"
                          onClick={() => handleAccept(req.id)}
                        >
                          ✅ Accept
                        </button>
                      ) : (
                        <span className="text-success fw-bold">✔ Accepted</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="text-center mt-4">🚑 All Requests </h2>
      

      <div className="table-responsive mx-auto" style={{ maxWidth: "500px" }}>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search by name, type, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
        <table className="table table-bordered table-striped shadow-sm rounded">
          <thead className="table-dark">
            <tr>
              <th>User Name</th>
              <th>Ambulance Type</th>
              <th>City</th>
              <th>Distance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
          {filteredRequests.map((req) => (
  <tr key={req.id} className="align-middle text-center">
    <td className="fw-bold">{req.patient}</td>
    <td className="text-muted">{req.type}</td>
    <td className="text-muted">{req.location}</td>
    <td>2km</td>
    <td className={`fw-bold ${req.status === "Pending" ? "text-warning" : "text-success"}`}>
      {req.status}
    </td>
  </tr>
))}

          </tbody>
        </table>
      </div>
    </div>
  );
}




