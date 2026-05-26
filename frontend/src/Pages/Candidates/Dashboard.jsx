import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { applicationsApi, interviewsApi, usersApi } from "../../lib/api";
import { SkeletonCard, SkeletonDashboardCard } from "../../Components/Skeleton";
import { FaUserCircle, FaSearch, FaBookOpen, FaMapMarkerAlt, FaVideo } from "react-icons/fa";
import { formatInterviewDateTime, formatMessageTime } from '../../utils/format';
import { showError } from "../../utils/toast";
import { useI18n } from "../../lib/i18n";
import {
  getApplicationDisplayStatus,
  getApplicationStatusLabel,
  isInterviewStatus,
  isOfferStatus,
} from "../../utils/applicationStatus";

const Dashboard = () => {
  const { t } = useI18n();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [jobs, setJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [profile, applications, myInterviews] = await Promise.all([
          usersApi.me(),
          applicationsApi.list(),
          interviewsApi.listForCandidate(),
        ]);

        setJobs(applications);
        setInterviews(myInterviews);
        setUserName(profile.name || "");
        setUserEmail(profile.email || "");
        setErrorMessage("");
      } catch (error) {
        const message = error.message || "Failed to load dashboard data";
        setErrorMessage(message);
        showError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const totalApplications = jobs.length;
  const totalInterviews = interviews.length;
  const totalOffers = jobs.filter((job) => isOfferStatus(job.status)).length;

  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return t("greeting.morning");
    if (currentHour < 17) return t("greeting.afternoon");
    return t("greeting.evening");
  };

  const renderStatusBadge = (status) => {
    const displayStatus = getApplicationDisplayStatus(status);

    if (isInterviewStatus(status)) {
      return <span className="px-3 py-1 bg-[#e6f4ea] text-[#188155] text-[11px] font-bold tracking-wider uppercase rounded-full">{getApplicationStatusLabel(status)}</span>;
    }

    if (displayStatus === 'applied') {
      return <span className="px-3 py-1 bg-[#e8f0fe] text-[#1967d2] text-[11px] font-bold tracking-wider uppercase rounded-full">Applied</span>;
    }

    if (displayStatus === 'closed') {
      return <span className="px-3 py-1 bg-[#fce8e6] text-[#c5221f] text-[11px] font-bold tracking-wider uppercase rounded-full">Closed</span>;
    }

    return <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[11px] font-bold tracking-wider uppercase rounded-full">{getApplicationStatusLabel(status)}</span>;
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
    <div className="blueprint-grid-bg">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 pb-12">
        {/* --- HEADER --- */}
        <div className="blueprint-hero-panel mb-6 p-5">
          <div className="relative z-10 grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="rounded-[10px] border border-[#e5e5e5] bg-white p-5">
              <p className="blueprint-kicker">{t("candidate.console")}</p>
              <h1 className="mt-2 text-[34px] font-semibold leading-none text-black">
                {getGreeting()}, {(userName || "").split(" ")[0] || t("common.user")}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#737373]">
                {t("candidate.dashboardDesc")}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Applications", "Interviews", "Profile", "Messages"].map((item) => (
                  <span key={item} className="rounded-full border border-[#e5e5e5] bg-[#f2f2f2] px-3 py-1 text-xs font-medium text-[#0a0a0a]">
                    {t(item)}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[10px] border border-[#e5e5e5] bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium uppercase text-[#737373]">{t("candidate.progressScan")}</p>
                <span className="font-mono text-xs text-[#737373]">Live</span>
              </div>
              <div className="space-y-3">
                {[
                  [t("candidate.applied"), totalApplications],
                  [t("candidate.interviews"), totalInterviews],
                  [t("candidate.offers"), totalOffers],
                ].map(([label, value], index) => (
                  <div key={label} className="grid grid-cols-[90px_1fr_36px] items-center gap-3">
                    <span className="text-xs font-medium text-[#737373]">{label}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-[#e5e5e5]">
                      <div
                        className="h-full rounded-full bg-black"
                        style={{ width: `${Math.min(100, 28 + Number(value || 0) * 12 + index * 8)}%` }}
                      />
                    </div>
                    <span className="blueprint-metric text-right text-sm font-semibold text-black">{value || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
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
        <div className="blueprint-card p-5 flex flex-col justify-between">
          <p className="text-xs font-medium text-[#737373] uppercase mb-2">{t("candidate.applied")}</p>
          <div className="flex items-baseline gap-2">
            <span className="blueprint-metric text-5xl font-semibold text-black">{totalApplications || "0"}</span>
          </div>
          <div className="mt-5 h-px blueprint-divider" />
        </div>

        {/* Card 2: Interviews */}
        <div className="blueprint-card p-5 flex flex-col justify-between">
          <p className="text-xs font-medium text-[#737373] uppercase mb-2">{t("candidate.interviews")}</p>
          <div className="flex items-baseline gap-2">
            <span className="blueprint-metric text-5xl font-semibold text-black">{totalInterviews || '0'}</span>
          </div>
          <div className="mt-5 h-px blueprint-divider" />
        </div>

        {/* Card 3: Offers (Dark Green) */}
        <div className="bg-black p-5 rounded-[14px] shadow-sm flex flex-col justify-between text-white">
          <p className="text-xs font-medium text-white/60 uppercase mb-2">{t("candidate.offers")}</p>
          <div className="flex items-baseline gap-3">
            <span className="blueprint-metric text-5xl font-semibold">{totalOffers}</span>
            {totalOffers > 0 && <span className="text-[10px] font-medium bg-white text-black px-2 py-0.5 rounded-full">{t("candidate.newBadge")}</span>}
          </div>
          <div className="mt-5 h-px bg-white/25" />
        </div>

        </>
        )}
        </div>

        {/* --- MAIN LAYOUT (2 COLUMNS) --- */}
        <div className="flex flex-col lg:flex-row gap-8 mt-4">
        
        {/* CỘT TRÁI: Recent Applications */}
        <div className="w-full lg:w-2/3">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t("candidate.recentApplications")}</h2>
            <Link to="/candidate/applications" className="text-sm font-bold text-[#188155] hover:underline">{t("candidate.viewAll")}</Link>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : jobs.length > 0 ? (
              jobs.slice(0, 3).map((job) => (
                <div key={job.id} className="blueprint-card p-5 flex items-center justify-between">
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
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t("candidate.appliedOn")}</p>
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
                <h3 className="font-bold text-gray-900 mb-2">{t("candidate.noRecentApplications")}</h3>
                <p className="text-sm text-gray-500 mb-4">{t("candidate.noRecentApplicationsDesc")}</p>
                <Link to="/candidate/job" className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#188155] text-white text-sm font-semibold hover:bg-[#116843] transition-colors">
                  {t("candidate.exploreJobs")}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: Getting Started (Các Action Cards) */}
        <div className="w-full lg:w-1/3">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t("candidate.upcomingInterviews")}</h2>
          </div>

          <div className="blueprint-card p-5 mb-8">
            {isLoading ? (
              <div className="space-y-4">
                {Array(2).fill(0).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : interviews.length > 0 ? (
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
                        {isOnline ? t("candidate.onlineMeeting") : (interview.location || t("candidate.offlineInterview"))}
                      </p>
                      {isOnline && interview.meet_link && (
                        <a
                          href={interview.meet_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center mt-4 px-4 py-2 rounded-lg bg-[#188155] text-white text-sm font-semibold hover:bg-[#116843] transition-colors"
                        >
                          {t("candidate.joinMeeting")}
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
                <p className="text-sm font-semibold text-gray-800">{t("candidate.noUpcomingInterviews")}</p>
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6">{t("candidate.gettingStarted")}</h2>
          
          <div className="space-y-4">
            
            {/* Card 1: Complete Profile */}
            <div className="blueprint-card border-l-4 border-l-black p-5">
              <div className="w-8 h-8 text-[#188155] mb-3">
                <FaUserCircle className="w-full h-full" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t("candidate.completeProfile")}</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{t("candidate.profileCompleteDesc")}</p>
              <Link to="/candidate/profile" className="text-xs font-bold text-[#188155] uppercase tracking-wider hover:underline flex items-center gap-1">
                {t("candidate.updateNow")} <span>→</span>
              </Link>
            </div>

            {/* Card 2: Find Jobs */}
            <div className="blueprint-card border-l-4 border-l-black p-5">
              <div className="w-8 h-8 text-[#188155] mb-3">
                <FaSearch className="w-full h-full" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t("candidate.findNewJobs")}</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{t("candidate.newRolesDesc")}</p>
              <Link to="/candidate/job" className="text-xs font-bold text-[#188155] uppercase tracking-wider hover:underline flex items-center gap-1">
                {t("candidate.explore")} <span>→</span>
              </Link>
            </div>

            {/* Card 3: Interview Resources */}
            <div className="blueprint-card border-l-4 border-l-[#737373] p-5">
              <div className="w-8 h-8 text-gray-700 mb-3">
                <FaBookOpen className="w-full h-full" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t("candidate.interviewResources")}</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{t("candidate.masterInterviewDesc")}</p>
              <a href="https://www.themuse.com/advice/interviewing" target="_blank" rel="noreferrer" className="text-xs font-bold text-gray-700 uppercase tracking-wider hover:underline flex items-center gap-1">
                {t("candidate.readGuide")} <span>→</span>
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
