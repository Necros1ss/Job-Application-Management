/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaBookmark,
  FaBriefcase,
  FaChevronDown,
  FaDollarSign,
  FaFilter,
  FaMapMarker,
  FaRegBookmark,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import { jobPostsApi, savedJobsApi, usersApi } from "../../lib/api/index";
import { SkeletonCard } from "../../Components/Skeleton";
import Pagination from "../../Components/Pagination";
import EmptyState from "../../Components/EmptyState";
import useDebouncedValue from "../../hooks/useDebounce";
import { showError, showSuccess } from "../../utils/toast";

const JOBS_PER_PAGE = 10;

const EMPLOYMENT_TYPES = [
  { label: "All", value: "" },
  { label: "Full-time", value: "full-time" },
  { label: "Part-time", value: "part-time" },
  { label: "Contract", value: "contract" },
  { label: "Internship", value: "internship" },
];

const EXPERIENCE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Entry", value: "0-1 years" },
  { label: "Mid", value: "1-3 years" },
  { label: "Senior", value: "3-5 years" },
  { label: "Lead", value: "5+ years" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Deadline soonest", value: "deadline" },
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeJob = (job) => ({
  ...job,
  id: Number(job.id),
  employmentType: job.employment_type || job.employmentType || "",
});

const isNewJob = (createdAt) => {
  if (!createdAt) return false;
  return (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 3;
};

const getFiltersFromParams = (searchParams) => ({
  search: searchParams.get("search") || "",
  location: searchParams.get("location") || "",
  employment_type: searchParams.get("employment_type") || "",
  experience: searchParams.get("experience") || "",
  salary_min: searchParams.get("salary_min") || "",
  salary_max: searchParams.get("salary_max") || "",
  sort: searchParams.get("sort") || "newest",
  page: Math.max(Number(searchParams.get("page")) || 1, 1),
});

const Highlight = ({ text = "", query = "" }) => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return text;
  }

  const parts = String(text).split(new RegExp(`(${escapeRegExp(normalizedQuery)})`, "gi"));
  return parts.map((part, index) =>
    part.toLowerCase() === normalizedQuery.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-[var(--bg-secondary)] px-0.5 text-[var(--text-primary)]">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
};

const FilterSelect = ({ label, value, onChange, options }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{label}</span>
    <span className="relative block">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 pr-9 text-sm font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] focus:ring-2 focus:ring-black/10"
      >
        {options.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={12} />
    </span>
  </label>
);

const FilterPanel = ({
  filters,
  searchDraft,
  locationDraft,
  onSearchChange,
  onLocationChange,
  onFilterChange,
  onClear,
  hasActiveFilters,
}) => (
  <div className="space-y-5">
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Search</label>
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={15} />
        <input
          type="text"
          value={searchDraft}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Title, company, keywords..."
          className="h-11 w-full rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-elevated)] pl-9 pr-9 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--text-primary)] focus:ring-2 focus:ring-black/10"
        />
        {searchDraft && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Clear search"
          >
            <FaTimes size={13} />
          </button>
        )}
      </div>
    </div>

    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Location</label>
      <div className="relative">
        <FaMapMarker className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={15} />
        <input
          type="text"
          value={locationDraft}
          onChange={(event) => onLocationChange(event.target.value)}
          placeholder="City, remote, hybrid..."
          className="h-11 w-full rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-elevated)] pl-9 pr-9 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--text-primary)] focus:ring-2 focus:ring-black/10"
        />
        {locationDraft && (
          <button
            type="button"
            onClick={() => onLocationChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Clear location"
          >
            <FaTimes size={13} />
          </button>
        )}
      </div>
    </div>

    <FilterSelect
      label="Employment Type"
      value={filters.employment_type}
      onChange={(value) => onFilterChange("employment_type", value)}
      options={EMPLOYMENT_TYPES}
    />

    <FilterSelect
      label="Experience"
      value={filters.experience}
      onChange={(value) => onFilterChange("experience", value)}
      options={EXPERIENCE_OPTIONS}
    />

    <div>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Salary</span>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          min="0"
          value={filters.salary_min}
          onChange={(event) => onFilterChange("salary_min", event.target.value)}
          placeholder="Min"
          className="h-11 rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--text-primary)] focus:ring-2 focus:ring-black/10"
        />
        <input
          type="number"
          min="0"
          value={filters.salary_max}
          onChange={(event) => onFilterChange("salary_max", event.target.value)}
          placeholder="Max"
          className="h-11 rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--text-primary)] focus:ring-2 focus:ring-black/10"
        />
      </div>
    </div>

    <FilterSelect
      label="Sort by"
      value={filters.sort}
      onChange={(value) => onFilterChange("sort", value)}
      options={SORT_OPTIONS}
    />

    {hasActiveFilters && (
      <button
        type="button"
        onClick={onClear}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-elevated)] text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--text-primary)]"
      >
        <FaTimes size={13} />
        Clear All Filters
      </button>
    )}
  </div>
);

