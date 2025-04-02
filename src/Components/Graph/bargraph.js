import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "bootstrap/dist/css/bootstrap.min.css"; 

const data = [
  { name: "Jan", added: 50,removed:20 },
  { name: "Feb", added: 70,removed:10  },
  { name: "Mar", added: 60,removed:50  },
  { name: "Apr", added: 80,removed:30  },
  { name: "May", added: 100,removed:90  },
];

const BarGraph = () => {
  return (
    <div className="container-fluid">
      <h3 className="text-center mt-3">Users Added</h3>

      <div className="card shadow-lg p-4 mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <select className="form-select w-auto">
            <option>Daily</option>
            <option>Monthly</option>
            <option>Yearly</option>
          </select>
        </div>

        <div style={{ width: "100%", height: "200px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="added" fill="blue" name="Users Added" />

            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BarGraph;
