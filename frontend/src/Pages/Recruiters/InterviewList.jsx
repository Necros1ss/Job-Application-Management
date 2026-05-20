import React, { useEffect, useMemo, useState } from "react";
import ApplicationDetail from "./ApplicationDetail";
import { interviewsApi, usersApi } from "../../lib/api";
import TopBarRecruiter from "../../Components/TopBarRecruiter";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

const formatInterviewDateTime = (value) => {
  if (!value) return "Not scheduled";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getModeBadge = (mode) => {
  const normalizedMode = (mode || "").toLowerCase();
  const isOnline = normalizedMode === "online";

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
        isOnline
          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
          : "bg-orange-50 text-orange-700 border border-orange-100"
      }`}
    >
      {isOnline ? "Online" : "Offline"}
    </span>
  );
};

const toApplicationDetailCandidate = (interview) => ({
  id: interview.application_id,
  candidateId: interview.candidate_id,
  jobPostId: interview.job_post_id,
  name: interview.candidate_name || "Unknown Candidate",
  candidateName: interview.candidate_name || "Unknown Candidate",
  email: interview.candidate_email || "",
  candidateEmail: interview.candidate_email || "",
  phone: interview.candidate_phone || "",
  candidatePhone: interview.candidate_phone || "",
  jobTitle: interview.job_title || "Unknown Position",
  department: interview.company_name || "Unknown Company",
  companyName: interview.company_name || "Unknown Company",
});

const InterviewList = () => {
  const [interviews, setInterviews] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [profile, interviewData] = await Promise.all([
          usersApi.me(),
          interviewsApi.listForRecruiter(),
        ]);

        if (isMounted) {
          setUserName(profile.name || "");
          setUserEmail(profile.email || "");
          setInterviews(Array.isArray(interviewData) ? interviewData : []);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Failed to load interviews");
          setInterviews([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredInterviews = useMemo(() => {
    const now = new Date();
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return interviews
      .filter((interview) => {
        const interviewDate = new Date(interview.interview_datetime);
        const isPast = !Number.isNaN(interviewDate.getTime()) && interviewDate < now;

        if (activeFilter === "upcoming" && isPast) return false;
        if (activeFilter === "past" && !isPast) return false;

        if (!normalizedSearch) return true;

        return [
          interview.candidate_name,
          interview.job_title,
          interview.company_name,
          interview.interviewer_name,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => new Date(a.interview_datetime) - new Date(b.interview_datetime));
  }, [activeFilter, interviews, searchTerm]);

  if (selectedApplication) {
    return (
      <div className="flex-1">
        <ApplicationDetail candidate={selectedApplication} onBack={() => setSelectedApplication(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBarRecruiter
        userName={userName}
        userEmail={userEmail}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search interviews by candidate, job, company..."
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 pb-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Interviews</h1>
            <p className="text-gray-500 mt-1">Track scheduled interviews across your hiring pipeline.</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeFilter === filter.value
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="px-6 py-10 text-center text-gray-500">Loading interviews...</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-white border-b border-gray-100">
                <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-5">Candidate Name</th>
                  <th className="px-6 py-5">Job Title</th>
                  <th className="px-6 py-5">Date & Time</th>
                  <th className="px-6 py-5">Mode</th>
                  <th className="px-6 py-5">Interviewer</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInterviews.map((interview) => (
                  <tr
                    key={interview.id}
                    className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                    onClick={() => setSelectedApplication(toApplicationDetailCandidate(interview))}
                  >
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-bold text-gray-900">{interview.candidate_name || "Unknown Candidate"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{interview.candidate_email || "No email"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-gray-900">{interview.job_title || "Unknown Position"}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{interview.company_name || "Unknown Company"}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-gray-800">
                        {formatInterviewDateTime(interview.interview_datetime)}
                      </p>
                    </td>
                    <td className="px-6 py-5">{getModeBadge(interview.mode)}</td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-gray-800">{interview.interviewer_name || "—"}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedApplication(toApplicationDetailCandidate(interview));
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        View Detail
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredInterviews.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No interviews found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewList;
