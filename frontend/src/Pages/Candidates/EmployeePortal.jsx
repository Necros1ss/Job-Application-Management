import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  FaBriefcase,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaUmbrellaBeach,
} from "react-icons/fa";
import { employeesApi, usersApi } from "../../lib/api";
import { SkeletonCard, SkeletonDashboardCard } from "../../Components/Skeleton";
import { useI18n } from "../../lib/i18n";
import { showError, showSuccess } from "../../utils/toast";

ChartJS.register(ArcElement, Tooltip, Legend);

const TABS = [
  { id: "overview", labelKey: "employee.overview" },
  { id: "attendance", labelKey: "employee.attendance" },
  { id: "leave", labelKey: "employee.leaveRequests" },
];

const leaveStatusStyles = {
  pending: "bg-[#f2f2f2] text-[#0a0a0a] border-[#e5e5e5]",
  approved: "bg-white text-[#0a0a0a] border-[#0a0a0a]",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const attendanceStatusStyles = {
  present: "bg-black text-white border-black",
  remote: "bg-[#f2f2f2] text-[#0a0a0a] border-[#e5e5e5]",
  late: "bg-amber-50 text-amber-700 border-amber-200",
  absent: "bg-red-50 text-red-700 border-red-200",
};

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatTime = (value) => {
  if (!value) return "-";
  return String(value).slice(0, 5);
};

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="blueprint-card border-dashed p-10 text-center">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f2f2f2] text-[#0a0a0a]">
      <Icon size={22} />
    </div>
    <h2 className="mb-1 font-semibold text-[#0a0a0a]">{title}</h2>
    <p className="text-sm text-[#737373]">{description}</p>
  </div>
);

EmptyState.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

