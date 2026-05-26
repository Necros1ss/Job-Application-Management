import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import Layout from "./Layout";
import Login from "./Pages/Auth/Login";
import SelectRole from "./Pages/Auth/SelectRole";
import Signup from "./Pages/Auth/Signup";
import Landing from "./Pages/Landing";
import ForgotPass from "./Pages/Auth/ForgotPass";
import ResetPassword from "./Pages/Auth/ResetPassword";
import JobDetail from "./Pages/Jobs/JobDetail";
import Company from "./Pages/Info/Company";
import Settings from "./Pages/Settings";
import NotFound from "./Pages/NotFound";
import { I18nProvider } from "./lib/i18n";
import AutoTranslate from "./Components/AutoTranslate";
import ErrorBoundary from "./Components/ErrorBoundary";

// Lazy-loaded candidate pages
const LazyCandidateDashboard = lazy(() => import("./Pages/Candidates/Dashboard"));
const LazyApplications = lazy(() => import("./Pages/Candidates/Applications"));
const LazyJobsearch = lazy(() => import("./Pages/Candidates/Jobsearch"));
const LazyCandidateProfile = lazy(() => import("./Pages/Candidates/Profile"));
const LazyMessages = lazy(() => import("./Pages/Candidates/Messages"));
const LazyCandidateOnboarding = lazy(() => import("./Pages/Candidates/Onboarding"));
const LazyEmployeePortal = lazy(() => import("./Pages/Candidates/EmployeePortal"));

// Lazy-loaded recruiter pages
const LazyRecruiterDashboard = lazy(() => import("./Pages/Recruiters/RecruiterDashboard"));
const LazyRecruiterProfile = lazy(() => import("./Pages/Recruiters/Profile"));
const LazyJobPost = lazy(() => import("./Pages/Recruiters/JobPost"));
const LazyCreateJob = lazy(() => import("./Pages/Recruiters/CreateJob"));
const LazyEditJob = lazy(() => import("./Pages/Recruiters/EditJob"));
const LazyApplication = lazy(() => import("./Pages/Recruiters/Application"));
const LazyApplicationDetail = lazy(() => import("./Pages/Recruiters/ApplicationDetail"));
const LazyInterviewList = lazy(() => import("./Pages/Recruiters/InterviewList"));
const LazyRecruiterOnboarding = lazy(() => import("./Pages/Recruiters/Onboarding"));
const LazyEmployees = lazy(() => import("./Pages/Recruiters/Employees"));

// Lazy-loaded admin pages
const LazyAdminDashboard = lazy(() => import("./Pages/Admin/AdminDashboard"));
const LazyAdminUsers = lazy(() => import("./Pages/Admin/AdminUsers"));
const LazyAdminJobs = lazy(() => import("./Pages/Admin/AdminJobs"));

// Lazy-loaded HR Manager pages
const LazyHRManagerDashboard = lazy(() => import("./Pages/HRManager/HRManagerDashboard"));
const LazyHRManagerJobs = lazy(() => import("./Pages/HRManager/HRManagerJobs"));
const LazyHRManagerRecruiters = lazy(() => import("./Pages/HRManager/HRManagerRecruiters"));
const LazyHRManagerReports = lazy(() => import("./Pages/HRManager/HRManagerReports"));

