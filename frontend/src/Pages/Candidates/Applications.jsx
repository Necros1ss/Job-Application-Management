import { useState, useEffect } from "react";
import { FaPlus, FaList, FaThLarge, FaTrashAlt } from "react-icons/fa";
import { LuSearch } from "react-icons/lu";
import { MdClose } from "react-icons/md";
import AddNewJobs from "../../Components/AddNewJob";
import EditJobModal from "../../Components/EditJobModal";
import { applicationsApi, savedJobsApi, usersApi } from "../../lib/api"; // Đảm bảo đã import usersApi
import TopBarDashboard from "../../Components/TopBarDashboard";
import { Link } from "react-router-dom"; 

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
};

const Applications = () => {
  const [showJobModal, setShowJobModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
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
      const data = await applicationsApi.list();
      setJobs(data);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || "Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedJobs = async () => {
    try {
      setSavedJobsLoading(true);
      const data = await savedJobsApi.list();
      setSavedJobs(data);
      setErrorMessage("");
      } 
      catch (error) {
        setErrorMessage(error.message || "Failed to load applications");
      } 
      finally {
        setSavedJobsLoading(false);
      }
  };
  
  const loadData = async () => {
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

  useEffect(() => {
    loadJobs();
    loadSavedJobs();
    loadData();
  }, []);

  const handleOpenJobModal = () => {
    setShowJobModal(true);
  };

  const handleAddJob = async (newJob) => {
    try {
      const createdJob = await applicationsApi.create(newJob);
      setJobs((prev) => [createdJob, ...prev]);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || "Failed to create application");
    }
  };

  const handleEditJob = async (updatedJob) => {
    try {
      const saved = await applicationsApi.update(updatedJob.id, updatedJob);
      setJobs((prev) => prev.map((job) => (job.id === saved.id ? saved : job)));
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || "Failed to update application");
    }
  };

  const handleOpenEditModal = (job) => {
    setSelectedJob(job);
    setShowEditModal(true);
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
    } catch (error) {
      const fallback = activeTab === "saved" ? "Failed to delete saved job" : "Failed to delete application";
      setErrorMessage(error.message || fallback);
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
      setErrorMessage("Some applications could not be deleted. Please retry.");
      return;
    }

    setJobs((prev) => prev.filter((job) => !checkedJobIds.includes(job.id)));
    setCheckedJobIds([]);
    setErrorMessage("");
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const jobsToDisplay = activeTab === "saved" ? savedJobs : jobs;

  const visibleJobs = jobsToDisplay.filter((job) => {
      const matchesTab = activeTab === "all" || activeTab === "saved" || job.status?.toLowerCase() === activeTab;    
      const matchesSearch =
      normalizedSearch.length === 0 ||
      job.jobTitle?.toLowerCase().includes(normalizedSearch) ||
      job.companyName?.toLowerCase().includes(normalizedSearch);

    return matchesTab && matchesSearch;
  });

  // Tính số lượng ứng tuyển đang ở vòng phỏng vấn
  const interviewCount = jobs.filter(j => j.status?.toLowerCase() === 'interview').length;

  // Helper tạo màu cho Status Badge
  const getBadgeStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === 'interview') return 'bg-blue-100 text-blue-700';
    if (s === 'applied') return 'bg-emerald-100 text-[#188155]';
    if (s === 'offered') return 'bg-[#188155] text-white';
    if (s === 'rejected') return 'bg-gray-200 text-gray-500';
    if (s === 'closed') return 'bg-red-50 text-red-500';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-[#fbfcfa] px-8 pt-4 pb-12 lg:px-10 lg:pt-5 lg:pb-12">
      
      <TopBarDashboard userName={userName} userEmail={userEmail} />

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Applications</h1>
          <p className="text-gray-500">Track your journey across {jobs.length} open roles.</p>
        </div>
        <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 flex flex-col items-center md:items-end">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Active Funnel</p>
          <p className="text-2xl font-bold text-[#188155]">
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
                ? "bg-[#188155] text-white shadow-sm" 
                : "bg-transparent text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- THANH TÌM KIẾM & ĐỔI VIEW --- */}
      <div className="flex justify-between items-center mb-6">
        <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 w-full max-w-sm shadow-sm focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-400 transition-all">
          <LuSearch className="text-gray-400 text-lg" />
          <input
            type="search"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 focus:ring-0"
          />
        </form>

        <div className="flex items-center gap-2 bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
          <button onClick={() => setIsCardView(true)} className={`p-2 rounded-md transition-colors ${isCardView ? "bg-gray-100 text-[#188155]" : "text-gray-400 hover:text-gray-700"}`}>
            <FaThLarge />
          </button>
          <button onClick={() => setIsCardView(false)} className={`p-2 rounded-md transition-colors ${!isCardView ? "bg-gray-100 text-[#188155]" : "text-gray-400 hover:text-gray-700"}`}>
            <FaList />
          </button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading applications...</p>}

      {/* ================== GRID VIEW (CARDS) ================== */}
      {!isLoading && isCardView ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          
          {visibleJobs.map((job) => (
            <div
              key={job.id}
              className={`bg-white rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[240px] transition-all hover:shadow-md cursor-pointer ${
                job.status?.toLowerCase() === 'offered' ? 'border-2 border-[#188155]' : 'border border-gray-100'
              }`}
              onClick={() => handleOpenEditModal(job)}
            >
              {/* Card Header: Logo & Badge */}
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 bg-[#14233c] text-white rounded-xl flex items-center justify-center text-xs font-bold shrink-0">
                  {/* Thay thế bằng ảnh Logo nếu có: <img src={job.logo} ... /> */}
                  LOGO
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getBadgeStyle(job.status)}`}>
                  {job.status || "APPLIED"}
                </span>
              </div>

              {/* Card Body: Info */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 truncate">{job.jobTitle}</h3>
                <p className="text-sm text-gray-500 truncate">{job.companyName} • {job.location || "Remote"}</p>
              </div>

              {/* Card Footer: Date & Actions */}
              <div className="flex justify-between items-end mt-auto pt-4 border-t border-gray-50">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Applied On</p>
                  <p className="text-xs font-semibold text-gray-600">{formatDate(job.applicationDate)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteJob(job); }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete Application"
                  >
                    <FaTrashAlt />
                  </button>
                  <span className="text-sm font-bold text-[#188155] hover:underline">
                    {job.status?.toLowerCase() === 'offered' ? 'View Offer' : 'View Details'}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Special Card: Find More Jobs */}
          <Link
            to="/candidate/job"
            className="bg-[#fbfcfa] rounded-2xl p-6 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center h-[240px] cursor-pointer hover:bg-white hover:border-[#188155] transition-all group"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-emerald-50 group-hover:text-[#188155] mb-4 transition-colors">
              <FaPlus size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#188155]">Find more jobs</h3>
            <p className="text-sm text-gray-500 mt-1">Apply more</p>
          </Link>

        </div>
      ) : null}

      {/* ================== LIST VIEW (TABLE) ================== */}
      {!isLoading && !isCardView ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4"></th>
                  <th className="px-6 py-4 font-bold">Title</th>
                  <th className="px-6 py-4 font-bold">Company</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-center w-12">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-[#188155] border-gray-300 rounded focus:ring-[#188155]"
                        checked={checkedJobIds.includes(job.id)}
                        onChange={() => handleCheckJob(job.id)}
                      />
                    </td>
                    <td className="px-6 py-4 cursor-pointer font-bold text-gray-900" onClick={() => handleOpenEditModal(job)}>
                      {job.jobTitle}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{job.companyName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getBadgeStyle(job.status)}`}>
                        {job.status || "APPLIED"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{formatDate(job.applicationDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {checkedJobIds.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
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

      {/* --- MODALS --- */}
      {showJobModal && (
        <AddNewJobs setJobModal={setShowJobModal} onAddJob={handleAddJob} />
      )}

      {showEditModal && selectedJob && (
        <EditJobModal
          job={selectedJob}
          setEditModal={setShowEditModal}
          onEditJob={handleEditJob}
        />
      )}

    </div>
  );
};

export default Applications;