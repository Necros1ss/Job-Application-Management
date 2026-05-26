import { useEffect, useState } from "react";
import { FaCheck, FaTimes, FaSearch } from "react-icons/fa";
import { hrManagerApi } from "../../lib/api/hrManagerApi";
import { showError, showSuccess } from "../../utils/toast";

const statusColors = {
  active: "bg-green-100 text-green-800",
  hidden: "bg-yellow-100 text-yellow-800",
  deleted: "bg-red-100 text-red-800",
};

const HRManagerJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadJobs = async (searchTerm = "", pageNum = 1, statusFilter = "") => {
    setLoading(true);
    setError("");
    try {
      const result = await hrManagerApi.getJobs({ search: searchTerm, page: pageNum, limit: 10, status: statusFilter });
      setJobs(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
      setPage(result.page || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs(search, page, status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadJobs(search, 1, status);
  };

  const handleStatusFilter = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
    loadJobs(search, 1, newStatus);
  };

  const handleApprove = async (jobId, approved) => {
    try {
      await hrManagerApi.setJobVisibility(jobId, approved);
      showSuccess(approved ? "Job visible" : "Job hidden");
      loadJobs(search, page, status);
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase text-[#737373]">HR Management</p>
        <h1 className="mt-1 text-3xl font-semibold text-black">Job Moderation</h1>
        <p className="mt-1 text-sm text-[#737373]">Review active and hidden job posts from all recruiters.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
          <input
            type="text"
            placeholder="Search by title, company, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-[10px] border border-[#e5e5e5] bg-white py-2 pl-10 pr-3 text-sm text-[#0a0a0a] outline-none placeholder:text-[#737373] focus:border-black"
          />
        </div>
        <button
          type="submit"
          className="rounded-[10px] bg-black px-6 py-2 text-sm font-semibold text-white hover:bg-[#0a0a0a]"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-[#737373]">Loading...</p>
        </div>
      ) : error ? (
        <div className="rounded-[14px] border border-[#c22b10]/20 bg-[#c22b10]/5 p-4">
          <p className="text-sm text-[#c22b10]">{error}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-[#737373]">Status:</span>
            <div className="flex gap-2">
              {[
                { value: "", label: "All" },
                { value: "active", label: "Active" },
                { value: "hidden", label: "Hidden" },
                { value: "deleted", label: "Deleted" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleStatusFilter(opt.value)}
                  className={`rounded-[8px] px-3 py-1.5 text-xs font-medium transition ${
                    status === opt.value
                      ? "bg-black text-white"
                      : "border border-[#e5e5e5] text-[#737373] hover:bg-[#f2f2f2]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[14px] border border-[#e5e5e5] bg-white shadow-[0_0_0_1px_rgba(10,10,10,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#737373]">Job Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#737373]">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#737373]">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#737373]">Applicants</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#737373]">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#737373]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[#737373]">No jobs match the current filters.</td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id} className="border-b border-[#e5e5e5] last:border-0">
                        <td className="px-4 py-3 font-medium text-black">{job.title}</td>
                        <td className="px-4 py-3 text-[#737373]">{job.companyName}</td>
                        <td className="px-4 py-3 text-[#737373]">{job.location || "—"}</td>
                        <td className="px-4 py-3 text-[#737373]">{job.applicantCount}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[job.status] || "bg-gray-100 text-gray-800"}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {job.status !== "active" && (
                              <button
                                onClick={() => handleApprove(job.id, true)}
                                className="flex items-center gap-1 rounded-[8px] bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                                title="Unhide"
                              >
                                <FaCheck size={11} /> Unhide
                              </button>
                            )}
                            {job.status === "active" && (
                              <button
                                onClick={() => handleApprove(job.id, false)}
                                className="flex items-center gap-1 rounded-[8px] bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700"
                                title="Hide"
                              >
                                <FaTimes size={11} /> Hide
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#737373]">
                Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total} jobs
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => loadJobs(search, page - 1, status)}
                  disabled={page <= 1}
                  className="rounded-[8px] border border-[#e5e5e5] px-3 py-1.5 text-sm text-[#737373] hover:bg-[#f2f2f2] disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => loadJobs(search, page + 1, status)}
                  disabled={page >= totalPages}
                  className="rounded-[8px] border border-[#e5e5e5] px-3 py-1.5 text-sm text-[#737373] hover:bg-[#f2f2f2] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HRManagerJobs;
