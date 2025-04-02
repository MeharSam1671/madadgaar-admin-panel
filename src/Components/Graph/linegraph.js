import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "bootstrap/dist/css/bootstrap.min.css"; 

const data = [
  { name: "Jan", added: 5, removed: 2 },
  { name: "Feb", added: 7, removed: 3 },
  { name: "Mar", added: 6, removed: 1 },
  { name: "Apr", added: 8, removed: 4 },
  { name: "May", added: 10, removed: 2 },
];

const MyGraph = () => {
  return (
    <div className="container-fluid">
      <h3 className="text-center mt-3">Ambulances</h3>

      <div className="card shadow-lg p-4 mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <select className="form-select w-auto">
            <option>Days</option>
            <option>Month</option>
            <option>Yearly</option>
          </select>

          
        </div>

        <div style={{ width: "100%", height: "200px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="added"
                stroke="blue"
                strokeWidth={2}
                name="Added Ambulances"
              />
              <Line
                type="monotone"
                dataKey="removed"
                stroke="red"
                strokeWidth={2}
                name="Removed Ambulances"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MyGraph;
