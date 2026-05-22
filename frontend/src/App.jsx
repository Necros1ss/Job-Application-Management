import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import Layout from "./Layout";
import Login from "./Pages/Auth/Login";
import SelectRole from "./Pages/Auth/SelectRole";
import Signup from "./Pages/Auth/Signup";
import Landing from "./Pages/Landing";
import Dashboard from "./Pages/Candidates/Dashboard";
import Applications from "./Pages/Candidates/Applications";
import Jobsearch from "./Pages/Candidates/Jobsearch";
import CandidateProfile from "./Pages/Candidates/Profile";
import RecruiterProfile from "./Pages/Recruiters/Profile";
import Settings from "./Pages/Settings";
import RecruiterDashboard from "./Pages/Recruiters/RecruiterDashboard";
import JobPost from "./Pages/Recruiters/JobPost";
import Application from "./Pages/Recruiters/Application";
import InterviewList from "./Pages/Recruiters/InterviewList";
import RecruiterOnboarding from "./Pages/Recruiters/Onboarding";
import Employees from "./Pages/Recruiters/Employees";
import ApplicationDetail from "./Pages/Recruiters/ApplicationDetail";
import CreateJob from "./Pages/Recruiters/CreateJob";
import EditJob from "./Pages/Recruiters/EditJob";
import Messages from "./Pages/Candidates/Messages";
import CandidateOnboarding from "./Pages/Candidates/Onboarding";
import EmployeePortal from "./Pages/Candidates/EmployeePortal";
import ForgotPass from "./Pages/Auth/ForgotPass";
import ResetPassword from "./Pages/Auth/ResetPassword";
import JobDetail from "./Pages/Jobs/JobDetail";
import Company from "./Pages/Info/Company";
import NotFound from "./Pages/NotFound";
import { I18nProvider } from "./lib/i18n";

function App() {
  return (
    <I18nProvider>
      <Router>
        <Routes>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<SelectRole />} />
        <Route path="signup/create" element={<Signup />} />
        <Route path="forgot-password" element={<ForgotPass />} />
        <Route path="reset-password" element={<ResetPassword />} />

        <Route path="/" element={<Layout />}>
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="jobs/:id/company" element={<Company />} />
        </Route>

        <Route path="/candidate" element={<DashboardLayout allowedRole="candidate" />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="applications" element={<Applications />} />
          <Route path="job" element={<Jobsearch />} />
          <Route path="profile" element={<CandidateProfile />} />
          <Route path="messages" element={<Messages />} />
          <Route path="onboarding" element={<CandidateOnboarding />} />
          <Route path="employee" element={<EmployeePortal />} />
          <Route path="saved-jobs" element={<Applications />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/recruiter" element={<DashboardLayout allowedRole="recruiter" />}>
          <Route index element={<RecruiterDashboard />} />
          <Route path="dashboard" element={<RecruiterDashboard />} />
          <Route path="profile" element={<RecruiterProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="job" element={<JobPost />} />
          <Route path="job/create" element={<CreateJob />} />
          <Route path="job/:id/edit" element={<EditJob />} />
          <Route path="application" element={<Application/>} />
          <Route path="application/:id" element={<ApplicationDetail />} />
          <Route path="interviews" element={<InterviewList />} />
          <Route path="onboarding" element={<RecruiterOnboarding />} />
          <Route path="employees" element={<Employees />} />
        </Route>
        <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </I18nProvider>
  );
}

export default App;
