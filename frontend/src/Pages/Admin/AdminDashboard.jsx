import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../lib/api/index";
import Toast from "../../Components/Toast";

const StatCard = ({ label, value, tone = "slate" }) => {
  const toneMap = {
    slate: "from-slate-900 to-slate-700 text-white",
    emerald: "from-emerald-600 to-emerald-500 text-white",
    amber: "from-amber-600 to-amber-500 text-white",
    rose: "from-rose-600 to-rose-500 text-white",
  };

  return (
    <div className={`rounded-3xl bg-gradient-to-br ${toneMap[tone] || toneMap.slate} p-6 shadow-lg`}>
      <p className="text-sm uppercase tracking-[0.2em] text-white/70">{label}</p>
      <p className="mt-3 text-4xl font-semibold">{value}</p>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ type: "info", message: "" });

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        setLoading(true);
        const payload = await adminApi.getStats();
        if (mounted) {
          setStats(payload);
        }
      } catch (error) {
        if (mounted) {
          setNotice({ type: "error", message: error.message || "Failed to load statistics" });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Statistics Overview</h1>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/users" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Manage Users
          </Link>
          <Link to="/admin/jobs" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
            Moderate Jobs
          </Link>
        </div>
      </div>

      {notice.message && <Toast type={notice.type} message={notice.message} />}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500">Loading statistics...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Users" value={stats?.users?.total_users ?? 0} />
          <StatCard label="Active Jobs" value={stats?.jobs?.active_jobs ?? 0} tone="emerald" />
          <StatCard label="Locked Users" value={stats?.users?.locked_users ?? 0} tone="amber" />
          <StatCard label="Deleted Jobs" value={stats?.jobs?.deleted_jobs ?? 0} tone="rose" />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Candidates</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats?.users?.candidates ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Recruiters</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats?.users?.recruiters ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Applications</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats?.applications?.total_applications ?? 0}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  tone: PropTypes.string,
};
