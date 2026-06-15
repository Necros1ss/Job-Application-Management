import { useEffect, useState } from "react";
import { hrManagerApi } from "../../lib/api/index";

const HRManagerReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const result = await hrManagerApi.getSummaryReport();
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

  const { jobsByStatus, applicationsByStatus, applicationsOverTime, topRecruiters } = data || {
    jobsByStatus: [],
    applicationsByStatus: [],
    applicationsOverTime: [],
    topRecruiters: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase text-[#737373]">HR Management</p>
        <h1 className="mt-1 text-3xl font-semibold text-black">Summary Report</h1>
        <p className="mt-1 text-sm text-[#737373]">Hiring overview and recruiter performance.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Jobs by Status */}
        <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-6 shadow-[0_0_0_1px_rgba(10,10,10,0.05)]">
          <h2 className="text-base font-semibold text-black">Jobs by Status</h2>
          <div className="mt-4 space-y-3">
            {jobsByStatus.length === 0 ? (
              <p className="text-sm text-[#737373]">Reports will populate after jobs exist.</p>
            ) : (
              jobsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-[#737373]">{item.status}</span>
                  <span className="font-semibold text-black">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Applications by Status */}
        <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-6 shadow-[0_0_0_1px_rgba(10,10,10,0.05)]">
          <h2 className="text-base font-semibold text-black">Applications by Status</h2>
          <div className="mt-4 space-y-3">
            {applicationsByStatus.length === 0 ? (
              <p className="text-sm text-[#737373]">Reports will populate after candidates apply.</p>
            ) : (
              applicationsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-[#737373]">{item.status.replace(/_/g, " ")}</span>
                  <span className="font-semibold text-black">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Recruiters */}
        <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-6 shadow-[0_0_0_1px_rgba(10,10,10,0.05)]">
          <h2 className="text-base font-semibold text-black">Top Recruiters</h2>
          <div className="mt-4 space-y-3">
            {topRecruiters.length === 0 ? (
              <p className="text-sm text-[#737373]">Recruiter rankings will populate after applications exist.</p>
            ) : (
              topRecruiters.map((rec, idx) => (
                <div key={rec.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-medium text-white">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-black">{rec.companyName}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-[#737373]">
                    <span>{rec.totalApplications} apps</span>
                    <span>{rec.hired} hired</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Applications Over Time */}
        <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-6 shadow-[0_0_0_1px_rgba(10,10,10,0.05)]">
          <h2 className="text-base font-semibold text-black">Applications Over Time</h2>
          <div className="mt-4 space-y-3">
            {applicationsOverTime.length === 0 ? (
              <p className="text-sm text-[#737373]">Reports will populate after candidates apply.</p>
            ) : (
              applicationsOverTime.map((item, idx) => {
                const maxCount = Math.max(...applicationsOverTime.map((i) => i.count), 1);
                const barWidth = Math.round((item.count / maxCount) * 100);
                return (
                  <div key={idx}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-[#737373]">
                        {new Date(item.month).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                      <span className="font-medium text-black">{item.count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#f2f2f2]">
                      <div
                        className="h-2 rounded-full bg-black"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRManagerReports;
