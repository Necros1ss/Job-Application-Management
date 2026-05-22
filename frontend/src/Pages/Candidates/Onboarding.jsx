import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaClipboardList } from "react-icons/fa";
import { onboardingApi, usersApi } from "../../lib/api";
import TopBarDashboard from "../../Components/TopBarDashboard";
import { SkeletonCard, SkeletonDashboardCard } from "../../Components/Skeleton";
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

const formatDate = (value) => {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const CandidateOnboarding = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError("");
        const [profile, taskData] = await Promise.all([
          usersApi.me(),
          onboardingApi.listForCandidate(),
        ]);
        setUserName(profile.name || "");
        setUserEmail(profile.email || "");
        setTasks(Array.isArray(taskData) ? taskData : []);
      } catch (err) {
        const message = err.message || "Failed to load onboarding tasks";
        setError(message);
        showError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "completed").length;
    const remaining = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, remaining, completionRate };
  }, [tasks]);

  const handleStatusChange = async (taskId, status) => {
    try {
      const updated = await onboardingApi.updateTaskStatus(taskId, status);
      setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, ...updated } : task)));
      showSuccess("Onboarding task updated");
    } catch (err) {
      showError(err.message || "Failed to update onboarding task");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBarDashboard userName={userName} userEmail={userEmail} />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 pb-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Onboarding</h1>
            <p className="text-gray-500 mt-1">Your offer next steps and pre-start checklist.</p>
          </div>
          <div className="bg-[#116843] text-white rounded-2xl px-5 py-3 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Progress</p>
            <p className="text-2xl font-extrabold">{stats.completionRate}%</p>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-6 bg-red-50 p-3 rounded-lg border border-red-100" role="alert">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {isLoading ? (
            <>
              <SkeletonDashboardCard />
              <SkeletonDashboardCard />
              <SkeletonDashboardCard />
            </>
          ) : (
            <>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Tasks</p>
                <p className="text-4xl font-extrabold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Remaining</p>
                <p className="text-4xl font-extrabold text-amber-700">{stats.remaining}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Completed</p>
                <p className="text-4xl font-extrabold text-[#188155]">{stats.completed}</p>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array(3).fill(0).map((_, index) => <SkeletonCard key={index} />)
          ) : tasks.length === 0 ? (
            <div className="blueprint-card border-dashed p-12 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#f2f2f2] text-[#0a0a0a] flex items-center justify-center mb-4">
                <FaClipboardList size={22} />
              </div>
              <h2 className="font-semibold text-[#0a0a0a] mb-1">No onboarding tasks yet</h2>
              <p className="text-sm text-[#737373]">When you accept an offer, recruiter onboarding tasks will appear here.</p>
            </div>
          ) : (
            tasks.map((task) => (
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
                      <span className="font-semibold">{task.companyName}</span> · {task.jobTitle}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Due: {formatDate(task.dueDate)}</p>
                  </div>

                  <select
                    value={task.status}
                    onChange={(event) => handleStatusChange(task.id, event.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-700 shrink-0"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateOnboarding;