const Jobsearch = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => getFiltersFromParams(searchParams), [searchParams]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [locationDraft, setLocationDraft] = useState(filters.location);
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [savingJobIds, setSavingJobIds] = useState(new Set());
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [savedJobIdMap, setSavedJobIdMap] = useState(new Map());
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const lastSearchParamRef = useRef(filters.search);
  const lastLocationParamRef = useRef(filters.location);
  const debouncedSearch = useDebouncedValue(searchDraft, 400);
  const debouncedLocation = useDebouncedValue(locationDraft, 400);

  const updateFilters = useCallback((updates) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "" || (key === "sort" && value === "newest")) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });

      if (!Object.prototype.hasOwnProperty.call(updates, "page")) {
        next.delete("page");
      }

      return next;
    });
  }, [setSearchParams]);

  useEffect(() => {
    if (filters.search !== lastSearchParamRef.current) {
      lastSearchParamRef.current = filters.search;
      setSearchDraft(filters.search);
    }
  }, [filters.search]);

  useEffect(() => {
    if (filters.location !== lastLocationParamRef.current) {
      lastLocationParamRef.current = filters.location;
      setLocationDraft(filters.location);
    }
  }, [filters.location]);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      lastSearchParamRef.current = debouncedSearch;
      updateFilters({ search: debouncedSearch });
    }
  }, [debouncedSearch, filters.search, updateFilters]);

  useEffect(() => {
    if (debouncedLocation !== filters.location) {
      lastLocationParamRef.current = debouncedLocation;
      updateFilters({ location: debouncedLocation });
    }
  }, [debouncedLocation, filters.location, updateFilters]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await usersApi.me();
        setUserName(profile.name || "");
        setUserEmail(profile.email || "");
      } catch (error) {
        showError(error.message || "Failed to load profile");
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadJobs = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [jobsData, savedData] = await Promise.all([
          jobPostsApi.listPaginated({
            ...filters,
            limit: JOBS_PER_PAGE,
          }),
          savedJobsApi.list(),
        ]);

        if (!mounted) return;

        const jobItems = Array.isArray(jobsData) ? jobsData : jobsData.data || [];
        const normalizedJobs = jobItems.map(normalizeJob);
        const nextSavedIds = new Set();
        const nextSavedMap = new Map();

        (Array.isArray(savedData) ? savedData : []).forEach((item) => {
          const jobId = Number(item.jobPostId ?? item.jobId);
          const savedId = Number(item.id);
          if (Number.isInteger(jobId) && jobId > 0 && Number.isInteger(savedId) && savedId > 0) {
            nextSavedIds.add(jobId);
            nextSavedMap.set(jobId, savedId);
          }
        });

        setJobs(normalizedJobs);
        setTotalJobs(Array.isArray(jobsData) ? normalizedJobs.length : Number(jobsData.total || 0));
        setTotalPages(Array.isArray(jobsData) ? 1 : Math.max(Number(jobsData.totalPages || 1), 1));
        setSavedJobIds(nextSavedIds);
        setSavedJobIdMap(nextSavedMap);
      } catch (error) {
        if (!mounted) return;
        const message = error.message || "Failed to load jobs";
        setJobs([]);
        setTotalJobs(0);
        setTotalPages(1);
        setErrorMessage(message);
        showError(message);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadJobs();

    return () => {
      mounted = false;
    };
  }, [filters]);

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.location ||
      filters.employment_type ||
      filters.experience ||
      filters.salary_min ||
      filters.salary_max ||
      (filters.sort && filters.sort !== "newest")
  );

  const activeFilterCount = [
    filters.search,
    filters.location,
    filters.employment_type,
    filters.experience,
    filters.salary_min || filters.salary_max,
    filters.sort !== "newest" ? filters.sort : "",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchDraft("");
    setLocationDraft("");
    setSearchParams(new URLSearchParams());
    setIsMobileFiltersOpen(false);
  };

  const handleSaveClick = async (jobId) => {
    if (savingJobIds.has(jobId)) return;

    setSavingJobIds((current) => new Set([...current, jobId]));

    try {
      if (savedJobIds.has(jobId)) {
        const savedId = savedJobIdMap.get(jobId);
        if (savedId) {
          await savedJobsApi.remove(savedId);
        }
        setSavedJobIds((current) => {
          const next = new Set(current);
          next.delete(jobId);
          return next;
        });
        setSavedJobIdMap((current) => {
          const next = new Map(current);
          next.delete(jobId);
          return next;
        });
        showSuccess("Job removed from saved jobs");
      } else {
        const saved = await savedJobsApi.save(jobId);
        const savedPayload = Array.isArray(saved) ? saved[0] : saved;
        const savedId = Number(savedPayload?.id);
        setSavedJobIds((current) => new Set([...current, jobId]));
        if (Number.isInteger(savedId) && savedId > 0) {
          setSavedJobIdMap((current) => {
            const next = new Map(current);
            next.set(jobId, savedId);
            return next;
          });
        }
        showSuccess("Job saved successfully");
      }
    } catch (error) {
      showError(error.message || "Failed to update saved job");
    } finally {
      setSavingJobIds((current) => {
        const next = new Set(current);
        next.delete(jobId);
        return next;
      });
    }
  };

  const resultLabel = isLoading
    ? "Searching jobs..."
    : `Tìm thấy ${totalJobs} việc làm${filters.search ? ` cho "${filters.search}"` : ""}`;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-7xl px-6 pb-12 pt-6 lg:px-10">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Job board</p>
            <h1 className="mt-1 text-3xl font-bold text-[var(--text-primary)]">Find roles that fit</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{resultLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-4 text-sm font-semibold text-[var(--text-primary)] shadow-sm lg:hidden"
          >
            <FaFilter size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--text-primary)] px-1 text-[10px] text-[var(--bg-primary)]">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-[10px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="hidden h-fit rounded-[14px] border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-5 shadow-sm lg:block">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Filters</h2>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                  {activeFilterCount} active
                </span>
              )}
            </div>
            <FilterPanel
              filters={filters}
              searchDraft={searchDraft}
              locationDraft={locationDraft}
              onSearchChange={setSearchDraft}
              onLocationChange={setLocationDraft}
              onFilterChange={(key, value) => updateFilters({ [key]: value })}
              onClear={clearAllFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </aside>

          <main>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--text-primary)]">{resultLabel}</p>
              <FilterSelect
                label="Sort"
                value={filters.sort}
                onChange={(value) => updateFilters({ sort: value })}
                options={SORT_OPTIONS}
              />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-[14px] border border-[var(--border-primary)] bg-[var(--bg-elevated)]">
                <EmptyState
                  icon={FaBriefcase}
                  title="No jobs found"
                  description="Try changing your keyword, location, or filters to broaden the search."
                  actionLabel={hasActiveFilters ? "Clear All Filters" : undefined}
                  onAction={hasActiveFilters ? clearAllFilters : undefined}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {jobs.map((job) => {
                  const normalizedJobId = Number(job.id);
                  const isSaved = Number.isInteger(normalizedJobId) && savedJobIds.has(normalizedJobId);
                  const isSaving = Number.isInteger(normalizedJobId) && savingJobIds.has(normalizedJobId);

                  return (
                    <article
                      key={job.id}
                      className="group flex min-h-[320px] flex-col rounded-[14px] border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-5 shadow-sm transition hover:border-[var(--text-primary)] hover:shadow-md"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-lg font-bold text-[var(--text-primary)]">
                            {(job.companyName || "J").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{job.companyName || "Unknown Company"}</p>
                            <p className="truncate text-xs text-[var(--text-secondary)]">{job.industry || "Recruiting team"}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSaveClick(normalizedJobId)}
                          disabled={isSaving}
                          className={`rounded-[10px] p-2 transition ${
                            isSaved ? "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                          } disabled:opacity-60`}
                          aria-label={isSaved ? "Unsave job" : "Save job"}
                        >
                          {isSaved ? <FaBookmark size={18} /> : <FaRegBookmark size={18} />}
                        </button>
                      </div>

                      <button type="button" onClick={() => navigate(`/jobs/${job.id}`)} className="flex flex-1 flex-col text-left">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h3 className="line-clamp-2 text-lg font-bold leading-6 text-[var(--text-primary)] transition group-hover:text-[var(--text-primary)]">
                            <Highlight text={job.title || "Untitled role"} query={filters.search} />
                          </h3>
                          {isNewJob(job.createdAt) && (
                            <span className="shrink-0 rounded-full bg-[var(--bg-secondary)] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--text-primary)]">
                              New
                            </span>
                          )}
                        </div>

                        <p className="mb-4 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
                          <Highlight text={job.description || "No description provided yet."} query={filters.search} />
                        </p>

                        <div className="mt-auto space-y-2">
                          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <FaMapMarker className="shrink-0" size={13} />
                            <span className="truncate">{job.location || "Location not specified"}</span>
                          </div>
                          {job.salary && (
                            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                              <FaDollarSign className="shrink-0" size={13} />
                              <span className="truncate">{job.salary}</span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 pt-2">
                            {job.employmentType && (
                              <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)]">
                                {job.employmentType}
                              </span>
                            )}
                            {job.experience && (
                              <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)]">
                                {job.experience}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="mt-5 flex items-center justify-between border-t border-[var(--border-primary)] pt-4">
                        <span className="text-xs text-[var(--text-secondary)]">
                          {job.deadline
                            ? `Deadline ${new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                            : job.createdAt
                              ? `Posted ${new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                              : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="text-sm font-semibold text-[var(--text-primary)] hover:underline"
                        >
                          View Details
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!isLoading && jobs.length > 0 && (
              <div className="mt-10">
                <Pagination
                  currentPage={filters.page}
                  totalPages={totalPages}
                  onPageChange={(page) => updateFilters({ page })}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/35 lg:hidden">
          <div className="max-h-[88vh] w-full overflow-y-auto rounded-t-[18px] bg-[var(--bg-elevated)] p-5 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Advanced search</p>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Filters</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="rounded-[10px] border border-[var(--border-primary)] p-2 text-[var(--text-secondary)]"
                aria-label="Close filters"
              >
                <FaTimes size={16} />
              </button>
            </div>
            <FilterPanel
              filters={filters}
              searchDraft={searchDraft}
              locationDraft={locationDraft}
              onSearchChange={setSearchDraft}
              onLocationChange={setLocationDraft}
              onFilterChange={(key, value) => updateFilters({ [key]: value })}
              onClear={clearAllFilters}
              hasActiveFilters={hasActiveFilters}
            />
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(false)}
              className="mt-5 h-11 w-full rounded-[10px] bg-[var(--text-primary)] text-sm font-semibold text-[var(--bg-primary)]"
            >
              Show Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobsearch;
