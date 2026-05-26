import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaCalendar, FaStar } from "react-icons/fa";
import { interviewerApi } from "../../lib/api/interviewerApi";

const recommendationLabels = {
  strong_hire: "Strong Hire",
  hire: "Hire",
  no_hire: "No Hire",
  strong_no_hire: "Strong No Hire",
};

const recommendationColors = {
  strong_hire: "bg-green-100 text-green-800",
  hire: "bg-green-50 text-green-700",
  no_hire: "bg-red-50 text-red-700",
  strong_no_hire: "bg-red-100 text-red-800",
};

const modeColors = {
  online: "bg-blue-100 text-blue-800",
  offline: "bg-purple-100 text-purple-800",
};

const InterviewerDashboard = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const loadInterviews = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await interviewerApi.getMyInterviews();
      setInterviews(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  const filtered = interviews.filter((i) => {
    if (filter === "upcoming") return new Date(i.interviewDateTime) >= new Date();
    if (filter === "past") return new Date(i.interviewDateTime) < new Date();
    return true;
  });

  const renderStars = (rating) => {
    const stars = [];
    for (let j = 1; j <= 5; j++) {
      stars.push(
        <FaStar
          key={j}
          size={12}
          className={j <= rating ? "text-yellow-500" : "text-gray-300"}
        />
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase text-[#737373]">Interviewer</p>
        <h1 className="mt-1 text-3xl font-semibold text-black">My Interviews</h1>
        <p className="mt-1 text-sm text-[#737373]">View your assigned interviews and submit evaluations.</p>
      </div>

      <div className="flex gap-2">
        {["all", "upcoming", "past"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-[10px] px-4 py-2 text-sm font-medium transition ${
              filter === f
                ? "bg-black text-white"
                : "border border-[#e5e5e5] text-[#737373] hover:bg-[#f2f2f2]"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-[#737373]">Loading...</p>
        </div>
      ) : error ? (
        <div className="rounded-[14px] border border-[#c22b10]/20 bg-[#c22b10]/5 p-4">
          <p className="text-sm text-[#c22b10]">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-12 text-center">
          <FaCalendar className="mx-auto text-4xl text-[#e5e5e5]" />
          <p className="mt-4 text-base font-medium text-black">No interviews found</p>
          <p className="mt-1 text-sm text-[#737373]">Your assigned interviews will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((interview) => (
            <div
              key={interview.id}
              className="rounded-[14px] border border-[#e5e5e5] bg-white p-5 shadow-[0_0_0_1px_rgba(10,10,10,0.05)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-black">{interview.candidateName}</h3>
                      <p className="mt-0.5 text-sm text-[#737373]">{interview.jobTitle} · {interview.companyName}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${modeColors[interview.mode] || "bg-gray-100 text-gray-800"}`}>
                      {interview.mode}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#737373]">
                    <div>
                      <span className="font-medium">Date: </span>
                      {new Date(interview.interviewDateTime).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div>
                      <span className="font-medium">Time: </span>
                      {new Date(interview.interviewDateTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {interview.meetLink && (
                      <div>
                        <a
                          href={interview.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Join Meeting
                        </a>
                      </div>
                    )}
                    {interview.location && (
                      <div>
                        <span className="font-medium">Location: </span>
                        {interview.location}
                      </div>
                    )}
                  </div>

                  {interview.notes && (
                    <p className="mt-2 text-sm text-[#737373]">{interview.notes}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  {interview.evaluationRating > 0 ? (
                    <div className="flex flex-col items-end gap-1">
                      {renderStars(interview.evaluationRating)}
                      {interview.evaluationRecommendation && (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${recommendationColors[interview.evaluationRecommendation]}`}>
                          {recommendationLabels[interview.evaluationRecommendation]}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                      Pending evaluation
                    </span>
                  )}
                  <Link
                    to={`/interviewer/evaluate/${interview.id}`}
                    className="mt-1 rounded-[10px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#0a0a0a]"
                  >
                    {interview.evaluationRating > 0 ? "Update Evaluation" : "Evaluate"}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewerDashboard;
