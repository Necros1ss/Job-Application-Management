import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaBriefcase, FaUsers, FaCalendar, FaCheckCircle, FaChartLine, FaHistory } from "react-icons/fa";
import { jobPostsApi, applicationsApi, usersApi } from "../../lib/api";
import TopBarRecruiter from "../../Components/TopBarRecruiter";
import { showError } from "../../utils/toast";
import {
  getApplicationDisplayStatus,
  getApplicationStatusLabel,
  isInterviewStatus,
  isOfferStatus,
} from "../../utils/applicationStatus";

const StatCard = ({ title, value, subtitle, icon: Icon, color = "emerald" }) => {
  const colorMap = {
    emerald: "bg-black text-white border-black",
    blue: "bg-[#f2f2f2] text-black border-[#e5e5e5]",
    orange: "bg-[#f2f2f2] text-black border-[#e5e5e5]",
    purple: "bg-[#f2f2f2] text-black border-[#e5e5e5]",
  };
  const activeColor = colorMap[color] || colorMap.emerald;

  return (
    <div className="blueprint-card p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium text-[#737373] uppercase">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeColor}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="blueprint-metric text-4xl font-semibold text-black">{value ?? "—"}</span>
        {subtitle && <span className="text-xs font-medium text-[#737373]">{subtitle}</span>}
      </div>
      <div className="mt-5 h-px blueprint-divider" />
    </div>
  );
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHrs / 24);
  if (diffHrs < 1) return "Just now";
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showAppStats, setShowAppStats] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError("");
        const [profile, jobsData, appsData, activityData] = await Promise.all([
          usersApi.me(),
          jobPostsApi.listMine(),
          applicationsApi.listForRecruiter(),
          applicationsApi.listRecruiterActivity(),
        ]);
        setUserName(profile.name || "");
        setUserEmail(profile.email || "");
        setJobs(Array.isArray(jobsData) ? jobsData : []);
        setApplications(Array.isArray(appsData) ? appsData : []);
        setActivity(Array.isArray(activityData) ? activityData : []);
      } catch (err) {
        const message = err.message || "Failed to load dashboard data";
        setError(message);
        showError(message);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((j) => {
      if (!j.deadline) return true;
      return new Date(j.deadline) >= new Date();
    }).length;
    const totalCandidates = applications.length;
    const interviews = applications.filter((a) => isInterviewStatus(a.status)).length;
    const offers = applications.filter((a) => isOfferStatus(a.status)).length;
    const pending = applications.filter((a) => getApplicationDisplayStatus(a.status) === "applied").length;

    return { totalJobs, activeJobs, totalCandidates, interviews, offers, pending };
  }, [jobs, applications]);

  const funnelStats = useMemo(() => {
    const interviewConversion = stats.totalCandidates > 0
      ? Math.round((stats.interviews / stats.totalCandidates) * 100)
      : 0;
    const offerConversion = stats.interviews > 0
      ? Math.round((stats.offers / stats.interviews) * 100)
      : 0;

    return [
      {
        label: "Applications",
        value: stats.totalCandidates,
        percent: stats.totalCandidates > 0 ? 100 : 0,
        caption: "Total candidates",
      },
      {
        label: "Interviews",
        value: stats.interviews,
        percent: interviewConversion,
        caption: `${interviewConversion}% from applications`,
      },
      {
        label: "Offers",
        value: stats.offers,
        percent: offerConversion,
        caption: `${offerConversion}% from interviews`,
      },
    ];
  }, [stats]);

  const recentApplications = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate))
      .slice(0, 5);
  }, [applications]);

  const applicationStatusStats = useMemo(() => {
    const counts = {
      pending: 0,
      interview: 0,
      offered: 0,
      rejected: 0,
    };

    applications.forEach((app) => {
      const status = getApplicationDisplayStatus(app.status);
      if (status === "offered") {
        counts.offered += 1;
        return;
      }
      if (status === "interview") {
        counts.interview += 1;
        return;
      }
      if (status === "rejected") {
        counts.rejected += 1;
        return;
      }
      counts.pending += 1;
    });

    const total = applications.length;

    const items = [
      { key: "pending", label: "Pending", shortLabel: "P", value: counts.pending, barClass: "bg-yellow-400", color: "#facc15" },
      { key: "interview", label: "Interview", shortLabel: "I", value: counts.interview, barClass: "bg-blue-500", color: "#3b82f6" },
      { key: "offered", label: "Offered", shortLabel: "O", value: counts.offered, barClass: "bg-emerald-500", color: "#10b981" },
      { key: "rejected", label: "Rejected", shortLabel: "R", value: counts.rejected, barClass: "bg-red-500", color: "#ef4444" },
    ];

    const maxValue = Math.max(1, ...items.map((item) => item.value));

    let currentPercent = 0;
    const conicStops = items.map((item) => {
      const start = currentPercent;
      const percent = total > 0 ? (item.value / total) * 100 : 0;
      const end = start + percent;
      currentPercent = end;
      return `${item.color} ${start}% ${end}%`;
    });

    const conicGradient = total > 0
      ? `conic-gradient(${conicStops.join(",")})`
      : "conic-gradient(#e5e7eb 0% 100%)";

    return { items, maxValue, total, conicGradient };
  }, [applications]);

  const getStatusBadge = (status) => {
    if (isOfferStatus(status))
      return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Offer</span>;
    if (isInterviewStatus(status))
      return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Interview</span>;
    if (getApplicationDisplayStatus(status) === "rejected")
      return <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Rejected</span>;
    return <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-full">Pending</span>;
  };

  const getActivityDot = (eventType) => {
    if (eventType === "offer_sent") return "bg-emerald-500";
    if (eventType === "interview_scheduled") return "bg-amber-500";
    if (eventType === "application_rejected") return "bg-red-500";
    if (eventType === "message_sent") return "bg-blue-500";
    return "bg-slate-400";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen blueprint-grid-bg">
        <TopBarRecruiter userName="" userEmail="" />
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border animate-pulse">
                <div className="w-20 h-4 bg-gray-100 rounded mb-3" />
                <div className="w-12 h-8 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen blueprint-grid-bg">
      <TopBarRecruiter userName={userName} 
                       userEmail={userEmail}
                       searchValue={searchTerm}
                      onSearchChange={setSearchTerm}
                      searchPlaceholder="Search jobs by title, company, location..." />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 pb-12">
        {/* --- HEADER --- */}
        <div className="blueprint-hero-panel mb-8 p-5">
          <div className="relative z-10 grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="rounded-[10px] border border-[#e5e5e5] bg-white p-5">
              <p className="blueprint-kicker">Recruiter console</p>
              <h1 className="mt-2 text-[34px] font-semibold leading-none text-black">Recruiter Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#737373]">
                Welcome back, {userName || "there"}. Monitor jobs, candidates, interviews, and offers with a denser operational view.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Jobs", "Candidates", "Interviews", "Offers"].map((item) => (
                  <span key={item} className="rounded-full border border-[#e5e5e5] bg-[#f2f2f2] px-3 py-1 text-xs font-medium text-[#0a0a0a]">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[10px] border border-[#e5e5e5] bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium uppercase text-[#737373]">Hiring pulse</p>
                <span className="font-mono text-xs text-[#737373]">Today</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Active", stats.activeJobs],
                  ["Pending", stats.pending],
                  ["Interviews", stats.interviews],
                  ["Offers", stats.offers],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[10px] border border-[#e5e5e5] bg-[#f2f2f2] p-3">
                    <p className="text-xs font-medium text-[#737373]">{label}</p>
                    <p className="blueprint-metric mt-2 text-2xl font-semibold text-black">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- ERROR --- */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* --- STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
          <StatCard
            title="Total Jobs"
            value={stats.totalJobs}
            subtitle="posted"
            icon={FaBriefcase}
            color="emerald"
          />
          <StatCard
            title="Active Jobs"
            value={stats.activeJobs}
            subtitle="open now"
            icon={FaCheckCircle}
            color="blue"
          />
          <StatCard
            title="Total Candidates"
            value={stats.totalCandidates}
            subtitle="applied"
            icon={FaUsers}
            color="purple"
          />
          <StatCard
            title="Interviews"
            value={stats.interviews}
            subtitle={`${stats.offers} offers sent`}
            icon={FaCalendar}
            color="orange"
          />
        </div>

        {/* --- MAIN LAYOUT --- */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT: Recent Applications */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Recent Applications</h2>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowAppStats((prev) => !prev)}
                  className="text-sm font-semibold text-gray-600 hover:text-emerald-700"
                >
                  {showAppStats ? "Hide Stats" : "Show Stats"}
                </button>
                <Link
                  to="/recruiter/application"
                  className="text-sm font-semibold text-emerald-600 hover:underline"
                >
                  View All
                </Link>
              </div>
            </div>

            {showAppStats && (
              <div className="blueprint-card p-5 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800">Application Status Overview</h3>
                  <span className="text-xs text-gray-500">{applicationStatusStats.total} total</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pie Chart</p>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-28 h-28 rounded-full relative shrink-0"
                        style={{ background: applicationStatusStats.conicGradient }}
                      >
                        <div className="absolute inset-[18px] bg-white rounded-full border border-gray-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-600">{applicationStatusStats.total}</span>
                        </div>
                      </div>

                      <div className="space-y-2 w-full">
                        {applicationStatusStats.items.map((item) => (
                          <div key={item.key} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-xs text-gray-600">{item.label}</span>
                            </div>
                            <span className="text-xs font-semibold text-gray-800">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Vertical Bar</p>
                    <div className="h-36 flex items-end justify-between gap-3 border-b border-gray-100 pb-2">
                      {applicationStatusStats.items.map((item) => (
                        <div key={item.key} className="flex-1 flex flex-col items-center justify-end gap-2">
                          <span className="text-[11px] font-semibold text-gray-700">{item.value}</span>
                          <div className="w-full max-w-[42px] h-24 bg-gray-100 rounded-t-md overflow-hidden flex items-end">
                            <div
                              className={`w-full ${item.barClass}`}
                              style={{ height: `${(item.value / applicationStatusStats.maxValue) * 100}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-gray-500 font-medium">{item.shortLabel}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                      <span>P: Pending</span>
                      <span>I: Interview</span>
                      <span>O: Offered</span>
                      <span>R: Rejected</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {recentApplications.length === 0 ? (
              <div className="blueprint-card p-10 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUsers size={24} className="text-gray-400" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">No applications yet</h3>
                <p className="text-sm text-gray-500">Candidates will appear here when they apply to your jobs.</p>
              </div>
            ) : (
              <div className="blueprint-card overflow-hidden">
                {recentApplications.map((app, idx) => (
                  <div
                    key={app.id}
                    className={`p-5 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                      idx < recentApplications.length - 1 ? "border-b border-gray-50" : ""
                    }`}
                    onClick={() => navigate("/recruiter/application")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                        {(app.candidateName || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-gray-900 truncate">{app.candidateName || "Unknown Candidate"}</p>
                          {getStatusBadge(app.status)}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-gray-500 truncate">{app.jobTitle || "—"}</p>
                          <span className="text-xs text-gray-400 shrink-0">
                            {formatTime(app.applicationDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Funnel, Activity, Active Jobs Summary */}
          <div className="w-full lg:w-80 xl:w-96 space-y-6">
            <div className="blueprint-card p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recruitment Funnel</h2>
                  <p className="text-xs text-gray-500 mt-1">Pipeline conversion snapshot</p>
                </div>
                <div className="w-10 h-10 rounded-[10px] border border-[#e5e5e5] bg-[#f2f2f2] text-black flex items-center justify-center">
                  <FaChartLine size={18} />
                </div>
              </div>

              <div className="space-y-4">
                {funnelStats.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                      <span className="text-sm font-bold text-gray-900">{item.value}</span>
                    </div>
                    <div className="h-2.5 bg-[#e5e5e5] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full transition-all"
                        style={{ width: `${Math.min(item.percent, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">{item.caption}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="blueprint-card p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                  <p className="text-xs text-gray-500 mt-1">Latest candidate workflow updates</p>
                </div>
                <div className="w-10 h-10 rounded-[10px] border border-[#e5e5e5] bg-[#f2f2f2] text-black flex items-center justify-center">
                  <FaHistory size={18} />
                </div>
              </div>

              {activity.length === 0 ? (
                <p className="text-sm text-gray-500">No recruitment activity yet.</p>
              ) : (
                <div className="space-y-4">
                  {activity.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${getActivityDot(item.eventType)}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {item.candidateName || "Unknown Candidate"} · {item.jobTitle || "Unknown Job"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{formatTime(item.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900">Active Jobs</h2>
                <Link
                  to="/recruiter/job"
                  className="text-sm font-semibold text-emerald-600 hover:underline"
                >
                  Manage
                </Link>
              </div>

              {jobs.length === 0 ? (
                <div className="blueprint-card p-8 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaBriefcase size={24} className="text-gray-400" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">No jobs posted</h3>
                  <p className="text-sm text-gray-500 mb-4">Start by creating your first job posting.</p>
                  <button
                    onClick={() => navigate("/recruiter/job")}
                    className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700"
                  >
                    Create Job
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.slice(0, 5).map((job) => {
                    const isActive = !job.deadline || new Date(job.deadline) >= new Date();
                    return (
                      <div
                        key={job.id}
                        className="blueprint-card p-4 cursor-pointer"
                        onClick={() => navigate("/recruiter/job")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{job.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {job.applicantCount || 0} applicants
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shrink-0 ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-red-50 text-red-600 border border-red-100"
                          }`}>
                            {isActive ? "Active" : "Closed"}
                          </span>
                        </div>
                        {job.deadline && (
                          <p className="text-xs text-gray-400 mt-2">
                            Deadline: {new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