const EmployeePortal = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("overview");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [employee, setEmployee] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
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
      const [profile, employeeData, leaveData, attendanceData] = await Promise.all([
        usersApi.me(),
        employeesApi.getMine(),
        employeesApi.listLeaveRequests(),
        employeesApi.listAttendance(),
      ]);
      setUserName(profile.name || "");
      setUserEmail(profile.email || "");
      setEmployee(employeeData || null);
      setLeaveRequests(Array.isArray(leaveData) ? leaveData : []);
      setAttendanceRecords(Array.isArray(attendanceData) ? attendanceData : []);
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

  const leaveStats = useMemo(() => {
    const approved = leaveRequests.filter((request) => request.status === "approved").length;
    const pending = leaveRequests.filter((request) => request.status === "pending").length;
    const rejected = leaveRequests.filter((request) => request.status === "rejected").length;
    return { total: leaveRequests.length, approved, pending, rejected };
  }, [leaveRequests]);

  const currentMonthAttendance = useMemo(() => {
    const now = new Date();
    return attendanceRecords.filter((record) => {
      const date = new Date(record.workDate);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
  }, [attendanceRecords]);

  const attendanceStats = useMemo(() => {
    const initial = { present: 0, remote: 0, late: 0, absent: 0 };
    return currentMonthAttendance.reduce((acc, record) => {
      const status = record.status || "present";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, initial);
  }, [currentMonthAttendance]);

  const chartData = useMemo(
    () => ({
      labels: ["Approved", "Pending", "Rejected"],
      datasets: [
        {
          data: [leaveStats.approved, leaveStats.pending, leaveStats.rejected],
          backgroundColor: ["#0a0a0a", "#737373", "#e5e5e5"],
          borderColor: "#ffffff",
          borderWidth: 4,
          hoverOffset: 4,
        },
      ],
    }),
    [leaveStats]
  );

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

  const renderOverview = () => {
    if (!employee) {
      return (
        <EmptyState
          icon={FaBriefcase}
          title={t("employee.notOnboardedTitle")}
          description={t("employee.notOnboardedDescription")}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="blueprint-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="blueprint-tag capitalize">{employee.status}</span>
                <h2 className="mt-3 text-2xl font-semibold text-[#0a0a0a]">{employee.fullName}</h2>
                <p className="text-sm text-[#737373]">{employee.email}</p>
              </div>
              <FaCheckCircle className="mt-1 text-[#0a0a0a]" size={24} />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ["Employee Code", employee.employeeCode || "Not set"],
                ["Company", employee.companyName || "Not set"],
                ["Job Title", employee.jobTitle || "Not set"],
                ["Department", employee.department || "Not set"],
                ["Employment Type", employee.employmentType || "Not set"],
                ["Start Date", formatDate(employee.startDate)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[14px] border border-[#e5e5e5] bg-[#f2f2f2] p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#737373]">{label}</p>
                  <p className="text-sm font-semibold text-[#0a0a0a]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              ["Total Leave", leaveStats.total],
              ["Approved", leaveStats.approved],
              ["Pending", leaveStats.pending],
              ["Rejected", leaveStats.rejected],
            ].map(([label, value]) => (
              <div key={label} className="blueprint-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#737373]">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-[#0a0a0a]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="blueprint-card p-6">
          <div className="mb-5">
            <p className="blueprint-kicker">{t("employee.leaveStats")}</p>
            <h2 className="mt-1 text-lg font-semibold text-[#0a0a0a]">{t("employee.requestBreakdown")}</h2>
          </div>
          {leaveStats.total > 0 ? (
            <Doughnut
              data={chartData}
              options={{
                cutout: "68%",
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { boxWidth: 10, color: "#0a0a0a", font: { family: "Geist" } },
                  },
                },
              }}
            />
          ) : (
            <div className="rounded-[14px] border border-dashed border-[#e5e5e5] p-8 text-center text-sm text-[#737373]">
              No leave data to chart yet.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAttendance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Present", attendanceStats.present],
          ["Remote", attendanceStats.remote],
          ["Late", attendanceStats.late],
          ["Absent", attendanceStats.absent],
        ].map(([label, value]) => (
          <div key={label} className="blueprint-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#737373]">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-[#0a0a0a]">{value}</p>
          </div>
        ))}
      </div>

      {currentMonthAttendance.length === 0 ? (
        <EmptyState
          icon={FaClock}
          title="No attendance records"
          description="Attendance records for the current month will appear here."
        />
      ) : (
        <div className="blueprint-card overflow-hidden p-0">
          <div className="border-b border-[#e5e5e5] px-6 py-4">
            <h2 className="font-semibold text-[#0a0a0a]">Current Month Attendance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-[#e5e5e5] text-xs font-semibold uppercase tracking-wide text-[#737373]">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Check-in</th>
                  <th className="px-6 py-4">Check-out</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {currentMonthAttendance.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 font-semibold text-[#0a0a0a]">{formatDate(record.workDate)}</td>
                    <td className="px-6 py-4 text-[#737373]">{formatTime(record.checkIn)}</td>
                    <td className="px-6 py-4 text-[#737373]">{formatTime(record.checkOut)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                          attendanceStatusStyles[record.status] || attendanceStatusStyles.present
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#737373]">{record.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderLeaveRequests = () => (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_380px]">
      <div className="blueprint-card overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-[#e5e5e5] px-6 py-4">
          <FaUmbrellaBeach className="text-[#0a0a0a]" />
          <h2 className="font-semibold text-[#0a0a0a]">Leave Requests</h2>
        </div>
        {leaveRequests.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#737373]">No leave requests yet.</div>
        ) : (
          <div className="divide-y divide-[#e5e5e5]">
            {leaveRequests.map((request) => (
              <div key={request.id} className="px-6 py-4">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                    leaveStatusStyles[request.status] || leaveStatusStyles.pending
                  }`}
                >
                  {request.status}
                </span>
                <h3 className="mt-2 text-base font-semibold capitalize text-[#0a0a0a]">{request.leaveType} leave</h3>
                <p className="text-sm text-[#737373]">
                  {formatDate(request.startDate)} - {formatDate(request.endDate)}
                </p>
                {request.reason && <p className="mt-2 whitespace-pre-wrap text-sm text-[#737373]">{request.reason}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmitLeave} className="blueprint-card h-fit p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f2f2f2] text-[#0a0a0a]">
            <FaCalendarAlt />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#0a0a0a]">Request Leave</h2>
            <p className="text-xs text-[#737373]">Submit for recruiter review</p>
          </div>
        </div>

        <label className="mb-1.5 block text-sm font-semibold text-[#0a0a0a]">Leave Type</label>
        <select
          value={leaveForm.leaveType}
          onChange={(event) => setLeaveForm((current) => ({ ...current, leaveType: event.target.value }))}
          className="blueprint-input mb-4 w-full"
        >
          <option value="annual">Annual</option>
          <option value="sick">Sick</option>
          <option value="unpaid">Unpaid</option>
        </select>

        <label className="mb-1.5 block text-sm font-semibold text-[#0a0a0a]">Start Date</label>
        <input
          type="date"
          value={leaveForm.startDate}
          onChange={(event) => setLeaveForm((current) => ({ ...current, startDate: event.target.value }))}
          className="blueprint-input mb-4 w-full"
          required
        />

        <label className="mb-1.5 block text-sm font-semibold text-[#0a0a0a]">End Date</label>
        <input
          type="date"
          value={leaveForm.endDate}
          onChange={(event) => setLeaveForm((current) => ({ ...current, endDate: event.target.value }))}
          className="blueprint-input mb-4 w-full"
          required
        />

        <label className="mb-1.5 block text-sm font-semibold text-[#0a0a0a]">Reason</label>
        <textarea
          value={leaveForm.reason}
          onChange={(event) => setLeaveForm((current) => ({ ...current, reason: event.target.value }))}
          className="blueprint-input mb-5 w-full resize-none"
          rows={4}
          placeholder="Reason for leave"
        />

        <button
          type="submit"
          disabled={isSaving || !employee}
          className="blueprint-primary inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaUmbrellaBeach />
          {isSaving ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-7xl px-6 pb-12 pt-6 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="blueprint-kicker">{t("employee.kicker")}</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#0a0a0a]">{t("employee.title")}</h1>
            <p className="mt-1 text-[#737373]">{t("employee.subtitle")}</p>
          </div>
          {employee && (
            <div className="blueprint-card px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#737373]">{t("employee.status")}</p>
              <p className="mt-1 text-2xl font-semibold capitalize text-[#0a0a0a]">{employee.status}</p>
            </div>
          )}
        </div>

        {error && (
          <p className="mb-6 rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {isLoading ? (
          <>
            <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
              <SkeletonDashboardCard />
              <SkeletonDashboardCard />
              <SkeletonDashboardCard />
            </div>
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2 rounded-full border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {t(tab.labelKey)}
                </button>
              ))}
            </div>

            {activeTab === "overview" && renderOverview()}
            {activeTab === "attendance" && renderAttendance()}
            {activeTab === "leave" && renderLeaveRequests()}
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeePortal;
