/* eslint-disable react/prop-types */
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch, FaPlus, FaChevronDown, FaChevronUp, FaEdit, FaTrashAlt,
  FaEye, FaFilter, FaArrowsAltV, FaTimes
} from "react-icons/fa";
import { jobPostsApi } from "../../lib/api/index";
import CreateJob from "./CreateJob";
import EditJob from "./EditJob";
import EmptyState from "../../Components/EmptyState";

const toStatus = (deadline) => {
  if (!deadline) return "active";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(deadline);
  if (Number.isNaN(end.getTime())) return "active";
  return end < today ? "closed" : "active";
};

const toStatusLabel = (deadline) => {
  return toStatus(deadline) === "active" ? "Active" : "Closed";
};

const toCloseDate = (deadline) => {
  if (!deadline) return "Not set";
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const formatDeadline = (deadline) => {
  if (!deadline) return "";
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const getStatusStyle = (deadline) => {
  const status = toStatus(deadline);
  if (status === "active") return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  return "bg-red-50 text-red-600 border border-red-100";
};

const JobPost = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);



  const loadJobs = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await jobPostsApi.listMine();
      const mapped = (Array.isArray(data) ? data : []).map((job) => ({
        ...job,
        status: toStatus(job.deadline),
        statusLabel: toStatusLabel(job.deadline),
        closeDate: toCloseDate(job.deadline),
        formattedDeadline: formatDeadline(job.deadline),
      }));
      setJobs(mapped);
    } catch (err) {
      setError(err.message || "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...jobs];

    if (statusFilter !== "all") {
      result = result.filter((j) => j.status === statusFilter);
    }

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === "createdAt" || sortField === "deadline") {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }
      if (aVal == null) aVal = "";
      if (bVal == null) bVal = "";
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [jobs, statusFilter, sortField, sortDir]);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    loadJobs();
  };

  const handleEditSuccess = () => {
    setEditingJob(null);
    loadJobs();
  };

  const handleDeleteClick = (job) => {
    setDeleteConfirm(job);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await jobPostsApi.remove(deleteConfirm.id);
      setJobs((prev) => prev.filter((j) => j.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message || "Failed to delete job");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaArrowsAltV size={14} className="text-gray-300" />;
    return sortDir === "asc" ? <FaChevronUp size={14} className="text-emerald-600" /> : <FaChevronDown size={14} className="text-emerald-600" />;
  };

  const activeCount = jobs.filter((j) => j.status === "active").length;
  const closedCount = jobs.filter((j) => j.status === "closed").length;
  const totalApplicants = jobs.reduce((sum, j) => sum + (Number(j.applicantCount) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 pb-12">
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Job Postings</h1>
            <p className="text-gray-500">Manage your recruitment campaigns</p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <FaPlus size={18} />
            Create Job
          </button>
        </div>

        {/* --- ERROR --- */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
              <FaTimes size={16} />
            </button>
          </div>
        )}

        {/* --- STATS --- */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Jobs</p>
            <span className="text-3xl font-extrabold text-gray-900">{jobs.length}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active</p>
            <span className="text-3xl font-extrabold text-emerald-600">{activeCount}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Applicants</p>
            <span className="text-3xl font-extrabold text-gray-900">{totalApplicants}</span>
          </div>
        </div>

        {/* --- FILTER BAR --- */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              showFilters ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FaFilter size={16} />
            Filter
          </button>

          {showFilters && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status:</span>
              {["all", "active", "closed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                    statusFilter === s
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s}
                  {s === "active" && activeCount > 0 && ` (${activeCount})`}
                  {s === "closed" && closedCount > 0 && ` (${closedCount})`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* --- TABLE --- */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-gray-500">
              <div className="animate-spin w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3" />
              Loading jobs...
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <EmptyState
              icon={FaSearch}
              title={statusFilter !== "all" ? "No matching jobs" : "No jobs yet"}
              description={
                statusFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Create your first job posting to start collecting candidates."
              }
              actionLabel={statusFilter === "all" ? "Create Job" : undefined}
              onAction={statusFilter === "all" ? () => setIsCreateOpen(true) : undefined}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">
                        <button
                          onClick={() => handleSort("title")}
                          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Job Title <SortIcon field="title" />
                        </button>
                      </th>
                      <th className="px-6 py-4">
                        <button
                          onClick={() => handleSort("status")}
                          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Status <SortIcon field="status" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Candidates
                        </span>
                      </th>
                      <th className="px-6 py-4">
                        <button
                          onClick={() => handleSort("deadline")}
                          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Closing Date <SortIcon field="deadline" />
                        </button>
                      </th>
                      <th className="px-6 py-4">
                        <button
                          onClick={() => handleSort("createdAt")}
                          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Posted <SortIcon field="createdAt" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-right">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Actions
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredAndSorted.map((job) => (
                      <tr key={job.id} className="hover:bg-emerald-50/20 transition-colors group">
                        <td className="px-6 py-5">
                          <div>
                            <p className="font-semibold text-gray-900">{job.title || "—"}</p>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {job.companyName || "—"} {job.location ? `• ${job.location}` : ""}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(job.deadline)}`}>
                            {job.statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-lg font-bold text-gray-900">{job.applicantCount || 0}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm text-gray-600">{job.closeDate}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm text-gray-500">
                            {job.createdAt
                              ? new Date(job.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => navigate(`/jobs/${job.id}`)}
                              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="View job"
                            >
                              <FaEye size={16} />
                            </button>
                            <button
                              onClick={() => setEditingJob(job)}
                              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit job"
                            >
                              <FaEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(job)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete job"
                            >
                              <FaTrashAlt size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Showing {filteredAndSorted.length} of {jobs.length} jobs
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <CreateJob
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Modal */}
      {editingJob && (
        <EditJob
          isOpen={!!editingJob}
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTrashAlt size={24} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Job</h3>
            <p className="text-gray-500 text-center mb-6">
              Are you sure you want to delete <strong>&quot;{deleteConfirm.title}&quot;</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 inline-flex items-center justify-center gap-2 bg-[#dc2626] text-white border border-[#dc2626] rounded-xl font-semibold hover:bg-[#b91c1c] hover:border-[#b91c1c] transition-colors shadow-sm"
              >
                <FaTrashAlt size={14} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPost;
