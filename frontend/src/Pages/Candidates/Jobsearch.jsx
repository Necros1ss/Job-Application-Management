import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaBriefcase, FaSearch, FaMapMarker, FaClock, FaDollarSign,
  FaRegBookmark, FaBookmark, FaTimes, FaSlidersH,
  FaChevronDown, FaChevronUp, FaEdit, FaTrashAlt,
  FaEye, FaFilter, FaArrowsAltV, FaCheck, FaPlus,
  FaUsers, FaCalendar, FaCheckCircle, FaRegCalendarAlt,
  FaMailBulk, FaDownload, FaArrowLeft, FaLock, FaUserCircle
} from "react-icons/fa";
import { jobPostsApi, savedJobsApi, usersApi } from "../../lib/api";
import TopBarDashboard from "../../Components/TopBarDashboard";
import { showError, showSuccess } from "../../utils/toast";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const LOCATIONS = ["Remote", "On-site", "Hybrid"];
const SALARY_RANGES = [
  { label: "Any", value: "" },
  { label: "Under $30k", value: "0-30000" },
  { label: "$30k - $60k", value: "30000-60000" },
  { label: "$60k - $100k", value: "60000-100000" },
  { label: "$100k+", value: "100000-999999999" },
];

const RECENT_SEARCHES_KEY = "jobtracker_recent_searches";
const MAX_RECENT = 5;