// Lazy-loaded Interviewer pages
const LazyInterviewerDashboard = lazy(() => import("./Pages/Interviewer/InterviewerDashboard"));
const LazyEvaluateInterview = lazy(() => import("./Pages/Interviewer/EvaluateInterview"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <AutoTranslate />
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
        <Route index element={<Suspense fallback={<LoadingFallback />}><LazyCandidateDashboard /></Suspense>} />
        <Route path="dashboard" element={<Suspense fallback={<LoadingFallback />}><LazyCandidateDashboard /></Suspense>} />
        <Route path="applications" element={<Suspense fallback={<LoadingFallback />}><LazyApplications /></Suspense>} />
        <Route path="job" element={<Suspense fallback={<LoadingFallback />}><LazyJobsearch /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<LoadingFallback />}><LazyCandidateProfile /></Suspense>} />
        <Route path="messages" element={<Suspense fallback={<LoadingFallback />}><LazyMessages /></Suspense>} />
        <Route path="onboarding" element={<Suspense fallback={<LoadingFallback />}><LazyCandidateOnboarding /></Suspense>} />
        <Route path="employee" element={<Suspense fallback={<LoadingFallback />}><LazyEmployeePortal /></Suspense>} />
        <Route path="saved-jobs" element={<Suspense fallback={<LoadingFallback />}><LazyApplications /></Suspense>} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/recruiter" element={<DashboardLayout allowedRole="recruiter" />}>
        <Route index element={<Suspense fallback={<LoadingFallback />}><LazyRecruiterDashboard /></Suspense>} />
        <Route path="dashboard" element={<Suspense fallback={<LoadingFallback />}><LazyRecruiterDashboard /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<LoadingFallback />}><LazyRecruiterProfile /></Suspense>} />
        <Route path="settings" element={<Settings />} />
        <Route path="job" element={<Suspense fallback={<LoadingFallback />}><LazyJobPost /></Suspense>} />
        <Route path="job/create" element={<Suspense fallback={<LoadingFallback />}><LazyCreateJob /></Suspense>} />
        <Route path="job/:id/edit" element={<Suspense fallback={<LoadingFallback />}><LazyEditJob /></Suspense>} />
        <Route path="application" element={<Suspense fallback={<LoadingFallback />}><LazyApplication /></Suspense>} />
        <Route path="application/:id" element={<Suspense fallback={<LoadingFallback />}><LazyApplicationDetail /></Suspense>} />
        <Route path="interviews" element={<Suspense fallback={<LoadingFallback />}><LazyInterviewList /></Suspense>} />
        <Route path="onboarding" element={<Suspense fallback={<LoadingFallback />}><LazyRecruiterOnboarding /></Suspense>} />
        <Route path="employees" element={<Suspense fallback={<LoadingFallback />}><LazyEmployees /></Suspense>} />
      </Route>
      <Route path="/admin" element={<DashboardLayout allowedRole="admin" />}>
        <Route index element={<Suspense fallback={<LoadingFallback />}><LazyAdminDashboard /></Suspense>} />
        <Route path="dashboard" element={<Suspense fallback={<LoadingFallback />}><LazyAdminDashboard /></Suspense>} />
        <Route path="users" element={<Suspense fallback={<LoadingFallback />}><LazyAdminUsers /></Suspense>} />
        <Route path="jobs" element={<Suspense fallback={<LoadingFallback />}><LazyAdminJobs /></Suspense>} />
      </Route>
      <Route path="/hr-manager" element={<DashboardLayout allowedRole="hr_manager" />}>
        <Route index element={<Suspense fallback={<LoadingFallback />}><LazyHRManagerDashboard /></Suspense>} />
        <Route path="dashboard" element={<Suspense fallback={<LoadingFallback />}><LazyHRManagerDashboard /></Suspense>} />
        <Route path="jobs" element={<Suspense fallback={<LoadingFallback />}><LazyHRManagerJobs /></Suspense>} />
        <Route path="recruiters" element={<Suspense fallback={<LoadingFallback />}><LazyHRManagerRecruiters /></Suspense>} />
        <Route path="reports" element={<Suspense fallback={<LoadingFallback />}><LazyHRManagerReports /></Suspense>} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/interviewer" element={<DashboardLayout allowedRole="interviewer" />}>
        <Route index element={<Suspense fallback={<LoadingFallback />}><LazyInterviewerDashboard /></Suspense>} />
        <Route path="dashboard" element={<Suspense fallback={<LoadingFallback />}><LazyInterviewerDashboard /></Suspense>} />
        <Route path="interviews" element={<Suspense fallback={<LoadingFallback />}><LazyInterviewerDashboard /></Suspense>} />
        <Route path="evaluate/:interviewId" element={<Suspense fallback={<LoadingFallback />}><LazyEvaluateInterview /></Suspense>} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;
