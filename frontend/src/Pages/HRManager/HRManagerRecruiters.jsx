import { useEffect, useState } from "react";
import { hrManagerApi } from "../../lib/api/index";

const HRManagerRecruiters = () => {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async (pageNum = 1) => {
    setLoading(true);
    setError("");
    try {
      const result = await hrManagerApi.getRecruiters({ page: pageNum, limit: 10 });
      setRecruiters(result.data || []);
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
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase text-[#737373]">HR Management</p>
        <h1 className="mt-1 text-3xl font-semibold text-black">Recruiter Performance</h1>
        <p className="mt-1 text-sm text-[#737373]">Monitor recruiter activity and hiring results.</p>
      </div>

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
          <div className="rounded-[14px] border border-[#e5e5e5] bg-white shadow-[0_0_0_1px_rgba(10,10,10,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#737373]">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#737373]">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#737373]">Total Jobs</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#737373]">Active Jobs</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#737373]">Applications</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#737373]">Hired</th>
                  </tr>
                </thead>
                <tbody>
                  {recruiters.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[#737373]">No recruiters found.</td>
                    </tr>
                  ) : (
                    recruiters.map((rec) => (
                      <tr key={rec.id} className="border-b border-[#e5e5e5] last:border-0">
                        <td className="px-4 py-3 font-medium text-black">{rec.companyName}</td>
                        <td className="px-4 py-3 text-[#737373]">{rec.email}</td>
                        <td className="px-4 py-3 text-center text-[#737373]">{rec.totalJobs}</td>
                        <td className="px-4 py-3 text-center text-[#737373]">{rec.activeJobs}</td>
                        <td className="px-4 py-3 text-center text-[#737373]">{rec.totalApplications}</td>
                        <td className="px-4 py-3 text-center text-[#737373]">{rec.hired}</td>
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
                Page {page} of {totalPages} ({total} recruiters)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page <= 1}
                  className="rounded-[8px] border border-[#e5e5e5] px-3 py-1.5 text-sm text-[#737373] hover:bg-[#f2f2f2] disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => load(page + 1)}
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

export default HRManagerRecruiters;
