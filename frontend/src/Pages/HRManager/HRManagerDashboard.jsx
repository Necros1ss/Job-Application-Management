import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FaBriefcase, FaUsers, FaClipboardList, FaChartBar } from "react-icons/fa";
import { hrManagerApi } from "../../lib/api/index";

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-6 shadow-[0_0_0_1px_rgba(10,10,10,0.05)]">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-[#737373]">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-black">{value ?? 0}</p>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-[10px] ${color}`}>
        <Icon className="text-xl text-white" />
      </div>
    </div>
  </div>
);

StatCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  color: PropTypes.string,
};

const HRManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const result = await hrManagerApi.getDashboard();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#737373]">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[14px] border border-[#c22b10]/20 bg-[#c22b10]/5 p-4">
        <p className="text-sm text-[#c22b10]">{error}</p>
      </div>
    );
  }

  const { stats, recentApplications } = data || { stats: {}, recentApplications: [] };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase text-[#737373]">HR Management</p>
        <h1 className="mt-1 text-3xl font-semibold text-black">Dashboard</h1>
        <p className="mt-1 text-sm text-[#737373]">Overview of hiring activity across all recruiters.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FaBriefcase} label="Total Jobs" value={stats.totalJobs} color="bg-black" />
        <StatCard icon={FaClipboardList} label="Hidden Jobs" value={stats.pendingApproval} color="bg-[#d97706]" />
        <StatCard icon={FaUsers} label="Total Recruiters" value={stats.totalRecruiters} color="bg-[#2563eb]" />
        <StatCard icon={FaChartBar} label="Total Applications" value={stats.totalApplications} color="bg-[#16a34a]" />
      </div>

      <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-6 shadow-[0_0_0_1px_rgba(10,10,10,0.05)]">
        <h2 className="text-base font-semibold text-black">Recent Applications</h2>
        {recentApplications.length === 0 ? (
          <p className="mt-4 text-sm text-[#737373]">No recent applications.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {recentApplications.map((app) => (
              <div key={app.id} className="flex items-center justify-between rounded-[10px] border border-[#e5e5e5] p-4">
                <div>
                  <p className="text-sm font-medium text-black">{app.candidateName}</p>
                  <p className="text-xs text-[#737373]">{app.jobTitle} · {app.recruiterName}</p>
                </div>
                <span className="rounded-full bg-[#f2f2f2] px-3 py-1 text-xs font-medium text-[#737373]">
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HRManagerDashboard;