const getRecentSearches = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveRecentSearch = (term) => {
  if (!term.trim()) return;
  const existing = getRecentSearches().filter((s) => s !== term.trim());
  const updated = [term.trim(), ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
};

const removeRecentSearch = (term) => {
  const updated = getRecentSearches().filter((s) => s !== term);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
};

const parseSalary = (salaryStr) => {
  if (!salaryStr) return 0;
  const match = salaryStr.match(/\d+/g);
  if (!match) return 0;
  return parseInt(match[0].replace(/,/g, ""), 10);
};

const Jobsearch = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [savingJobIds, setSavingJobIds] = useState(new Set());
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [savedJobIdMap, setSavedJobIdMap] = useState(new Map());

  const [showFilters, setShowFilters] = useState(false);
  const [selectedJobType, setSelectedJobType] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedSalary, setSelectedSalary] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);

  const searchInputRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await usersApi.me();
        setUserName(profile.name || "");
        setUserEmail(profile.email || "");
      } catch (_) {}
    };
    loadProfile();
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 350);
    return () => clearTimeout(debounceTimer.current);
  }, [searchTerm]);

  useEffect(() => {
    const loadJobs = async () => {
      setIsLoading(true);
      try {
        const [jobsData, savedData] = await Promise.all([
          jobPostsApi.list(debouncedSearch),
          savedJobsApi.list(),
        ]);
        const normalizedJobs = (Array.isArray(jobsData) ? jobsData : []).map((job) => ({
          ...job,
          id: Number(job.id),
        }));
        setJobs(normalizedJobs);
        const nextSavedIds = new Set();
        const nextSavedMap = new Map();
        savedData.forEach((item) => {
          const jobId = Number(item.jobPostId ?? item.jobId);
          const savedId = Number(item.id);
          if (Number.isInteger(jobId) && jobId > 0 && Number.isInteger(savedId) && savedId > 0) {
            nextSavedIds.add(jobId);
            nextSavedMap.set(jobId, savedId);
          }
        });
        setSavedJobIds(nextSavedIds);
        setSavedJobIdMap(nextSavedMap);
        setErrorMessage("");
      } catch (error) {
        setErrorMessage(error.message || "Failed to load jobs");
      } finally {
        setIsLoading(false);
      }
    };
    loadJobs();
  }, [debouncedSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      saveRecentSearch(searchTerm.trim());
      setRecentSearches(getRecentSearches());
    }
  };

  const handleRecentSearchClick = (term) => setSearchTerm(term);

  const handleRemoveRecent = (term, e) => {
    e.stopPropagation();
    removeRecentSearch(term);
    setRecentSearches(getRecentSearches());
  };

  const handleClearRecent = () => {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecentSearches([]);
  };

  const handleSaveClick = async (jobId) => {
    if (savingJobIds.has(jobId)) return;
    setSavingJobIds((prev) => new Set([...prev, jobId]));
    try {
      if (savedJobIds.has(jobId)) {
        const savedId = savedJobIdMap.get(jobId);
        if (savedId) {
          await savedJobsApi.remove(savedId);
        }
        setSavedJobIds((prev) => {
          const n = new Set(prev);
          n.delete(jobId);
          return n;
        });
        setSavedJobIdMap((prev) => {
          const n = new Map(prev);
          n.delete(jobId);
          return n;
        });
        showSuccess("Job removed from saved jobs");
      } else {
        const saved = await savedJobsApi.save(jobId);
        const savedPayload = Array.isArray(saved) ? saved[0] : saved;
        const savedId = Number(savedPayload?.id);
        setSavedJobIds((prev) => new Set([...prev, jobId]));
        if (Number.isInteger(savedId) && savedId > 0) {
          setSavedJobIdMap((prev) => {
            const n = new Map(prev);
            n.set(jobId, savedId);
            return n;
          });
        }
        showSuccess("Job saved successfully");
      }
    } catch (error) {
      showError(error.message || "Failed to update saved job");
    } finally {
      setSavingJobIds((prev) => { const n = new Set(prev); n.delete(jobId); return n; });
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (selectedJobType && job.employment_type?.toLowerCase() !== selectedJobType.toLowerCase()) return false;
      if (selectedLocation) {
        const loc = (job.location || "").toLowerCase();
        if (selectedLocation === "Remote" && !loc.includes("remote") && !loc.includes("work from")) return false;
        if (selectedLocation === "On-site" && (loc.includes("remote") || loc.includes("hybrid"))) return false;
        if (selectedLocation === "Hybrid" && !loc.includes("hybrid")) return false;
      }
      if (selectedSalary) {
        const salary = parseSalary(job.salary);
        const [min, max] = selectedSalary.split("-").map(Number);
        if (salary < min || salary > max) return false;
      }
      return true;
    });
  }, [jobs, selectedJobType, selectedLocation, selectedSalary]);

  const hasActiveFilters = !!(selectedJobType || selectedLocation || selectedSalary);

  const clearAllFilters = () => {
    setSelectedJobType("");
    setSelectedLocation("");
    setSelectedSalary("");
  };

  const activeFilterCount = [selectedJobType, selectedLocation, selectedSalary].filter(Boolean).length;

  const isNewJob = (createdAt) => {
    if (!createdAt) return false;
    return (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 3;
  };

  return (
    <div className="min-h-screen bg-[#fbfcfa]">
      <TopBarDashboard userName={userName} 
      userEmail={userEmail} 
      searchValue={searchTerm} 
      onSearchChange={setSearchTerm} 
      showSearch={false}
      searchPlaceholder="Search jobs, companies, locations..." />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-4 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Find Your Dream Job</h1>
          <p className="text-gray-500">
            {isLoading ? "Searching..." : `${filteredJobs.length} jobs found`}
            {debouncedSearch && ` for "${debouncedSearch}"`}
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Job title, company, or location..."
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all shadow-sm"
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <FaTimes size={18} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-xl border font-semibold text-sm transition-all ${showFilters || hasActiveFilters ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <FaSlidersH size={18} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </form>

        {!searchTerm && recentSearches.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Searches</p>
              <button onClick={handleClearRecent} className="text-xs text-gray-400 hover:text-gray-600">Clear all</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleRecentSearchClick(term)}
                  className="group flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                >
                  <FaClock size={13} className="text-gray-400" />
                  {term}
                  <span onClick={(e) => handleRemoveRecent(term, e)} className="ml-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FaTimes size={12} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {showFilters && (
          <div className="mb-8 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Filters</h3>
              {hasActiveFilters && <button onClick={clearAllFilters} className="text-sm text-emerald-600 hover:underline font-medium">Clear all</button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Job Type</label>
                <div className="space-y-2">
                  {JOB_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="jobType" value={type} checked={selectedJobType === type}
                        onChange={() => setSelectedJobType(selectedJobType === type ? "" : type)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" />
                      <span className="text-sm text-gray-700 group-hover:text-emerald-700 transition-colors">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Work Location</label>
                <div className="space-y-2">
                  {LOCATIONS.map((loc) => (
                    <label key={loc} className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="location" value={loc} checked={selectedLocation === loc}
                        onChange={() => setSelectedLocation(selectedLocation === loc ? "" : loc)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" />
                      <span className="text-sm text-gray-700 group-hover:text-emerald-700 transition-colors">{loc}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Salary Range</label>
                <div className="space-y-2">
                  {SALARY_RANGES.map(({ label, value }) => (
                    <label key={value} className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="salary" value={value} checked={selectedSalary === value}
                        onChange={() => setSelectedSalary(selectedSalary === value ? "" : value)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" />
                      <span className="text-sm text-gray-700 group-hover:text-emerald-700 transition-colors">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{errorMessage}</div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-xl" />
                  <div className="w-20 h-6 bg-gray-100 rounded-full" />
                </div>
                <div className="w-3/4 h-5 bg-gray-100 rounded mb-2" />
                <div className="w-1/2 h-4 bg-gray-100 rounded mb-4" />
                <div className="w-full h-3 bg-gray-100 rounded mb-2" />
                <div className="w-2/3 h-3 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBriefcase size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500 mb-6">
              {hasActiveFilters || debouncedSearch ? "Try adjusting your search or filters" : "Check back later for new opportunities"}
            </p>
            {(hasActiveFilters || debouncedSearch) && (
              <button onClick={() => { setSearchTerm(""); clearAllFilters(); searchInputRef.current?.focus(); }}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredJobs.map((job) => {
              const normalizedJobId = Number(job.id);
              const isSaved = Number.isInteger(normalizedJobId) && savedJobIds.has(normalizedJobId);
              const isSaving = Number.isInteger(normalizedJobId) && savingJobIds.has(normalizedJobId);

              return (
              <div key={job.id} className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-200 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center border border-emerald-100 overflow-hidden shrink-0">
                    {job.companyLogo ? (
                      <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-lg font-bold text-emerald-700">{(job.companyName || "J").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {isNewJob(job.createdAt) && (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full">New</span>
                    )}
                    <button onClick={() => handleSaveClick(normalizedJobId)} disabled={isSaving}
                      className={`p-1.5 rounded-lg transition-colors ${isSaved ? "text-emerald-600 hover:text-emerald-700" : "text-gray-300 hover:text-emerald-600"}`}
                      title={isSaved ? "Unsave job" : "Save job"}>
                      {isSaved ? <FaBookmark size={20} /> : <FaRegBookmark size={20} />}
                    </button>
                  </div>
                </div>
                <button onClick={() => navigate(`/jobs/${job.id}`)} className="text-left flex-1 group/job">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover/job:text-emerald-700 transition-colors line-clamp-1">{job.title || "Job Title"}</h3>
                  <p className="text-sm text-gray-500 mb-3">{job.companyName || "Company"}</p>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500"><FaMapMarker size={14} className="shrink-0" /><span className="truncate">{job.location || "Location not specified"}</span></div>
                    {job.salary && <div className="flex items-center gap-2 text-sm text-gray-500"><FaDollarSign size={14} className="shrink-0" /><span>{job.salary}</span></div>}
                    {job.employment_type && <div className="flex items-center gap-2 text-sm text-gray-500"><FaBriefcase size={14} className="shrink-0" /><span>{job.employment_type}</span></div>}
                  </div>
                </button>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                  <span className="text-xs text-gray-400">
                    {job.createdAt ? `Posted ${new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                  </span>
                  <button onClick={() => navigate(`/jobs/${job.id}`)} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">View Details</button>
                </div>
              </div>
            )})}
          </div>
        )}

        {!isLoading && filteredJobs.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-gray-400 text-sm">Showing {filteredJobs.length} of {jobs.length} jobs</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobsearch;
