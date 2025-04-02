import React from "react";
import BarGraph from "../Graph/bargraph";
import MyGraph from "../Graph/linegraph";
import { FaAmbulance, FaUsers, FaChartLine } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import Cards from "./cards";

const Dashboard = () => {
  return (
    
      <div className="row">
        <Cards />
          <div className="row">
            <div className="col-md-6">
              <MyGraph />
            </div>
            <div className="col-md-6">
              <BarGraph />
            </div>
          </div>
      </div>
  );
};

export default Dashboard;
