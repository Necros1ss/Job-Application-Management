import { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";
import Toast from "../../Components/Toast";

const defaultFilters = { search: "", role: "", locked: "", deleted: "" };

const AdminUsers = () => {
  const [filters, setFilters] = useState(defaultFilters);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [notice, setNotice] = useState({ type: "info", message: "" });

  const loadUsers = async (nextPage = pagination.page, nextFilters = filters) => {
    try {
      setLoading(true);
      const payload = await adminApi.listUsers({
        page: nextPage,
        limit: pagination.limit,
        search: nextFilters.search,
        role: nextFilters.role,
        locked: nextFilters.locked,
        deleted: nextFilters.deleted,
      });
      setUsers(payload.items || []);
      setPagination((prev) => ({ ...prev, ...payload.pagination, page: nextPage }));
    } catch (error) {
      setNotice({ type: "error", message: error.message || "Failed to load users" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAction = async (key, action) => {
    try {
      setActionLoading(key);
      await action();
      setNotice({ type: "success", message: "User updated successfully" });
      await loadUsers(pagination.page, filters);
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
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">User Management</h1>
      </div>

      {notice.message && <Toast type={notice.type} message={notice.message} />}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Search users..."
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
          />
          <select value={filters.role} onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none">
            <option value="">All roles</option>
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
          </select>
          <select value={filters.locked} onChange={(e) => setFilters((prev) => ({ ...prev, locked: e.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none">
            <option value="">Any lock state</option>
            <option value="true">Locked</option>
            <option value="false">Unlocked</option>
          </select>
          <select value={filters.deleted} onChange={(e) => setFilters((prev) => ({ ...prev, deleted: e.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none">
            <option value="">Any deletion state</option>
            <option value="true">Deleted</option>
            <option value="false">Active</option>
          </select>
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={() => loadUsers(1, filters)} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Apply filters</button>
          <button
            onClick={() => {
              setFilters(defaultFilters);
              loadUsers(1, defaultFilters);
            }}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-slate-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-slate-500">No users found.</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">State</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{user.candidate_name || user.recruiter_name || user.login_name}</div>
                    <div className="text-slate-500">{user.candidate_email || user.recruiter_email || user.login_name}</div>
                  </td>
                  <td className="px-6 py-4 capitalize text-slate-700">{user.role}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${user.is_locked ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{user.is_locked ? "Locked" : "Unlocked"}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${user.is_deleted ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"}`}>{user.is_deleted ? "Deleted" : "Active"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {!user.is_deleted && (
                        <button
                          onClick={() => runAction(`lock-${user.id}`, () => adminApi.lockUser(user.id))}
                          disabled={actionLoading === `lock-${user.id}`}
                          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-60"
                        >
                          Lock
                        </button>
                      )}
                      {!user.is_deleted && (
                        <button
                          onClick={() => runAction(`unlock-${user.id}`, () => adminApi.unlockUser(user.id))}
                          disabled={actionLoading === `unlock-${user.id}`}
                          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-60"
                        >
                          Unlock
                        </button>
                      )}
                      {!user.is_deleted && user.role !== "admin" && (
                        <button
                          onClick={() => runAction(`delete-${user.id}`, () => adminApi.deleteUser(user.id))}
                          disabled={actionLoading === `delete-${user.id}`}
                          className="rounded-full border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      )}
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
            onClick={() => loadUsers(pagination.page - 1, filters)}
            className="rounded-full border border-slate-200 px-4 py-2 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={pagination.page >= totalPages}
            onClick={() => loadUsers(pagination.page + 1, filters)}
            className="rounded-full border border-slate-200 px-4 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
