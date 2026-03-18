import { useState, useEffect } from "react";
import { Doughnut, Pie } from "react-chartjs-2";
import { LuUserCircle2, LuSearch } from "react-icons/lu";
import { FaLongArrowAltRight, FaRegLightbulb } from "react-icons/fa";
import { BsBriefcase } from "react-icons/bs";
import { CiMenuKebab } from "react-icons/ci";
import DashboardCard from "../../Components/DashboardCard";
import { applicationsApi, usersApi } from "../../lib/api";
import "chart.js/auto";

const RecruiterDashboard = () => {
  return (
    <div className="h-screen">
      <h2 className="text-3xl font-semibold mb-4">Recruiter Dashboard</h2>
      <p className="text-secondary-text">
        Manage job posts and applicants here.
      </p>
    </div>
  );
};

export default RecruiterDashboard;
