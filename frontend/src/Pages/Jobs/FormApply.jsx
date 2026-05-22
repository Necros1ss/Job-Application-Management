import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheck, FaFileAlt, FaSpinner, FaTimes, FaUpload } from "react-icons/fa";
import { applyFromJob } from "../../lib/api";
import { showError, showSuccess } from "../../utils/toast";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_COVER_LETTER = 2000;
const WARNING_COVER_LETTER = 1800;
const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx"]);

const formatFileSize = (size = 0) => {
  if (size < 1024 * 1024) {
    return `${Math.max(size / 1024, 1).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileExtension = (fileName = "") => fileName.split(".").pop()?.toLowerCase() || "";

const FormApply = ({ isOpen, onClose, jobDetail, onSuccess }) => {
  const navigate = useNavigate();
  const [cvFile, setCvFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cvError, setCvError] = useState("");
  const [shouldShake, setShouldShake] = useState(false);
  const [successTick, setSuccessTick] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsDragging(false);
      setCvError("");
      setShouldShake(false);
      setSuccessTick(false);
    }
  }, [isOpen]);

  const coverLetterCount = coverLetter.length;
  const isCoverLetterTooLong = coverLetterCount > MAX_COVER_LETTER;
  const counterClass = useMemo(() => {
    if (isCoverLetterTooLong) return "text-red-600";
    if (coverLetterCount > WARNING_COVER_LETTER) return "text-orange-600";
    return "text-[#737373]";
  }, [coverLetterCount, isCoverLetterTooLong]);

  if (!isOpen) return null;

  const resetForm = () => {
    setCvFile(null);
    setCoverLetter("");
    setCvError("");
    setShouldShake(false);
    setSuccessTick(false);
  };

  const handleClose = () => {
    if (isLoading) return;
    resetForm();
    onClose();
  };

  const validateAndSetFile = (file) => {
    if (!file) return;

    const extension = getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      setCvFile(null);
      setCvError("Only PDF, DOC and DOCX files are allowed.");
      showError("Only PDF, DOC and DOCX files are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setCvFile(null);
      setCvError("CV file must be 20MB or smaller.");
      showError("CV file must be 20MB or smaller.");
      return;
    }

    setCvFile(file);
    setCvError("");
  };

  const handleApplySubmit = async (event) => {
    event.preventDefault();

    if (!cvFile) {
      setCvError("Please upload your CV before submitting.");
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 450);
      showError("Please upload your CV before submitting.");
      return;
    }

    if (isCoverLetterTooLong) {
      showError("Cover letter must be 2000 characters or fewer.");
      return;
    }

    try {
      setIsLoading(true);
      await applyFromJob(jobDetail?.id, cvFile, coverLetter);
      setSuccessTick(true);
      showSuccess("Application submitted successfully.");
      if (onSuccess) onSuccess();
      setTimeout(() => {
        resetForm();
        onClose();
        navigate("/candidate/job");
      }, 650);
    } catch (error) {
      showError(error.message || "Failed to submit application.");
    } finally {
      setIsLoading(false);
    }
  };

  const uploadBorderClass = cvError
    ? "border-red-300 bg-red-50"
    : cvFile
      ? "border-black bg-[#f2f2f2]"
      : isDragging
        ? "border-black bg-[#f2f2f2]"
        : "border-[#e5e5e5] bg-white hover:bg-[#f2f2f2]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
      <div className="blueprint-card w-full max-w-xl p-0 shadow-xl">
        <div className="flex items-start justify-between border-b border-[#e5e5e5] px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-[#737373]">Apply for: {jobDetail?.title || "Selected role"}</p>
            <p className="mt-1 text-sm text-[#737373]">at {jobDetail?.companyName || jobDetail?.company_name || "Company"}</p>
            <h3 className="mt-3 text-2xl font-semibold text-[#0a0a0a]">Submit Your Application</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-[#737373] transition hover:bg-[#f2f2f2] hover:text-black"
            aria-label="Close application form"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleApplySubmit} className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#0a0a0a]">
              Upload CV <span className="text-red-600">*</span>
            </label>
            <label
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                validateAndSetFile(event.dataTransfer.files?.[0]);
              }}
              className={`flex min-h-36 w-full cursor-pointer flex-col items-center justify-center rounded-[14px] border-2 border-dashed px-5 py-6 text-center transition ${uploadBorderClass} ${
                shouldShake ? "animate-shake" : ""
              }`}
            >
              {cvFile ? (
                <div className="flex w-full items-center justify-between gap-4 rounded-[10px] border border-[#e5e5e5] bg-white px-4 py-3 text-left">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f2f2f2] text-[#0a0a0a]">
                      <FaFileAlt />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0a0a0a]">{cvFile.name}</p>
                      <p className="text-xs text-[#737373]">
                        {getFileExtension(cvFile.name).toUpperCase()} - {formatFileSize(cvFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      setCvFile(null);
                    }}
                    className="rounded-full p-2 text-[#737373] transition hover:bg-[#f2f2f2] hover:text-black"
                    aria-label="Remove CV"
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#f2f2f2] text-[#0a0a0a]">
                    <FaUpload />
                  </div>
                  <p className="text-sm text-[#737373]">
                    <span className="font-semibold text-[#0a0a0a]">Click to upload</span> or drag and drop
                  </p>
                  <p className="mt-2 text-xs text-[#737373]">PDF, DOC, DOCX up to 20MB</p>
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(event) => validateAndSetFile(event.target.files?.[0])}
              />
            </label>
            {cvError && <p className="mt-2 text-sm font-medium text-red-600">{cvError}</p>}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-semibold text-[#0a0a0a]">Cover Letter</label>
              <span className={`text-xs font-semibold ${counterClass}`}>{coverLetterCount} / 2000</span>
            </div>
            <textarea
              rows="5"
              className={`blueprint-input w-full resize-none ${isCoverLetterTooLong ? "border-red-300" : ""}`}
              placeholder="Write a short introduction about yourself and why you are a fit for this role..."
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-[10px] px-5 py-2.5 font-semibold text-[#0a0a0a] transition hover:bg-[#f2f2f2]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || successTick || isCoverLetterTooLong}
              className={`inline-flex min-w-[190px] items-center justify-center gap-2 rounded-[10px] px-6 py-2.5 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
                successTick ? "bg-[#10c22b]" : "bg-black hover:bg-[#171717]"
              }`}
            >
              {successTick ? (
                <>
                  <FaCheck />
                  Submitted
                </>
              ) : isLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormApply;
