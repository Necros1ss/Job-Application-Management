import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import TopBar from "../../Components/TopBar";
import { FaMapMarker, FaBuilding, FaArrowUp } from "react-icons/fa";
import { 
  FaCheckCircle, FaRegBookmark, FaBookmark, FaRegCalendarAlt, 
  FaRegMoneyBillAlt, FaBriefcase, FaLink, FaTwitter, FaLinkedinIn,
  FaHome, FaHeartbeat, FaMoneyBillWave, FaDumbbell
} from "react-icons/fa";

import { applyFromJob, usersApi, jobPostsApi, savedJobsApi, applicationsApi, tokenStorage } from "../../lib/api";
import FormApply from "./FormApply";
import { formatMessageTime } from '../../utils/format';
import { showError, showSuccess } from "../../utils/toast";

const JobDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentRole = tokenStorage.getRole() === "recruiter" ? "recruiter" : "candidate";
  const isRecruiterView = currentRole === "recruiter";
  // State của bạn
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [jobs, setJobs] = useState([]);
  const [jobDetail, setJobDetail] = useState("");
  const [savingJobIds, setSavingJobIds] = useState(new Set());
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [savedJobIdMap, setSavedJobIdMap] = useState(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [recruiterStatus, setRecruiterStatus] = useState("open");

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");

  const currentIndustry = (jobDetail?.industry || "").trim().toLowerCase();
  const similarJobs = jobs
    .filter((job) => {
      if (!currentIndustry) return false;
      const jobIndustry = (job?.industry || "").trim().toLowerCase();
      return jobIndustry === currentIndustry && Number(job?.id) !== Number(id);
    })
    .slice(0, 3);

  const getJobInitials = (title = "") => {
    const words = title.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "JB";
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const isRecentJob = (createdAt) => {
    if (!createdAt) return false;
    const createdDate = new Date(createdAt);
    if (Number.isNaN(createdDate.getTime())) return false;
    const now = new Date();
    const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  const handleSaveClick = async (jobId) => {
    if (!jobId || savingJobIds.has(jobId)) return;
    setSavingJobIds((prev) => new Set([...prev, jobId]));
    try {
      if (savedJobIds.has(jobId)) {
        const savedId = savedJobIdMap.get(jobId);
        if (savedId) {
          await savedJobsApi.remove(savedId);
        }
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
        setSavedJobIdMap((prev) => {
          const next = new Map(prev);
          next.delete(jobId);
          return next;
        });
      } else {
        const saved = await savedJobsApi.save(jobId);
        const savedPayload = Array.isArray(saved) ? saved[0] : saved;
        const savedId = Number(savedPayload?.id);
        setSavedJobIds((prev) => new Set([...prev, jobId]));
        if (Number.isInteger(savedId) && savedId > 0) {
          setSavedJobIdMap((prev) => {
            const next = new Map(prev);
            next.set(jobId, savedId);
            return next;
          });
        }
      }
    } catch (error) {
      showError(error.message || "Failed to update saved job");
    } finally {
      setSavingJobIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  const normalizeMultilineText = (value) => {
    if (typeof value !== "string" || value.trim().length === 0) return "Null";
    return value.replace(/\\n/g, "\n");
  };

  const checkDeadline = (value) => {
    if (!value) return false;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsed.setHours(0, 0, 0, 0);
    return parsed < today;
  }

  const toIsoDate = (date) => date.toISOString().split("T")[0];

  const getDeadlineByStatus = (status) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (status === "closed") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return toIsoDate(yesterday);
    }
    return null;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await usersApi.me();
        setUserName(response.name);
        setUserEmail(response.email);
        setJobs(await jobPostsApi.list());
      } catch (error) {
        showError(error.message || "Failed to load profile");
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        const data = await jobPostsApi.getById(id); 
        setJobDetail(data); 
      } catch (error) {
        showError(error.message || "Failed to load job detail");
      }
    };
    fetchJobDetail();
  }, [id]);

  useEffect(() => {
    if (!id || isRecruiterView) return;
    const fetchAppliedStatus = async () => {
    try {
      const apps = await applicationsApi.list();
      const alreadyApplied = apps.some(
        (app) => Number(app.jobPostId) === Number(id)
      );
      setIsApplied(alreadyApplied);
    } catch (error) {
      showError(error.message || "Failed to check application status");
      setIsApplied(false);
    }
  };
    fetchAppliedStatus();
  }, [id, isRecruiterView]);

  useEffect(() => {
    if (!isRecruiterView) return;
    setRecruiterStatus(checkDeadline(jobDetail?.deadline) ? "closed" : "open");
  }, [jobDetail, isRecruiterView]);

  useEffect(() => {
    if (isRecruiterView) return;

    let mounted = true;
    const loadSavedJobs = async () => {
      try {
        const savedList = await savedJobsApi.list();
        if (!mounted) return;

        const nextSavedIds = new Set();
        const nextSavedMap = new Map();

        (Array.isArray(savedList) ? savedList : []).forEach((item) => {
          const jobId = Number(item.jobPostId ?? item.jobId);
          const savedId = Number(item.id);
          if (Number.isInteger(jobId) && jobId > 0) {
            nextSavedIds.add(jobId);
            if (Number.isInteger(savedId) && savedId > 0) {
              nextSavedMap.set(jobId, savedId);
            }
          }
        });

        setSavedJobIds(nextSavedIds);
        setSavedJobIdMap(nextSavedMap);
      } catch (error) {
        showError(error.message || "Failed to load saved jobs");
      }
    };

    loadSavedJobs();
    return () => {
      mounted = false;
    };
  }, [isRecruiterView]);

  const isSaved = savedJobIds.has(jobDetail?.id);
  const isClosed = checkDeadline(jobDetail?.deadline);
  const currentRecruiterStatus = isClosed ? "closed" : "open";
  const hasStatusChanged = recruiterStatus !== currentRecruiterStatus;

  const handleRecruiterStatusSave = async () => {
    if (!isRecruiterView || !jobDetail?.id || !hasStatusChanged) return;

    const nextDeadline = getDeadlineByStatus(recruiterStatus);

    setIsUpdatingStatus(true);
    try {
      await jobPostsApi.update(jobDetail.id, {
        title: jobDetail?.title || "Untitled Job",
        description: jobDetail?.description || "",
        location: jobDetail?.location || "",
        salary: jobDetail?.salary || "",
        experience: jobDetail?.experience || "",
        employment_type: jobDetail?.employment_type || "",
        deadline: nextDeadline,
        responsibilities: jobDetail?.responsibilities || "",
        requirements: jobDetail?.requirements || "",
      });

      setJobDetail((prev) => ({
        ...prev,
        deadline: nextDeadline,
      }));
      showSuccess("Job status saved.");
    } catch (error) {
      setRecruiterStatus(currentRecruiterStatus);
      showError(error.message || "Failed to update job status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  let buttonText = "Apply Now";
  let applyButtonClass = "flex-1 md:flex-none flex items-center justify-center px-8 py-2.5 font-semibold rounded-lg transition shadow-sm text-white ";
  if (isApplied) {
    buttonText = "Applied";
    applyButtonClass += "bg-gray-400 cursor-not-allowed"; 
  } 
  else if (isClosed) {
    buttonText = "Expired";
    applyButtonClass += "bg-red-500 cursor-not-allowed"; 
  } 
  else {
    applyButtonClass += "bg-emerald-500 hover:bg-emerald-600"; 
  }

  return (
    <div className='min-h-screen bg-gray-50 text-gray-800 font-sans'>
      {/* Breadcrumb */}
      <TopBar userName={userName} userEmail={userEmail} roleOverride={currentRole} />

      <div className="max-w-6xl mx-auto px-6 pt-6 pb-4 text-sm text-gray-500">
        <span className= "hover:text-emerald-700 transition-colors">Jobs Detail</span> 
        <span className="mx-2"> / </span>
        <span className="text-gray-900 font-medium">{jobDetail?.title || "Senior UI/UX Designer"}</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12 flex flex-col gap-6">
        
        {/* ================= HERO CARD (Top Section) ================= */}
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center border border-gray-100 p-2 overflow-hidden shadow-sm">
              <img 
                src={jobDetail?.companyLogo || "https://api.dicebear.com/8.x/initials/svg?seed=ES&backgroundColor=e0f2fe&textColor=0369a1"} 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {jobDetail?.title || "Senior UI/UX Designer"}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <FaBuilding className="text-gray-400" />
                  {jobDetail?.companyName || "EcoSphere Solutions"}
                </span>
                <span className="flex items-center gap-1.5">
                  <FaMapMarker className="text-gray-400" />
                  {jobDetail?.location || "Oslo, Norway (Remote)"}
                </span>
                <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase">
                  Full Time
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
            {isRecruiterView ? (
              <div className="flex-1 md:flex-none min-w-[220px]">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Job Status
                </label>
                <div className="relative flex items-center gap-2">
                  <select
                    value={recruiterStatus}
                    onChange={(e) => setRecruiterStatus(e.target.value)}
                    disabled={isUpdatingStatus}
                    className={`w-full appearance-none px-3.5 py-2.5 rounded-lg border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                      recruiterStatus === "closed"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    } ${isUpdatingStatus ? "opacity-70 cursor-wait" : "cursor-pointer"}`}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleRecruiterStatusSave}
                    disabled={isUpdatingStatus || !hasStatusChanged}
                    className="px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUpdatingStatus ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => handleSaveClick(jobDetail?.id)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 border font-semibold rounded-lg transition ${
                    isSaved
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {isSaved ? <FaBookmark className="text-emerald-600" /> : <FaRegBookmark />} 
                  {isSaved ? "Saved" : "Save Job"}
                </button>
                <button 
                  disabled={isClosed || isLoading || isApplied}
                  onClick={() => setShowApplyModal(true)}
                  className={applyButtonClass}
                >
                  {isLoading ? "Processing..." : buttonText}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ================= MAIN CONTENT LAYOUT ================= */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT COLUMN (2/3 width) */}
          <div className="w-full lg:w-2/3 space-y-6">
            
            {/* Job Description */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900">Job Description</h2>
              </div>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                {normalizeMultilineText(jobDetail?.description)}
              </div>
            </div>

            {/* Key Responsibilities */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900">Key Responsibilities</h2>
              </div>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                {normalizeMultilineText(jobDetail?.responsibilities)}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900">Requirements</h2>
              </div>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                {normalizeMultilineText(jobDetail?.requirements)}
              </div>
            </div>

            {/* Perks & Benefits */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900">Perks & Benefits</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-lg"><FaHome /></div>
                  <span className="font-semibold text-gray-800">100% Remote Work</span>
                </div>
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-lg"><FaHeartbeat /></div>
                  <span className="font-semibold text-gray-800">Health & Dental</span>
                </div>
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-lg"><FaMoneyBillWave /></div>
                  <span className="font-semibold text-gray-800">Competitive Equity</span>
                </div>
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-lg"><FaDumbbell /></div>
                  <span className="font-semibold text-gray-800">Wellness Stipend</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (1/3 width - Sidebar) */}
          <div className="w-full lg:w-1/3 space-y-6">
            
            {/* About Company */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">About Company</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 p-2">
                  <img src={jobDetail?.companyLogo || "https://api.dicebear.com/8.x/initials/svg?seed=ES&backgroundColor=e0f2fe&textColor=0369a1"} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{jobDetail?.companyName || "Company Name"}</h4>
                  <p className="text-sm text-gray-500">{jobDetail?.address || "Address"}</p>
                </div>
              </div>
              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">Industry</span>
                  <span className="font-semibold text-gray-800">{jobDetail?.industry || ""}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-semibold text-gray-800">{jobDetail?.phone || "Phone"}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-gray-500">Website</span>
                  <a href="#" className="font-semibold text-emerald-600 hover:underline">{jobDetail?.website || "Phone"}</a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/jobs/${id}/company`, {
                  state: {
                    company: {
                      id: jobDetail?.id,
                      name: jobDetail?.companyName,
                      logo: jobDetail?.companyLogo,
                      industry: jobDetail?.industry,
                      location: jobDetail?.location,
                      address: jobDetail?.address,
                      jobTitle: jobDetail?.title,
                      salary: jobDetail?.salary,
                    },
                  },
                })}
                className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold rounded-lg transition border border-gray-200"
              >
                View Profile
              </button>
            </div>

            {/* Quick Overview */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">Quick Overview</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-lg shrink-0">
                    <FaArrowUp size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-0.5">Experience</p>
                    <p className="font-bold text-gray-900">{jobDetail?.experience || "Null"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-lg shrink-0">
                    <FaBriefcase size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-0.5">Employment Type</p>
                    <p className="font-bold text-gray-900">{jobDetail?.employment_type || "Null"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-lg shrink-0">
                    <FaRegMoneyBillAlt size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-0.5">Salary Range</p>
                    <p className="font-bold text-gray-900">{jobDetail?.salary || "Null"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-lg shrink-0">
                    <FaRegCalendarAlt size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-0.5">Deadline</p>
                    <p className="font-bold text-gray-900">{formatMessageTime(jobDetail?.deadline)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Share this Job */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Share this Job</h3>
              <div className="flex gap-3">
                <button className="flex-1 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition"><FaLink /></button>
                <button className="flex-1 h-10 flex items-center justify-center bg-[#1DA1F2] text-white rounded-lg hover:bg-blue-500 transition"><FaTwitter /></button>
                <button className="flex-1 h-10 flex items-center justify-center bg-[#0A66C2] text-white rounded-lg hover:bg-blue-700 transition"><FaLinkedinIn /></button>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Recommendation</p>
              <h2 className="text-2xl font-bold text-gray-900">Similar Jobs for You</h2>
            </div>
            <a href="#" className="text-emerald-600 font-semibold hover:underline flex items-center gap-1">
              View all listings <span className="text-lg">→</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarJobs.length > 0 ? (
              similarJobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition text-left cursor-pointer flex flex-col justify-between h-52"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center p-1.5 text-emerald-700 font-bold text-xs">
                        {getJobInitials(job.title)}
                      </div>
                      {isRecentJob(job.createdAt) ? (
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-bold uppercase">New</span>
                      ) : null}
                    </div>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{job.title}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1 line-clamp-1"><FaMapMarker size={14} /> {job.location || "Remote"}</p>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="font-bold text-gray-900">{job.salary || "Salary on request"}</span>
                    <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">›</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-3 bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
                No similar jobs found in the same industry yet.
              </div>
            )}
          </div>
        </div>
        <FormApply 
          isOpen={showApplyModal} 
          onClose={() => setShowApplyModal(false)} 
          jobDetail={jobDetail} 
          onSuccess={() => setIsApplied(true)}
        />
      </div>
    </div>
  );
}

export default JobDetail;
