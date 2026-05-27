import { useEffect, useMemo, useState } from "react";
import {
  FaCalendarCheck,
  FaCheck,
  FaClock,
  FaPlus,
  FaUserTie,
  FaTimes,
} from "react-icons/fa";
import { employeesApi, usersApi } from "../../lib/api";
import { SkeletonCard } from "../../Components/Skeleton";
import { formatDate } from "../../utils/format";
import { showError, showSuccess } from "../../utils/toast";

const employeeStatusStyles = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
};

const leaveStatusStyles = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  rejected: "bg-red-50 text-red-600 border-red-100",
};

const Employees = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [employees, setEmployees] = useState([]);
  const [acceptedApplications, setAcceptedApplications] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("employees");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [convertForm, setConvertForm] = useState({
    applicationId: "",
    employeeCode: "",
    department: "",
    startDate: "",
  });
  const [attendanceForm, setAttendanceForm] = useState({
    employeeId: "",
    workDate: new Date().toISOString().split("T")[0],
    checkIn: "",
    checkOut: "",
    status: "present",
    notes: "",
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const [profile, employeeData, acceptedData, attendanceData, leaveData] = await Promise.all([
        usersApi.me(),
        employeesApi.listForRecruiter(),
        employeesApi.listAcceptedApplications(),
        employeesApi.listAttendance(),
        employeesApi.listLeaveRequests(),
      ]);
      setUserName(profile.name || "");
      setUserEmail(profile.email || "");
      setEmployees(Array.isArray(employeeData) ? employeeData : []);
      setAcceptedApplications(Array.isArray(acceptedData) ? acceptedData : []);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      setLeaveRequests(Array.isArray(leaveData) ? leaveData : []);
      setConvertForm((current) => ({ ...current, applicationId: current.applicationId || String(acceptedData?.[0]?.id || "") }));
      setAttendanceForm((current) => ({ ...current, employeeId: current.employeeId || String(employeeData?.[0]?.id || "") }));
    } catch (err) {
      const message = err.message || "Failed to load employees";
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
    const active = employees.filter((employee) => employee.status === "active").length;
    const pendingLeave = leaveRequests.filter((request) => request.status === "pending").length;
    return {
      total: employees.length,
      active,
      inactive: employees.length - active,
      pendingLeave,
    };
  }, [employees, leaveRequests]);

  const filteredEmployees = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return employees;

    return employees.filter((employee) =>
      [
        employee.fullName,
        employee.email,
        employee.employeeCode,
        employee.jobTitle,
        employee.department,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search))
    );
  }, [employees, searchTerm]);

  const handleConvert = async (event) => {
    event.preventDefault();

    try {
      setIsSaving(true);
      await employeesApi.convertCandidate({
        applicationId: Number(convertForm.applicationId),
        employeeCode: convertForm.employeeCode,
        department: convertForm.department,
        startDate: convertForm.startDate || null,
      });
      showSuccess("Candidate converted to employee");
      setConvertForm({ applicationId: "", employeeCode: "", department: "", startDate: "" });
      await loadData();
    } catch (err) {
      showError(err.message || "Failed to convert candidate");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmployeeUpdate = async (employee, nextStatus) => {
    try {
      const updated = await employeesApi.updateEmployee(employee.id, {
        department: employee.department,
        status: nextStatus,
      });
      setEmployees((current) => current.map((item) => (item.id === employee.id ? { ...item, ...updated } : item)));
      showSuccess("Employee updated");
    } catch (err) {
      showError(err.message || "Failed to update employee");
    }
  };

  const handleAttendanceSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSaving(true);
      await employeesApi.recordAttendance({
        employeeId: Number(attendanceForm.employeeId),
        workDate: attendanceForm.workDate,
        checkIn: attendanceForm.checkIn || null,
        checkOut: attendanceForm.checkOut || null,
        status: attendanceForm.status,
        notes: attendanceForm.notes,
      });
      showSuccess("Attendance recorded");
      setAttendanceForm((current) => ({ ...current, checkIn: "", checkOut: "", notes: "" }));
      const attendanceData = await employeesApi.listAttendance();
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
    } catch (err) {
      showError(err.message || "Failed to record attendance");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReviewLeave = async (requestId, status) => {
    try {
      const updated = await employeesApi.reviewLeaveRequest(requestId, status);
      setLeaveRequests((current) => current.map((request) => (request.id === requestId ? { ...request, ...updated } : request)));
      showSuccess(`Leave request ${status}`);
    } catch (err) {
      showError(err.message || "Failed to review leave request");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 pb-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
            <p className="text-gray-500 mt-1">Manage employees, attendance, and leave requests.</p>
          </div>
          <div className="flex items-center bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
            {[
              ["employees", "Employees"],
              ["attendance", "Attendance"],
              ["leave", "Leave"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveTab(value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                  activeTab === value ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          {[
            ["Total Employees", stats.total, "text-gray-900", FaUserTie],
            ["Active", stats.active, "text-emerald-700", FaCheck],
            ["Inactive", stats.inactive, "text-gray-600", FaTimes],
            ["Pending Leave", stats.pendingLeave, "text-amber-700", FaClock],
          ].map(([label, value, color, Icon]) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                <Icon className={color} />
              </div>
              <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {activeTab === "employees" && (
          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-8">
            <form onSubmit={handleConvert} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-fit">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FaPlus />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Convert Candidate</h2>
                  <p className="text-xs text-gray-500">Accepted applications only</p>
                </div>
              </div>

              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Candidate</label>
              <select
                value={convertForm.applicationId}
                onChange={(event) => setConvertForm((current) => ({ ...current, applicationId: event.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 mb-4"
                required
              >
                <option value="">Select accepted candidate</option>
                {acceptedApplications.map((application) => (
                  <option key={application.id} value={application.id}>
                    {application.candidateName} - {application.jobTitle}
                  </option>
                ))}
              </select>

              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Employee Code</label>
              <input
                value={convertForm.employeeCode}
                onChange={(event) => setConvertForm((current) => ({ ...current, employeeCode: event.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 mb-4"
                placeholder="Auto: EMP-applicationId"
              />

              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Department</label>
              <input
                value={convertForm.department}
                onChange={(event) => setConvertForm((current) => ({ ...current, department: event.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 mb-4"
                placeholder="Engineering"
              />

              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
              <input
                type="date"
                value={convertForm.startDate}
                onChange={(event) => setConvertForm((current) => ({ ...current, startDate: event.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 mb-5"
              />

              <button
                type="submit"
                disabled={isSaving || !convertForm.applicationId}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-300"
              >
                <FaUserTie />
                {isSaving ? "Converting..." : "Create Employee"}
              </button>
            </form>

            <div className="space-y-4">
              {isLoading ? (
                Array(3).fill(0).map((_, index) => <SkeletonCard key={index} />)
              ) : filteredEmployees.length === 0 ? (
                <div className="blueprint-card border-dashed p-12 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f2f2f2] text-[#0a0a0a]">
                    <FaUserTie size={22} />
                  </div>
                  <p className="font-semibold text-[#0a0a0a]">No employees yet</p>
                  <p className="text-sm text-[#737373] mt-1">Convert accepted candidates into employees to start HR tracking.</p>
                </div>
              ) : (
                filteredEmployees.map((employee) => (
                  <div key={employee.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div>
                        <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold capitalize ${employeeStatusStyles[employee.status] || employeeStatusStyles.active}`}>
                          {employee.status}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 mt-2">{employee.fullName}</h3>
                        <p className="text-sm text-gray-500">{employee.email}</p>
                        <p className="text-sm text-gray-700 mt-3">
                          <span className="font-semibold">{employee.jobTitle || "Employee"}</span>
                          {employee.department ? ` · ${employee.department}` : ""}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {employee.employeeCode || "No code"} · Start: {formatDate(employee.startDate, undefined, "Not set")}
                        </p>
                      </div>
                      <select
                        value={employee.status}
                        onChange={(event) => handleEmployeeUpdate(employee, event.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-700 shrink-0"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-8">
            <form onSubmit={handleAttendanceSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-fit">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FaCalendarCheck />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Record Attendance</h2>
                  <p className="text-xs text-gray-500">One record per employee per date</p>
                </div>
              </div>

              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Employee</label>
              <select
                value={attendanceForm.employeeId}
                onChange={(event) => setAttendanceForm((current) => ({ ...current, employeeId: event.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 mb-4"
                required
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                ))}
              </select>

              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Work Date</label>
              <input
                type="date"
                value={attendanceForm.workDate}
                onChange={(event) => setAttendanceForm((current) => ({ ...current, workDate: event.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 mb-4"
                required
              />

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Check In</label>
                  <input
                    type="time"
                    value={attendanceForm.checkIn}
                    onChange={(event) => setAttendanceForm((current) => ({ ...current, checkIn: event.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Check Out</label>
                  <input
                    type="time"
                    value={attendanceForm.checkOut}
                    onChange={(event) => setAttendanceForm((current) => ({ ...current, checkOut: event.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                  />
                </div>
              </div>

              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
              <select
                value={attendanceForm.status}
                onChange={(event) => setAttendanceForm((current) => ({ ...current, status: event.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 mb-4"
              >
                <option value="present">Present</option>
                <option value="remote">Remote</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </select>

              <textarea
                value={attendanceForm.notes}
                onChange={(event) => setAttendanceForm((current) => ({ ...current, notes: event.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 mb-5 resize-none"
                rows={3}
                placeholder="Notes"
              />

              <button
                type="submit"
                disabled={isSaving || !attendanceForm.employeeId}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-300"
              >
                <FaCalendarCheck />
                {isSaving ? "Saving..." : "Save Attendance"}
              </button>
            </form>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Recent Attendance</h2>
              </div>
              {attendance.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f2f2f2] text-[#0a0a0a]">
                    <FaCalendarCheck size={22} />
                  </div>
                  <p className="font-semibold text-[#0a0a0a]">No attendance records yet</p>
                  <p className="mt-1 text-sm text-[#737373]">Recorded attendance will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {attendance.map((record) => (
                    <div key={record.id} className="px-5 py-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">{record.employeeName || "Employee"}</p>
                        <p className="text-sm text-gray-500">{formatDate(record.workDate, undefined, "Not set")} · {record.checkIn || "--"} - {record.checkOut || "--"}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold capitalize">
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "leave" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Leave Requests</h2>
            </div>
            {leaveRequests.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f2f2f2] text-[#0a0a0a]">
                  <FaClock size={22} />
                </div>
                <p className="font-semibold text-[#0a0a0a]">No leave requests yet</p>
                <p className="mt-1 text-sm text-[#737373]">Employee leave requests will appear here for review.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {leaveRequests.map((request) => (
                  <div key={request.id} className="px-5 py-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold capitalize ${leaveStatusStyles[request.status] || leaveStatusStyles.pending}`}>
                        {request.status}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-2">{request.employeeName || "Employee"}</h3>
                      <p className="text-sm text-gray-600 capitalize">{request.leaveType} leave</p>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(request.startDate, undefined, "Not set")} - {formatDate(request.endDate, undefined, "Not set")}</p>
                      {request.reason && <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap">{request.reason}</p>}
                    </div>
                    {request.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReviewLeave(request.id, "approved")}
                          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewLeave(request.id, "rejected")}
                          className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Employees;
