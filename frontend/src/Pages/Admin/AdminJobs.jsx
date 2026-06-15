import { useEffect, useState } from "react";
import { adminApi } from "../../lib/api/index";
import Toast from "../../Components/Toast";

const defaultFilters = { search: "", status: "" };

const AdminJobs = () => {
  const [filters, setFilters] = useState(defaultFilters);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [notice, setNotice] = useState({ type: "info", message: "" });

  const loadJobs = async (nextPage = pagination.page, nextFilters = filters) => {
    try {
      setLoading(true);
      const payload = await adminApi.listJobs({
        page: nextPage,
        limit: pagination.limit,
        search: nextFilters.search,
        status: nextFilters.status,
      });
      setJobs(payload.items || []);
      setPagination((prev) => ({ ...prev, ...payload.pagination, page: nextPage }));
    } catch (error) {
      setNotice({ type: "error", message: error.message || "Failed to load jobs" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAction = async (key, action, successMessage) => {
    try {
      setActionLoading(key);
      await action();
      setNotice({ type: "success", message: successMessage });
      await loadJobs(pagination.page, filters);
    } catch (error) {
      setNotice({ type: "error", message: error.message || "Action failed" });
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / (pagination.limit || 10)));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Job Moderation</h1>
      </div>

      {notice.message && <Toast type={notice.type} message={notice.message} />}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Search jobs or companies..."
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
          />
          <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={() => loadJobs(1, filters)} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Apply filters</button>
          <button
            onClick={() => {
              setFilters(defaultFilters);
              loadJobs(1, defaultFilters);
            }}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-slate-500">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-slate-500">No jobs found.</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Job</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Moderation</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{job.title}</div>
                    <div className="text-slate-500">{job.company_name || "Unknown company"}</div>
                    <div className="text-slate-400">{job.location || "No location"}</div>
                  </td>
                  <td className="px-6 py-4 capitalize text-slate-700">{job.status}</td>
                  <td className="px-6 py-4 text-slate-600">
                    <div>By: {job.moderated_by_login_name || "-"}</div>
                    <div>{job.moderated_at ? new Date(job.moderated_at).toLocaleString() : "Never"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => runAction(`hide-${job.id}`, () => adminApi.hideJob(job.id), "Job hidden")}
                        disabled={actionLoading === `hide-${job.id}`}
                        className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-60"
                      >
                        Hide
                      </button>
                      <button
                        onClick={() => runAction(`unhide-${job.id}`, () => adminApi.unhideJob(job.id), "Job made active")}
                        disabled={actionLoading === `unhide-${job.id}`}
                        className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-60"
                      >
                        Unhide
                      </button>
                      <button
                        onClick={() => runAction(`delete-${job.id}`, () => adminApi.deleteJob(job.id), "Job deleted")}
                        disabled={actionLoading === `delete-${job.id}`}
                        className="rounded-full border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm">
        <p className="text-slate-500">
          Page {pagination.page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => loadJobs(pagination.page - 1, filters)}
            className="rounded-full border border-slate-200 px-4 py-2 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={pagination.page >= totalPages}
            onClick={() => loadJobs(pagination.page + 1, filters)}
            className="rounded-full border border-slate-200 px-4 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminJobs;
