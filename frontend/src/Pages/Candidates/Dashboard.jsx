import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import { applicationsApi, interviewsApi, usersApi } from "../../lib/api";
import TopBarDashboard from "../../Components/TopBarDashboard";
import { SkeletonCard, SkeletonDashboardCard } from "../../Components/Skeleton";
import { FaUserCircle, FaSearch, FaBookOpen } from "react-icons/fa";
import { formatMessageTime  } from '../../utils/format';

const Dashboard = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [profile, applications] = await Promise.all([
          usersApi.me(),
          applicationsApi.list(),
          interviewsApi.myInterviews(),
        ]);

        setJobs(applications);
        setInterviews(myInterviews);
        setUserName(profile.name || "");
        setUserEmail(profile.email || "");
        setErrorMessage("");
      } catch (error) {
        setErrorMessage(error.message || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);


  const jobStatusCount = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {});

  const totalApplications = jobs.length;
  const totalInterviews = (jobStatusCount.interview || 0) + (jobStatusCount.scheduled_interview || 0);
  const totalOffers = jobs.filter((job) => {
    const normalized = (job.status || '').toLowerCase();
    return normalized === 'offered' || normalized === 'accepted';
  }).length;

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
      case 'scheduled_interview':
        return <span className="px-3 py-1 bg-[#e6f4ea] text-[#188155] text-[11px] font-bold tracking-wider uppercase rounded-full">Interviewing</span>;
      case 'applied':
        return <span className="px-3 py-1 bg-[#e8f0fe] text-[#1967d2] text-[11px] font-bold tracking-wider uppercase rounded-full">Applied</span>;
      case 'closed':
        return <span className="px-3 py-1 bg-[#fce8e6] text-[#c5221f] text-[11px] font-bold tracking-wider uppercase rounded-full">Closed</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[11px] font-bold tracking-wider uppercase rounded-full">{status || 'Null'}</span>;
    }
  };

  const formatInterviewDateTime = (value) => {
    if (!value) return "Not scheduled";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not scheduled";

    const weekday = date.toLocaleDateString("vi-VN", { weekday: "long" });
    const formattedDate = date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${weekday}, ${formattedDate} lúc ${formattedTime}`;
  };

  const renderInterviewModeBadge = (mode) => {
    const normalizedMode = (mode || "").toLowerCase();
    const isOnline = normalizedMode === "online";

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
          isOnline
            ? "bg-emerald-50 text-emerald-700"
            : "bg-orange-50 text-orange-700"
        }`}
      >
        {isOnline ? "Online" : "Offline"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBarDashboard userName={userName} userEmail={userEmail} />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 pb-12">
        {/* --- HEADER --- */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {getGreeting()}, {(userName || "").split(" ")[0] || "User"}
        </h1>
        <p className="text-gray-500">Here is what's happening with your job search today.</p>
        
        {errorMessage && (
          <p className="text-red-500 text-sm mt-3 bg-red-50 p-3 rounded-lg border border-red-100" role="alert">
            {errorMessage}
          </p>
        )}

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-1">
        {isLoading ? (
          <>
            <SkeletonDashboardCard />
            <SkeletonDashboardCard />
            <SkeletonDashboardCard dark />
          </>
        ) : (
        <>
        
        {/* Card 1: Applied */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Applied</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-[#116843]">{totalApplications || "??"}</span>
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
            <span className="text-5xl font-bold">{totalOffers}</span>
            {totalOffers > 0 && <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded tracking-wider">NEW</span>}
          </div>
        </div>

        </>
        )}
        </div>

        {/* --- MAIN LAYOUT (2 COLUMNS) --- */}
        <div className="flex flex-col lg:flex-row gap-8 mt-4">
        
        {/* CỘT TRÁI: Recent Applications */}
        <div className="w-full lg:w-2/3">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Applications</h2>
            <Link to="/candidate/applications" className="text-sm font-bold text-[#188155] hover:underline">View All</Link>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : jobs.length > 0 ? (
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
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-dashed border-gray-200 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                  <FaSearch className="w-5 h-5" />
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
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Interviews</h2>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
            {interviews.length > 0 ? (
              <div className="space-y-5">
                {interviews.slice(0, 3).map((interview) => {
                  const isOnline = (interview.mode || "").toLowerCase() === "online";

                  return (
                    <div key={interview.id} className="border-b border-gray-100 pb-5 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">{interview.job_title}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">{interview.company_name}</p>
                        </div>
                        {renderInterviewModeBadge(interview.mode)}
                      </div>
                      <p className="text-sm font-semibold text-gray-800">
                        {formatInterviewDateTime(interview.interview_datetime)}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                        {isOnline ? <FaVideo className="text-emerald-600" /> : <FaMapMarkerAlt className="text-orange-600" />}
                        {isOnline ? "Online meeting" : interview.location || "Offline interview"}
                      </p>
                      {isOnline && interview.meet_link && (
                        <a
                          href={interview.meet_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center mt-4 px-4 py-2 rounded-lg bg-[#188155] text-white text-sm font-semibold hover:bg-[#116843] transition-colors"
                        >
                          Join Meeting
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-gray-50 text-gray-500 flex items-center justify-center mb-3">
                  <FaBookOpen className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-gray-800">No upcoming interviews</p>
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6">Getting Started</h2>
          
          <div className="space-y-4">
            
            {/* Card 1: Complete Profile */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-[#188155]">
              <div className="w-8 h-8 text-[#188155] mb-3">
                <FaUserCircle className="w-full h-full" />
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
                <FaSearch className="w-full h-full" />
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
                <FaBookOpen className="w-full h-full" />
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
    </div>
  );
};

export default Dashboard;
