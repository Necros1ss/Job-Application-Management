import { useEffect, useMemo, useState } from "react";
import { FaBriefcase, FaCalendarAlt, FaCheckCircle, FaUmbrellaBeach } from "react-icons/fa";
import { employeesApi, usersApi } from "../../lib/api";
import TopBarDashboard from "../../Components/TopBarDashboard";
import { SkeletonCard, SkeletonDashboardCard } from "../../Components/Skeleton";
import { formatDate } from "../../utils/format";
import { showError, showSuccess } from "../../utils/toast";

const leaveStatusStyles = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  rejected: "bg-red-50 text-red-600 border-red-100",
};

const EmployeePortal = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [employee, setEmployee] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "annual",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const [profile, employeeData, leaveData] = await Promise.all([
        usersApi.me(),
        employeesApi.getMine(),
        employeesApi.listLeaveRequests(),
      ]);
      setUserName(profile.name || "");
      setUserEmail(profile.email || "");
      setEmployee(employeeData || null);
      setLeaveRequests(Array.isArray(leaveData) ? leaveData : []);
    } catch (err) {
      const message = err.message || "Failed to load employee portal";
      setError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const approved = leaveRequests.filter((request) => request.status === "approved").length;
    const pending = leaveRequests.filter((request) => request.status === "pending").length;
    return { total: leaveRequests.length, approved, pending };
  }, [leaveRequests]);

  const handleSubmitLeave = async (event) => {
    event.preventDefault();

    try {
      setIsSaving(true);
      const created = await employeesApi.submitLeaveRequest(leaveForm);
      setLeaveRequests((current) => [created, ...current]);
      setLeaveForm({ leaveType: "annual", startDate: "", endDate: "", reason: "" });
      showSuccess("Leave request submitted");
    } catch (err) {
      showError(err.message || "Failed to submit leave request");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBarDashboard userName={userName} userEmail={userEmail} />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 pb-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Portal</h1>
            <p className="text-gray-500 mt-1">View your employee profile and leave requests.</p>
          </div>
          {employee && (
            <div className="bg-[#116843] text-white rounded-2xl px-5 py-3 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Status</p>
              <p className="text-2xl font-extrabold capitalize">{employee.status}</p>
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-6 bg-red-50 p-3 rounded-lg border border-red-100" role="alert">
            {error}
          </p>
        )}

        {isLoading ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <SkeletonDashboardCard />
              <SkeletonDashboardCard />
              <SkeletonDashboardCard dark />
            </div>
            <SkeletonCard />
          </>
        ) : !employee ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-[#188155] flex items-center justify-center mb-4">
              <FaBriefcase size={22} />
            </div>
            <h2 className="font-bold text-gray-900 mb-1">No employee profile yet</h2>
            <p className="text-sm text-gray-500">Your employee portal will appear after a recruiter converts your accepted application.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Leave Requests</p>
                <p className="text-4xl font-extrabold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pending</p>
                <p className="text-4xl font-extrabold text-amber-700">{stats.pending}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Approved</p>
                <p className="text-4xl font-extrabold text-[#188155]">{stats.approved}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-flex px-3 py-1 rounded-full border text-xs font-bold capitalize bg-emerald-50 text-emerald-700 border-emerald-100">
                        {employee.status}
                      </span>
                      <h2 className="text-2xl font-bold text-gray-900 mt-3">{employee.fullName}</h2>
                      <p className="text-sm text-gray-500">{employee.email}</p>
                    </div>
                    <FaCheckCircle className="text-emerald-600 mt-1" size={24} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {[
                      ["Employee Code", employee.employeeCode || "Not set"],
                      ["Company", employee.companyName || "Not set"],
                      ["Job Title", employee.jobTitle || "Not set"],
                      ["Department", employee.department || "Not set"],
                      ["Employment Type", employee.employmentType || "Not set"],
                      ["Start Date", formatDate(employee.startDate, undefined, "Not set")],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-sm font-semibold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <FaUmbrellaBeach className="text-emerald-600" />
                    <h2 className="font-bold text-gray-900">Leave Requests</h2>
                  </div>
                  {leaveRequests.length === 0 ? (
                    <p className="p-8 text-center text-sm text-gray-500">No leave requests yet.</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {leaveRequests.map((request) => (
                        <div key={request.id} className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold capitalize ${leaveStatusStyles[request.status] || leaveStatusStyles.pending}`}>
                            {request.status}
                          </span>
                          <h3 className="text-base font-bold text-gray-900 mt-2 capitalize">{request.leaveType} leave</h3>
                          <p className="text-sm text-gray-500">{formatDate(request.startDate, undefined, "Not set")} - {formatDate(request.endDate, undefined, "Not set")}</p>
                          {request.reason && <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap">{request.reason}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmitLeave} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-fit">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FaCalendarAlt />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Request Leave</h2>
                    <p className="text-xs text-gray-500">Submit for recruiter review</p>
                  </div>
                </div>

                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Leave Type</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(event) => setLeaveForm((current) => ({ ...current, leaveType: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 mb-4"
                >
                  <option value="annual">Annual</option>
                  <option value="sick">Sick</option>
                  <option value="unpaid">Unpaid</option>
                </select>

                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(event) => setLeaveForm((current) => ({ ...current, startDate: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 mb-4"
                  required
                />

                <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(event) => setLeaveForm((current) => ({ ...current, endDate: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 mb-4"
                  required
                />

                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(event) => setLeaveForm((current) => ({ ...current, reason: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 mb-5 resize-none"
                  rows={4}
                  placeholder="Reason for leave"
                />

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-300"
                >
                  <FaUmbrellaBeach />
                  {isSaving ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeePortal;
