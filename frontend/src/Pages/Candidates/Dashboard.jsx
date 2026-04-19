import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import { applicationsApi, usersApi } from "../../lib/api";
import TopBarDashboard from "../../Components/TopBarDashboard";
import { LuUserCircle2, LuSearch, LuBookOpen } from "react-icons/lu";
import { BsThreeDotsVertical } from "react-icons/bs";
import { formatMessageTime  } from '../../utils/format';

const Dashboard = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [jobs, setJobs] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [profile, applications] = await Promise.all([
          usersApi.me(),
          applicationsApi.list(),
        ]);

        setJobs(applications);
        setUserName(profile.name || "");
        setUserEmail(profile.email || "");
        setErrorMessage("");
      } catch (error) {
        setErrorMessage(error.message || "Failed to load dashboard data");
      }
    };

    loadDashboardData();
  }, []);


  const jobStatusCount = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {});

  const totalApplications = jobs.length;
  const totalInterviews = jobStatusCount.interview || 0;
  const totalOffers = jobStatusCount.offered || 0;

  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return "Good Morning";
    if (currentHour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const renderStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'interview':
      case 'interviewing':
        return <span className="px-3 py-1 bg-[#e6f4ea] text-[#188155] text-[11px] font-bold tracking-wider uppercase rounded-full">Interviewing</span>;
      case 'applied':
        return <span className="px-3 py-1 bg-[#e8f0fe] text-[#1967d2] text-[11px] font-bold tracking-wider uppercase rounded-full">Applied</span>;
      case 'closed':
        return <span className="px-3 py-1 bg-[#fce8e6] text-[#c5221f] text-[11px] font-bold tracking-wider uppercase rounded-full">Closed</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[11px] font-bold tracking-wider uppercase rounded-full">{status || 'Null'}</span>;
    }
  };

  return (
    <div className="bg-[#fbfcfa] min-h-screen px-8 pt-4 pb-8 lg:px-10 lg:pt-5 lg:pb-10">      
      <TopBarDashboard userName={userName} userEmail={userEmail} />
      {/* --- HEADER --- */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {getGreeting()}, {userName.split(' ')[0] || "User"}
        </h1>
        <p className="text-gray-500">Here is what's happening with your job search today.</p>
        
        {errorMessage && (
          <p className="text-red-500 text-sm mt-3 bg-red-50 p-3 rounded-lg border border-red-100" role="alert">
            {errorMessage}
          </p>
        )}
      </div>

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* Card 1: Applied */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Applied</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-[#116843]">{totalApplications || 12}</span>
          </div>
        </div>

        {/* Card 2: Interviews */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Interviews</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-gray-900">{totalInterviews || '0'}</span>
          </div>
        </div>

        {/* Card 3: Offers (Dark Green) */}
        <div className="bg-[#116843] p-6 rounded-2xl shadow-sm flex flex-col justify-between text-white">
          <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-2">Offers</p>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold">{totalOffers || 1}</span>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded tracking-wider">NEW</span>
          </div>
        </div>

      </div>

      {/* --- MAIN LAYOUT (2 COLUMNS) --- */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* CỘT TRÁI: Recent Applications */}
        <div className="w-full lg:w-2/3">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Applications</h2>
            <Link to="/candidate/applications" className="text-sm font-bold text-[#188155] hover:underline">View All</Link>
          </div>

          <div className="space-y-4">
            {jobs.length > 0 ? (
              jobs.slice(0, 3).map((job) => (
                <div key={job.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    {/* Logo công ty */}
                    <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 p-1 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={job.logo || `https://api.dicebear.com/8.x/initials/svg?seed=${job.companyName}&backgroundColor=f3f4f6`} alt="logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{job.title || job.jobTitle}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{job.companyName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 lg:gap-12">
                    <div className="hidden sm:block text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Applied On</p>
                      <p className="text-sm font-semibold text-gray-800">{formatMessageTime(job.applicationDate)}</p>
                    </div>
                    <div className="w-28 flex justify-end">
                      {renderStatusBadge(job.status)}
                    </div>
                    <button className="text-gray-400 hover:text-gray-700 p-2">
                      <BsThreeDotsVertical />
                    </button>
                  </div>

                </div>
              ))
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-dashed border-gray-200 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                  <LuSearch className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">No recent applications yet</h3>
                <p className="text-sm text-gray-500 mb-4">Your latest job applications will appear here once you start applying.</p>
                <Link to="/candidate/job" className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#188155] text-white text-sm font-semibold hover:bg-[#116843] transition-colors">
                  Explore jobs
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: Getting Started (Các Action Cards) */}
        <div className="w-full lg:w-1/3">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Getting Started</h2>
          
          <div className="space-y-4">
            
            {/* Card 1: Complete Profile */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-[#188155]">
              <div className="w-8 h-8 text-[#188155] mb-3">
                <LuUserCircle2 className="w-full h-full" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Complete your profile</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">Your profile is 85% complete. Add your latest project to stand out.</p>
              <Link to="/candidate/profile" className="text-xs font-bold text-[#188155] uppercase tracking-wider hover:underline flex items-center gap-1">
                UPDATE NOW <span>→</span>
              </Link>
            </div>

            {/* Card 2: Find Jobs */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-[#188155]">
              <div className="w-8 h-8 text-[#188155] mb-3">
                <LuSearch className="w-full h-full" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Find new jobs</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">New roles matching your skillset were posted 2 hours ago.</p>
              <Link to="/candidate/job" className="text-xs font-bold text-[#188155] uppercase tracking-wider hover:underline flex items-center gap-1">
                EXPLORE <span>→</span>
              </Link>
            </div>

            {/* Card 3: Interview Resources */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-gray-700">
              <div className="w-8 h-8 text-gray-700 mb-3">
                <LuBookOpen className="w-full h-full" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Interview resources</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">Master the technical interview with our curated guide.</p>
              <a href="https://www.themuse.com/advice/interviewing" target="_blank" rel="noreferrer" className="text-xs font-bold text-gray-700 uppercase tracking-wider hover:underline flex items-center gap-1">
                READ GUIDE <span>→</span>
              </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;