import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaClipboardList, FaPlus, FaTrashAlt } from "react-icons/fa";
import { onboardingApi, usersApi } from "../../lib/api";
import TopBarRecruiter from "../../Components/TopBarRecruiter";
import { SkeletonCard } from "../../Components/Skeleton";
import { formatDate } from "../../utils/format";
import { showError, showSuccess } from "../../utils/toast";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const statusStyles = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const Onboarding = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [tasks, setTasks] = useState([]);
  const [acceptedApplications, setAcceptedApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    applicationId: "",
    title: "",
    description: "",
    dueDate: "",
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const [profile, taskData, applicationData] = await Promise.all([
        usersApi.me(),
        onboardingApi.listForRecruiter(),
        onboardingApi.listAcceptedApplications(),
      ]);
      setUserName(profile.name || "");
      setUserEmail(profile.email || "");
      setTasks(Array.isArray(taskData) ? taskData : []);
      setAcceptedApplications(Array.isArray(applicationData) ? applicationData : []);
      setForm((current) => ({
        ...current,
        applicationId: current.applicationId || String(applicationData?.[0]?.id || ""),
      }));
    } catch (err) {
      const message = err.message || "Failed to load onboarding";
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
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "completed").length;
    const inProgress = tasks.filter((task) => task.status === "in_progress").length;
    const pending = tasks.filter((task) => task.status === "pending").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, pending, completionRate };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return tasks;

    return tasks.filter((task) =>
      [
        task.title,
        task.description,
        task.candidateName,
        task.candidateEmail,
        task.jobTitle,
        task.companyName,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search))
    );
  }, [searchTerm, tasks]);

  const handleCreateTask = async (event) => {
    event.preventDefault();

    try {
      setIsSaving(true);
      const created = await onboardingApi.createTask({
        applicationId: Number(form.applicationId),
        title: form.title,
        description: form.description,
        dueDate: form.dueDate || null,
      });
      setTasks((current) => [created, ...current]);
      setForm((current) => ({
        applicationId: current.applicationId,
        title: "",
        description: "",
        dueDate: "",
      }));
      showSuccess("Onboarding task created");
      await loadData();
    } catch (err) {
      showError(err.message || "Failed to create onboarding task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      const updated = await onboardingApi.updateTaskStatus(taskId, status);
      setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, ...updated } : task)));
      showSuccess("Onboarding task updated");
    } catch (err) {
      showError(err.message || "Failed to update onboarding task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await onboardingApi.deleteTask(taskId);
      setTasks((current) => current.filter((task) => task.id !== taskId));
      showSuccess("Onboarding task deleted");
    } catch (err) {
      showError(err.message || "Failed to delete onboarding task");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBarRecruiter
        userName={userName}
        userEmail={userEmail}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search onboarding by candidate, job, task..."
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 pb-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Onboarding</h1>
            <p className="text-gray-500 mt-1">Turn accepted candidates into prepared new hires.</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Completion</p>
            <p className="text-2xl font-extrabold text-emerald-800">{stats.completionRate}%</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          {[
            ["Total Tasks", stats.total, "text-gray-900"],
            ["Pending", stats.pending, "text-slate-700"],
            ["In Progress", stats.inProgress, "text-amber-700"],
            ["Completed", stats.completed, "text-emerald-700"],
          ].map(([label, value, color]) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
              <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-8">
          <form onSubmit={handleCreateTask} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-fit">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FaPlus />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Create Task</h2>
                <p className="text-xs text-gray-500">For accepted applications only</p>
              </div>
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Candidate</label>
            <select
              value={form.applicationId}
              onChange={(event) => setForm((current) => ({ ...current, applicationId: event.target.value }))}
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

            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Task Title</label>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 mb-4"
              placeholder="Prepare contract"
              required
            />

            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 mb-4 resize-none"
              rows={4}
              placeholder="Add context, documents, or next steps..."
            />

            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 mb-5"
            />

            <button
              type="submit"
              disabled={isSaving || !form.applicationId}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-300"
            >
              <FaClipboardList />
              {isSaving ? "Creating..." : "Add Task"}
            </button>
          </form>

          <div className="space-y-4">
            {isLoading ? (
              Array(3).fill(0).map((_, index) => <SkeletonCard key={index} />)
            ) : filteredTasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <FaClipboardList size={22} />
                </div>
                <h2 className="font-bold text-gray-900 mb-1">No onboarding tasks yet</h2>
                <p className="text-sm text-gray-500">Create a task once a candidate accepts an offer.</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full border text-xs font-bold capitalize ${statusStyles[task.status] || statusStyles.pending}`}>
                          {task.status.replace("_", " ")}
                        </span>
                        {task.status === "completed" && <FaCheckCircle className="text-emerald-600" />}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                      {task.description && <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{task.description}</p>}
                      <p className="text-sm text-gray-700 mt-3">
                        <span className="font-semibold">{task.candidateName}</span> · {task.jobTitle}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Due: {formatDate(task.dueDate, undefined, "No due date")}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={task.status}
                        onChange={(event) => handleStatusChange(task.id, event.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-700"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2.5 rounded-xl text-red-500 bg-red-50 hover:bg-red-100"
                        title="Delete task"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
