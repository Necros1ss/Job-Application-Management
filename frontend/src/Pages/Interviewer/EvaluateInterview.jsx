import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar, FaArrowLeft } from "react-icons/fa";
import { interviewerApi } from "../../lib/api/interviewerApi";
import { showError, showSuccess } from "../../utils/toast";

const recommendations = [
  { value: "strong_hire", label: "Strong Hire" },
  { value: "hire", label: "Hire" },
  { value: "no_hire", label: "No Hire" },
  { value: "strong_no_hire", label: "Strong No Hire" },
];

const EvaluateInterview = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [interview, setInterview] = useState(null);
  const [rating, setRating] = useState(0);
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [notes, setNotes] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [error, setError] = useState("");
  const [hasExistingEvaluation, setHasExistingEvaluation] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const interviews = await interviewerApi.getMyInterviews();
        const found = interviews.find((i) => String(i.id) === String(interviewId));
        setInterview(found || null);

        if (found?.evaluationRating > 0) {
          setRating(found.evaluationRating);
          setRecommendation(found.evaluationRecommendation || "");
        }

        // Try to load existing evaluation
        try {
          const evals = await interviewerApi.getEvaluation(interviewId);
          if (evals && evals.length > 0) {
            const ev = evals[0];
            setRating(ev.rating || 0);
            setStrengths(ev.strengths || "");
            setWeaknesses(ev.weaknesses || "");
            setNotes(ev.notes || "");
            setRecommendation(ev.recommendation || "");
            setHasExistingEvaluation(true);
          }
        } catch {
          // No existing evaluation, that's fine
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [interviewId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      showError("Please select a rating");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await interviewerApi.submitEvaluation(interviewId, {
        rating,
        strengths,
        weaknesses,
        notes,
        recommendation: recommendation || null,
      });
      showSuccess(hasExistingEvaluation ? "Evaluation updated successfully" : "Evaluation submitted successfully");
      navigate("/interviewer");
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#737373]">Loading...</p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/interviewer")}
          className="flex items-center gap-2 text-sm text-[#737373] hover:text-black"
        >
          <FaArrowLeft size={12} /> Back to My Interviews
        </button>
        <div className="rounded-[14px] border border-[#c22b10]/20 bg-[#c22b10]/5 p-6">
          <p className="text-sm text-[#c22b10]">Interview not found or you are not assigned as interviewer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/interviewer")}
        className="flex items-center gap-2 text-sm text-[#737373] hover:text-black"
      >
        <FaArrowLeft size={12} /> Back to My Interviews
      </button>

      <div>
        <p className="text-xs font-medium uppercase text-[#737373]">Interview Evaluation</p>
        <h1 className="mt-1 text-3xl font-semibold text-black">Evaluate Interview</h1>
      </div>

      {/* Interview Info */}
      <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-6 shadow-[0_0_0_1px_rgba(10,10,10,0.05)]">
        <h2 className="text-base font-semibold text-black">Interview Details</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-[#737373]">Candidate</p>
            <p className="text-sm font-medium text-black">{interview.candidateName}</p>
          </div>
          <div>
            <p className="text-xs text-[#737373]">Job Title</p>
            <p className="text-sm font-medium text-black">{interview.jobTitle}</p>
          </div>
          <div>
            <p className="text-xs text-[#737373]">Company</p>
            <p className="text-sm font-medium text-black">{interview.companyName}</p>
          </div>
          <div>
            <p className="text-xs text-[#737373]">Date & Time</p>
            <p className="text-sm font-medium text-black">
              {new Date(interview.interviewDateTime).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#737373]">Mode</p>
            <p className="text-sm font-medium text-black capitalize">{interview.mode}</p>
          </div>
          <div>
            <p className="text-xs text-[#737373]">Contact</p>
            <p className="text-sm font-medium text-black">{interview.candidateEmail}</p>
          </div>
        </div>
      </div>

      {/* Evaluation Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-[14px] border border-[#e5e5e5] bg-white p-6 shadow-[0_0_0_1px_rgba(10,10,10,0.05)]"
      >
        <h2 className="text-base font-semibold text-black">Evaluation Form</h2>

        {error && (
          <div className="mt-4 rounded-[10px] border border-[#c22b10]/20 bg-[#c22b10]/5 px-3 py-2 text-sm text-[#c22b10]">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-5">
          {/* Rating */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <FaStar
                    size={28}
                    className={star <= rating ? "text-yellow-500" : "text-gray-300"}
                  />
                </button>
              ))}
              <span className="ml-2 self-center text-sm text-[#737373]">{rating}/5</span>
            </div>
          </div>

          {/* Recommendation */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black">Recommendation</label>
            <div className="flex flex-wrap gap-2">
              {recommendations.map((rec) => (
                <button
                  key={rec.value}
                  type="button"
                  onClick={() => setRecommendation(rec.value)}
                  className={`rounded-[10px] border px-4 py-2 text-sm font-medium transition ${
                    recommendation === rec.value
                      ? "border-black bg-black text-white"
                      : "border-[#e5e5e5] text-[#737373] hover:bg-[#f2f2f2]"
                  }`}
                >
                  {rec.label}
                </button>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black">Strengths</label>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="What did the candidate do well? List key strengths..."
              rows={3}
              className="block w-full rounded-[10px] border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#0a0a0a] outline-none placeholder:text-[#737373] focus:border-black"
            />
          </div>

          {/* Weaknesses */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black">Areas for Improvement</label>
            <textarea
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              placeholder="What could the candidate improve? List weaknesses or gaps..."
              rows={3}
              className="block w-full rounded-[10px] border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#0a0a0a] outline-none placeholder:text-[#737373] focus:border-black"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional observations, red flags, or comments..."
              rows={3}
              className="block w-full rounded-[10px] border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#0a0a0a] outline-none placeholder:text-[#737373] focus:border-black"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="rounded-[10px] bg-black px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#0a0a0a] disabled:opacity-50"
            >
              {submitting ? "Saving..." : hasExistingEvaluation ? "Save Evaluation" : "Submit Evaluation"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/interviewer")}
              className="rounded-[10px] border border-[#e5e5e5] px-6 py-2.5 text-sm font-medium text-[#737373] hover:bg-[#f2f2f2]"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EvaluateInterview;
