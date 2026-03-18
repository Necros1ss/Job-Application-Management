import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import Layout from "./Layout";
import Login from "./Pages/Auth/Login";
import SelectRole from "./Pages/Auth/SelectRole";
import Signup from "./Pages/Auth/Signup";
import Dashboard from "./Pages/Candidates/Dashboard";
import Applications from "./Pages/Candidates/Applications";
import Jobsearch from "./Pages/Candidates/Jobsearch";
import Profile from "./Pages/Profile";
import Settings from "./Pages/Settings";
import RecruiterDashboard from "./Pages/Recruiters/RecruiterDashboard";
import JobPost from "./Pages/Recruiters/JobPost";
import ForgotPass from "./Pages/Auth/ForgotPass";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Login />} />
          <Route path="signup" element={<SelectRole />} />
          <Route path="signup/create" element={<Signup />} />
          <Route path="login" element={<Login />} />
          <Route path="forgot-password" element={<ForgotPass />} />
        </Route>
        <Route path="/dashboard" element={<DashboardLayout allowedRole="candidate" />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="applications" element={<Applications />} />
          <Route path="job" element={<Jobsearch />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/recruiter" element={<DashboardLayout allowedRole="recruiter" />}>
          <Route index element={<RecruiterDashboard />} />
          <Route path="dashboard" element={<RecruiterDashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="job" element={<JobPost />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
