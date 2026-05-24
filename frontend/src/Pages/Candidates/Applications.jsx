import { useState, useEffect } from "react";
import { FaPlus, FaList, FaThLarge, FaTrashAlt } from "react-icons/fa";
import { FaSearch } from "react-icons/fa";
import { applicationsApi, savedJobsApi, usersApi } from "../../lib/api";
import TopBarDashboard from "../../Components/TopBarDashboard";
import { SkeletonCard, SkeletonRow } from "../../Components/Skeleton";
import { Link, useLocation, useNavigate } from "react-router-dom"; 
import { showError, showSuccess } from "../../utils/toast";
import { formatDate } from "../../utils/format";
import {
  getApplicationDisplayStatus,
  getApplicationStatusLabel,
  isInterviewStatus,
  isOfferStatus,
} from "../../utils/applicationStatus";

const Applications = ({ initialTab = "all" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [checkedJobIds, setCheckedJobIds] = useState([]);
  const [isCardView, setIsCardView] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedJobs, setSavedJobs] = useState([]);        
  const [savedJobsLoading, setSavedJobsLoading] = useState(false);  
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const [profile, applications] = await Promise.all([
        usersApi.me(),
        applicationsApi.list(),
      ]);
      setJobs(applications);
      setUserName(profile.name || "");
      setUserEmail(profile.email || "");
      setErrorMessage("");
    } catch (error) {
      const message = error.message || "Failed to load applications";
      setErrorMessage(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedJobs = async () => {
    try {
      setSavedJobsLoading(true);
      const data = await savedJobsApi.list();
      setSavedJobs(data);
    } catch (error) {
      showError(error.message || "Failed to load saved jobs");
    } finally {
      setSavedJobsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    loadSavedJobs();
  }, []);

  const openJobDetail = (job) => {
    if (!job?.jobPostId) return;
    navigate(`/jobs/${job.jobPostId}`);
  };

  const handleCheckJob = (jobId) => {
    setCheckedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const deleteJob = async (jobToDelete) => {
    if (!jobToDelete || !jobToDelete.id) return;
    try {
      if (activeTab === "saved") {
        await savedJobsApi.remove(jobToDelete.id);
        setSavedJobs((prev) => prev.filter((job) => job.id !== jobToDelete.id));
      } else {
        await applicationsApi.remove(jobToDelete.id);
        setJobs((prev) => prev.filter((job) => job.id !== jobToDelete.id));
        setCheckedJobIds((prev) => prev.filter((id) => id !== jobToDelete.id));
      } 
      setErrorMessage("");
      showSuccess(activeTab === "saved" ? "Saved job removed" : "Application deleted successfully");
    } catch (error) {
      const fallback = activeTab === "saved" ? "Failed to delete saved job" : "Failed to delete application";
      showError(error.message || fallback);
    }
  }

  const handleBulkDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete the selected jobs?");
    if (!confirmDelete) return;

    const results = await Promise.allSettled(
      checkedJobIds.map((jobId) => applicationsApi.remove(jobId))
    );

    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length > 0) {
      showError("Some applications could not be deleted. Please retry.");
      return;
    }

    setJobs((prev) => prev.filter((job) => !checkedJobIds.includes(job.id)));
    setCheckedJobIds([]);
    setErrorMessage("");
    showSuccess("Selected applications deleted successfully");
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const jobsToDisplay = activeTab === "saved" ? savedJobs : jobs;

  const visibleJobs = jobsToDisplay.filter((job) => {
      const displayStatus = getApplicationDisplayStatus(job.status);
      const matchesTab = activeTab === "all" || activeTab === "saved" || displayStatus === activeTab;    
      const matchesSearch =
      normalizedSearch.length === 0 || 
      job.jobTitle?.toLowerCase().includes(normalizedSearch) ||
      job.companyName?.toLowerCase().includes(normalizedSearch);

    return matchesTab && matchesSearch;
  });

  // Tính số lượng ứng tuyển đang ở vòng phỏng vấn
  const interviewCount = jobs.filter((job) => isInterviewStatus(job.status)).length;

  // Helper tạo màu cho Status Badge
  const getBadgeStyle = (status) => {
    const displayStatus = getApplicationDisplayStatus(status);
    if (isInterviewStatus(status)) return 'bg-blue-100 text-blue-700';
    if (displayStatus === 'applied') return 'bg-emerald-100 text-[#188155]';
    if (isOfferStatus(status)) return 'bg-[#188155] text-white';
    if (displayStatus === 'rejected') return 'bg-gray-200 text-gray-500';
    if (displayStatus === 'closed') return 'bg-red-50 text-red-500';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <TopBarDashboard userName={userName} userEmail={userEmail} />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 pb-12">

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">My Applications</h1>
            <p className="text-[var(--text-secondary)]">Track your journey across {jobs.length} open roles.</p>
          </div>
          <div className="bg-[var(--bg-elevated)] px-6 py-3 rounded-2xl border border-[var(--border-primary)] flex flex-col items-center md:items-end">
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">Active Funnel</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {interviewCount < 10 ? `0${interviewCount}` : interviewCount} Interviews
            </p>
          </div>
        </div>

        {errorMessage && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100" role="alert">
            {errorMessage}
          </p>
        )}

        {/* --- TABS BẰNG NÚT PILL (THAY THẾ KIỂU GẠCH CHÂN CŨ) --- */}
        <div className="flex flex-wrap gap-2 mb-8">
          {["all", "applied", "interview", "offered", "rejected", "saved"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold capitalize transition-all ${
                activeTab === tab 
                  ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm" 
                  : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* --- THANH TÌM KIẾM & ĐỔI VIEW --- */}
        <div className="flex justify-between items-center mb-6">
          <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl px-4 py-2 w-full max-w-sm shadow-sm focus-within:ring-2 focus-within:ring-black/10 focus-within:border-[var(--text-primary)] transition-all">
            <FaSearch className="text-[var(--text-secondary)] text-lg" />
            <input
              type="search"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-0"
            />
          </form>

          <div className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] p-1 rounded-lg shadow-sm">
            <button onClick={() => setIsCardView(true)} className={`p-2 rounded-md transition-colors ${isCardView ? "bg-[var(--bg-secondary)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
              <FaThLarge />
            </button>
            <button onClick={() => setIsCardView(false)} className={`p-2 rounded-md transition-colors ${!isCardView ? "bg-[var(--bg-secondary)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
              <FaList />
            </button>
          </div>
        </div>

        {(isLoading || savedJobsLoading) && isCardView && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {(isLoading || savedJobsLoading) && !isCardView && (
          <div className="bg-[var(--bg-elevated)] rounded-2xl shadow-sm border border-[var(--border-primary)] overflow-hidden mb-12">
            {Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {/* ================== GRID VIEW (CARDS) ================== */}
        {!isLoading && !savedJobsLoading && isCardView ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          
          {visibleJobs.map((job) => (
            <div
              key={job.id}
              className={`bg-[var(--bg-elevated)] rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[240px] transition-all hover:shadow-md cursor-pointer ${
                job.status?.toLowerCase() === 'offered' ? 'border-2 border-[var(--text-primary)]' : 'border border-[var(--border-primary)]'
              }`}
              onClick={() => openJobDetail(job)}
            >
              {/* Card Header: Logo & Badge */}
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl flex items-center justify-center text-xs font-bold shrink-0">
                  {/* Thay thế bằng ảnh Logo nếu có: <img src={job.logo} ... /> */}
                  LOGO
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getBadgeStyle(job.status)}`}>
                  {getApplicationStatusLabel(job.status)}
                </span>
              </div>

              {/* Card Body: Info */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-[var(--text-primary)] truncate">{job.jobTitle}</h3>
                <p className="text-sm text-[var(--text-secondary)] truncate">{job.companyName} • {job.location || "Remote"}</p>
              </div>

              {/* Card Footer: Date & Actions */}
              <div className="flex justify-between items-end mt-auto pt-4 border-t border-[var(--border-primary)]">
                <div>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-0.5">Applied On</p>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{formatDate(job.applicationDate).toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteJob(job); }}
                    className="text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                    title="Delete Application"
                  >
                    <FaTrashAlt />
                  </button>
                  <span className="text-sm font-bold text-[var(--text-primary)] hover:underline">
                    {job.status?.toLowerCase() === 'offered' ? 'View Offer' : 'View Details'}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Special Card: Find More Jobs */}
          <Link
            to="/candidate/job"
            className="bg-[var(--bg-elevated)] rounded-2xl p-6 border-2 border-dashed border-[var(--border-primary)] flex flex-col items-center justify-center h-[240px] cursor-pointer hover:bg-[var(--bg-secondary)] hover:border-[var(--text-primary)] transition-all group"
          >
            <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center text-[var(--text-secondary)] group-hover:bg-[var(--bg-secondary)] group-hover:text-[var(--text-primary)] mb-4 transition-colors">
              <FaPlus size={20} />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Find more jobs</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Apply more</p>
          </Link>

          </div>
        ) : null}

        {/* ================== LIST VIEW (TABLE) ================== */}
        {!isLoading && !savedJobsLoading && !isCardView ? (
          <div className="bg-[var(--bg-elevated)] rounded-2xl shadow-sm border border-[var(--border-primary)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4"></th>
                    <th className="px-6 py-4 font-bold">Title</th>
                    <th className="px-6 py-4 font-bold">Company</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)]">
                  {visibleJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="px-6 py-4 text-center w-12">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-[var(--text-primary)] border-[var(--border-primary)] rounded focus:ring-[var(--text-primary)]"
                          checked={checkedJobIds.includes(job.id)}
                          onChange={() => handleCheckJob(job.id)}
                        />
                      </td>
                      <td className="px-6 py-4 cursor-pointer font-bold text-[var(--text-primary)]" onClick={() => openJobDetail(job)}>
                        {job.jobTitle}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)]">{job.companyName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getBadgeStyle(job.status)}`}>
                          {getApplicationStatusLabel(job.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)] font-medium">{formatDate(job.applicationDate).toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {checkedJobIds.length > 0 && (
              <div className="bg-[var(--bg-secondary)] px-6 py-4 border-t border-[var(--border-primary)] flex justify-end">
                <button
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm"
                  onClick={handleBulkDelete}
                >
                  Delete Selected ({checkedJobIds.length})
                </button>
              </div>
            )}
          </div>
        ) : null}

      </div>

    </div>
  );
};

export default Applications;
