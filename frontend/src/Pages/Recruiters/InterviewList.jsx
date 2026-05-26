/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { FaPen, FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import ApplicationDetail from "./ApplicationDetail";
import { applicationsApi, interviewsApi, usersApi } from "../../lib/api";
import TopBarRecruiter from "../../Components/TopBarRecruiter";
import EmptyState from "../../Components/EmptyState";
import { SkeletonRow } from "../../Components/Skeleton";
import { useI18n } from "../../lib/i18n";
import { showError, showSuccess } from "../../utils/toast";

const FILTERS = [
  { value: "all", labelKey: "interviews.all" },
  { value: "upcoming", labelKey: "interviews.upcoming" },
  { value: "past", labelKey: "interviews.past" },
];

const INITIAL_FORM = {
  applicationId: "",
  interviewerId: "",
  interviewerName: "",
  interviewDateTime: "",
  mode: "online",
  meetLink: "",
  location: "",
  notes: "",
};

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

const toDateTimeInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const getModeBadge = (mode) => {
  const normalizedMode = (mode || "").toLowerCase();
  const isOnline = normalizedMode === "online";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
        isOnline
          ? "border-[#e5e5e5] bg-[#f2f2f2] text-[#0a0a0a]"
          : "border-[#e5e5e5] bg-white text-[#737373]"
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

const InterviewModal = ({ interview, onClose, onSaved }) => {
  const { t } = useI18n();
  const isEdit = Boolean(interview);
  const [applications, setApplications] = useState([]);
  const [applicationSearch, setApplicationSearch] = useState("");
  const [interviewers, setInterviewers] = useState([]);
  const [isLoadingInterviewers, setIsLoadingInterviewers] = useState(true);
  const [form, setForm] = useState(() =>
    interview
      ? {
          applicationId: String(interview.application_id || ""),
          interviewerId: interview.interviewer_id ? String(interview.interviewer_id) : "",
          interviewerName: interview.interviewer_name || "",
          interviewDateTime: toDateTimeInputValue(interview.interview_datetime),
          mode: interview.mode || "online",
          meetLink: interview.meet_link || "",
          location: interview.location || "",
          notes: interview.notes || "",
        }
      : INITIAL_FORM
  );
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadApplications = async () => {
      try {
        setIsLoadingApplications(true);
        const [appRows, interviewerRows] = await Promise.all([
          applicationsApi.listForRecruiter(),
          interviewsApi.listInterviewers(),
        ]);
        const eligibleApplications = appRows.filter((item) =>
          ["applied", "reviewed"].includes(String(item.status || "").toLowerCase())
        );

        if (isMounted) {
          setApplications(eligibleApplications);
          setInterviewers(Array.isArray(interviewerRows) ? interviewerRows : []);
          if (!isEdit && eligibleApplications.length > 0) {
            setForm((current) => ({
              ...current,
              applicationId: current.applicationId || String(eligibleApplications[0].id),
            }));
          }
        }
      } catch (error) {
        if (isMounted) {
          setApplications([]);
          setInterviewers([]);
          showError(error.message || "Failed to load data");
        }
      } finally {
        if (isMounted) {
          setIsLoadingApplications(false);
          setIsLoadingInterviewers(false);
        }
      }
    };

    loadApplications();

    return () => {
      isMounted = false;
    };
  }, [isEdit]);

  const selectedApplication = useMemo(
    () => applications.find((item) => String(item.id) === String(form.applicationId)),
    [applications, form.applicationId]
  );

  const filteredApplications = useMemo(() => {
    const normalizedSearch = applicationSearch.trim().toLowerCase();
    if (!normalizedSearch) return applications;

    return applications.filter((item) =>
      [item.candidateName, item.candidateEmail, item.jobTitle, item.companyName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    );
  }, [applicationSearch, applications]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.applicationId) {
      showError("Please choose an application.");
      return;
    }

    if (!form.interviewerId && !form.interviewerName.trim()) {
      showError("Please select an interviewer account or enter a manual interviewer name.");
      return;
    }

    if (!form.interviewDateTime) {
      showError("Interview time is required.");
      return;
    }

    if (form.mode === "online" && !form.meetLink.trim()) {
      showError("Meet link is required for online interviews.");
      return;
    }

    if (form.mode === "offline" && !form.location.trim()) {
      showError("Location is required for offline interviews.");
      return;
    }

    const selectedInterviewer = interviewers.find((item) => String(item.id) === String(form.interviewerId));

    const payload = {
      applicationId: Number(form.applicationId),
      interviewerId: form.interviewerId ? Number(form.interviewerId) : undefined,
      interviewerName: selectedInterviewer?.name || form.interviewerName.trim(),
      interviewDateTime: form.interviewDateTime,
      mode: form.mode,
      meetLink: form.mode === "online" ? form.meetLink.trim() : "",
      location: form.mode === "offline" ? form.location.trim() : "",
      notes: form.notes.trim(),
    };

    try {
      setIsSaving(true);
      if (isEdit) {
        await interviewsApi.update(interview.id, payload);
        showSuccess("Interview updated successfully.");
      } else {
        await interviewsApi.create(payload);
        showSuccess("Interview scheduled successfully.");
      }
      await onSaved();
      onClose();
    } catch (error) {
      showError(error.message || "Failed to save interview");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="blueprint-card w-full max-w-3xl p-0">
        <div className="flex items-start justify-between border-b border-[#e5e5e5] px-6 py-5">
          <div>
            <p className="blueprint-kicker">{isEdit ? "Edit schedule" : "New schedule"}</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#0a0a0a]">
              {isEdit ? t("interviews.edit") : t("interviews.create")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#737373] transition hover:bg-[#f2f2f2] hover:text-black"
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-[#0a0a0a]">{t("interviews.application")}</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" size={13} />
                <input
                  type="text"
                  value={applicationSearch}
                  onChange={(event) => setApplicationSearch(event.target.value)}
                  placeholder="Search candidate, email, job..."
                  disabled={isEdit}
                  className="blueprint-input w-full pl-9 disabled:bg-[#f2f2f2] disabled:text-[#737373]"
                />
              </div>
              <div className="max-h-72 overflow-y-auto rounded-[14px] border border-[#e5e5e5] bg-white">
                {isLoadingApplications ? (
                  <div className="p-4 text-sm text-[#737373]">Loading applications...</div>
                ) : filteredApplications.length > 0 ? (
                  filteredApplications.map((application) => {
                    const isSelected = String(application.id) === String(form.applicationId);
                    return (
                      <button
                        key={application.id}
                        type="button"
                        disabled={isEdit}
                        onClick={() => updateForm("applicationId", String(application.id))}
                        className={`block w-full border-b border-[#e5e5e5] px-4 py-3 text-left last:border-b-0 disabled:cursor-not-allowed ${
                          isSelected ? "bg-[#f2f2f2]" : "bg-white hover:bg-[#f2f2f2]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-[#0a0a0a]">
                            {application.candidateName || "Unknown Candidate"}
                          </p>
                          <span className="blueprint-tag">{application.status}</span>
                        </div>
                        <p className="mt-1 text-sm text-[#737373]">{application.jobTitle || "Unknown Position"}</p>
                        <p className="mt-0.5 text-xs text-[#737373]">{application.candidateEmail || "No email"}</p>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-sm text-[#737373]">No applied or reviewed applications found.</div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {selectedApplication && (
                <div className="rounded-[14px] border border-[#e5e5e5] bg-[#f2f2f2] p-4">
                  <p className="text-xs font-semibold uppercase text-[#737373]">Selected</p>
                  <p className="mt-1 font-semibold text-[#0a0a0a]">{selectedApplication.candidateName}</p>
                  <p className="text-sm text-[#737373]">{selectedApplication.jobTitle}</p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0a0a0a]">{t("interviews.interviewer")}</label>
                <select
                  value={form.interviewerId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    const selected = interviewers.find((item) => String(item.id) === String(nextId));
                    updateForm("interviewerId", nextId);
                    updateForm("interviewerName", selected?.name || "");
                  }}
                  className="blueprint-input w-full"
                  disabled={isLoadingInterviewers}
                >
                  <option value="">Manual interviewer name</option>
                  {interviewers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.email})
                    </option>
                  ))}
                </select>
                {!form.interviewerId && (
                  <input
                    type="text"
                    value={form.interviewerName}
                    onChange={(event) => updateForm("interviewerName", event.target.value)}
                    placeholder="Interviewer name"
                    className="blueprint-input mt-2 w-full"
                  />
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0a0a0a]">{t("interviews.dateTime")}</label>
                <input
                  type="datetime-local"
                  value={form.interviewDateTime}
                  onChange={(event) => updateForm("interviewDateTime", event.target.value)}
                  className="blueprint-input w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0a0a0a]">{t("interviews.mode")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {["online", "offline"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => updateForm("mode", mode)}
                      className={`rounded-[10px] border px-4 py-2 text-sm font-semibold capitalize transition ${
                        form.mode === mode
                          ? "border-black bg-black text-white"
                          : "border-[#e5e5e5] bg-white text-[#0a0a0a] hover:bg-[#f2f2f2]"
                      }`}
                    >
                      {mode === "online" ? t("interviews.online") : t("interviews.offline")}
                    </button>
                  ))}
                </div>
              </div>

              {form.mode === "online" ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0a0a0a]">Meet link</label>
                  <input
                    type="url"
                    value={form.meetLink}
                    onChange={(event) => updateForm("meetLink", event.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="blueprint-input w-full"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0a0a0a]">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(event) => updateForm("location", event.target.value)}
                    placeholder="Office, floor, room..."
                    className="blueprint-input w-full"
                  />
                </div>
              )}

              <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0a0a0a]">{t("interviews.notes")}</label>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                  rows={4}
                  placeholder="Optional notes for the candidate"
                  className="blueprint-input w-full resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#e5e5e5] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border border-[#e5e5e5] px-4 py-2 text-sm font-semibold text-[#0a0a0a] transition hover:bg-[#f2f2f2]"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={isSaving || isLoadingApplications || isLoadingInterviewers}
            className="blueprint-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? t("common.saving") : isEdit ? t("common.save") : t("interviews.schedule")}
          </button>
        </div>
      </form>
    </div>
  );
};

const getStatusBadge = (interviewDatetime) => {
  const now = new Date();
  const interviewDate = new Date(interviewDatetime);

  if (Number.isNaN(interviewDate.getTime())) {
    return <span className="rounded-full border border-[#e5e5e5] bg-[#f2f2f2] px-2.5 py-1 text-xs font-semibold text-[#737373]">Unknown</span>;
  }

  if (interviewDate < now) {
    return <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">Past</span>;
  }

  const diffHours = (interviewDate - now) / (1000 * 60 * 60);
  if (diffHours <= 24) {
    return <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">Today</span>;
  }
  if (diffHours <= 72) {
    return <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">Soon</span>;
  }
  return <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">Upcoming</span>;
};

const InterviewList = () => {
  const { t } = useI18n();
  const [interviews, setInterviews] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [editingInterview, setEditingInterview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInterviews = async ({ includeProfile = false } = {}) => {
    try {
      setIsLoading(true);
      setError("");

      if (includeProfile) {
        const [profile, interviewData] = await Promise.all([
          usersApi.me(),
          interviewsApi.listForRecruiter(),
        ]);
        setUserName(profile.name || "");
        setUserEmail(profile.email || "");
        setInterviews(Array.isArray(interviewData) ? interviewData : []);
        return;
      }

      const interviewData = await interviewsApi.listForRecruiter();
      setInterviews(Array.isArray(interviewData) ? interviewData : []);
    } catch (loadError) {
      setError(loadError.message || "Failed to load interviews");
      setInterviews([]);
      showError(loadError.message || "Failed to load interviews");
    } finally {
      setIsLoading(false);
    }
  };

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
          showError(loadError.message || "Failed to load interviews");
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

  const openCreateModal = () => {
    setEditingInterview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (interview) => {
    setEditingInterview(interview);
    setIsModalOpen(true);
  };

  if (selectedApplication) {
    return (
      <div className="flex-1">
        <ApplicationDetail candidate={selectedApplication} onBack={() => setSelectedApplication(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TopBarRecruiter
        userName={userName}
        userEmail={userEmail}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t("interviews.searchPlaceholder")}
      />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="blueprint-kicker">{t("interviews.kicker")}</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#0a0a0a]">{t("interviews.title")}</h1>
            <p className="mt-1 text-sm text-[#737373]">{t("interviews.subtitle")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-1 rounded-full border border-[#e5e5e5] bg-white p-1">
              {FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    activeFilter === filter.value
                      ? "bg-black text-white"
                      : "text-[#737373] hover:bg-[#f2f2f2] hover:text-[#0a0a0a]"
                  }`}
                >
                    {t(filter.labelKey)}
                </button>
              ))}
            </div>
            <button type="button" onClick={openCreateModal} className="blueprint-primary inline-flex items-center gap-2">
              <FaPlus size={12} />
              {t("interviews.schedule")}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-[14px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-[14px] border border-[#e5e5e5] bg-white shadow-[0_0_0_1px_rgba(10,10,10,0.05)]">
          {isLoading ? (
            <div className="p-6">
              {[1, 2, 3, 4].map((item) => (
                <SkeletonRow key={item} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="border-b border-[#e5e5e5] bg-[#fafafa]">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-[#737373]">
                    <th className="px-4 py-4">{t("interviews.candidateName")}</th>
                    <th className="px-4 py-4">{t("interviews.jobTitle")}</th>
                    <th className="px-4 py-4">{t("interviews.dateTime")}</th>
                    <th className="px-4 py-4">{t("interviews.mode")}</th>
                    <th className="px-4 py-4">{t("interviews.interviewer")}</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4 text-right">{t("interviews.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0]">
                  {filteredInterviews.map((interview) => (
                    <tr
                      key={interview.id}
                      className="cursor-pointer transition-colors hover:bg-[#fafafa]"
                      onClick={() => setSelectedApplication(toApplicationDetailCandidate(interview))}
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[#0a0a0a]">
                          {interview.candidate_name || "Unknown Candidate"}
                        </p>
                        <p className="mt-0.5 text-xs text-[#737373]">{interview.candidate_email || "No email"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="max-w-[180px] truncate font-semibold text-[#0a0a0a]">{interview.job_title || "Unknown Position"}</p>
                        <p className="mt-0.5 max-w-[160px] truncate text-xs text-[#737373]">{interview.company_name || "Unknown Company"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-[#0a0a0a]">
                          {formatInterviewDateTime(interview.interview_datetime)}
                        </p>
                      </td>
                      <td className="px-4 py-4">{getModeBadge(interview.mode)}</td>
                      <td className="px-4 py-4">
                        <p className="max-w-[140px] truncate text-sm font-semibold text-[#0a0a0a]">{interview.interviewer_name || "-"}</p>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(interview.interview_datetime)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditModal(interview);
                            }}
                            className="rounded-[10px] border border-[#e5e5e5] p-2 text-[#0a0a0a] transition hover:bg-[#f2f2f2]"
                            aria-label="Edit interview"
                          >
                            <FaPen size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedApplication(toApplicationDetailCandidate(interview));
                            }}
                            className="rounded-[10px] border border-[#e5e5e5] px-3 py-2 text-xs font-semibold text-[#0a0a0a] transition hover:bg-[#f2f2f2]"
                          >
                            {t("interviews.viewDetail")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredInterviews.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState
                          icon={FaPlus}
                          title={t("interviews.emptyTitle")}
                          description={t("interviews.emptyDescription")}
                          actionLabel={t("interviews.schedule")}
                          onAction={openCreateModal}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <InterviewModal
          interview={editingInterview}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => loadInterviews()}
        />
      )}
    </div>
  );
};

export default InterviewList;
