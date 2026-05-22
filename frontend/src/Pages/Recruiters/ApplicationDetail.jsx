import React, { useEffect, useMemo, useState } from 'react';
import { applicationsApi, interviewsApi, messagesApi } from '../../lib/api';
import { formatMessageTime } from '../../utils/format';
import { FaArrowLeft, FaDownload, FaEnvelope, FaEye, FaMailBulk, FaRegCalendarAlt, FaCheckCircle } from 'react-icons/fa';
import { showError, showSuccess } from '../../utils/toast';

const STATUS_OPTIONS = [
  { value: 'applied', label: 'New Application', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'reviewed', label: 'Under Review', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'scheduled_interview', label: 'Scheduled Interview', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'accepted', label: 'Offer Extended', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200' },
];

const REJECTION_REASONS = [
  'Skill mismatch',
  'English not sufficient',
  'Experience not enough',
  'No longer hiring',
  'Other',
];

const STATUS_VALUES = new Set(STATUS_OPTIONS.map((o) => o.value));

const DEFAULT_REJECTION_TEMPLATES = {
  'Skill mismatch': 'Thank you for your time and interest. At this stage, we are moving forward with candidates whose experience is a closer match to the role.',
  'English not sufficient': 'Thank you for applying. After reviewing your application, we will not be progressing because the role requires a stronger level of English communication.',
  'Experience not enough': 'Thank you for your application. We appreciate your interest, but we are moving forward with candidates who have more relevant experience for this role.',
  'No longer hiring': 'Thank you for applying. This position is no longer open, so we will not be proceeding further.',
  Other: 'Thank you for your application. After careful review, we will not be moving forward at this time. We appreciate your interest and wish you success in your job search.',
};

const DEFAULT_OFFER_TEMPLATE = (candidateName, candidateJobTitle) => (
  `Hi ${candidateName},\n\nWe are pleased to extend you an offer for the ${candidateJobTitle} position. Please review the details and let us know if you have any questions.\n\nBest regards,`
);

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'NA';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const buildMeetLink = () => {
  const token = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : `${Date.now()}`;
  return `https://meet.google.com/lookup/${token}`;
};

const ApplicationDetail = ({ onBack, candidate }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [rating, setRating] = useState(null);
  const [notes, setNotes] = useState([]);
  const [events, setEvents] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [isSavingRating, setIsSavingRating] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    interviewDateTime: '',
    interviewerName: '',
    mode: 'online',
    meetLink: '',
    location: '',
    notes: '',
  });
  const [rejectForm, setRejectForm] = useState({
    reason: REJECTION_REASONS[0],
    emailBody: DEFAULT_REJECTION_TEMPLATES[REJECTION_REASONS[0]],
  });
  const [offerForm, setOfferForm] = useState({
    subject: '',
    content: '',
  });
  const [messageForm, setMessageForm] = useState({
    subject: '',
    content: '',
  });

  useEffect(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setPreviewError('');

    let isMounted = true;

    const loadApplicationDetail = async () => {
      if (!candidate?.id) {
        if (isMounted) {
          setDetail(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await applicationsApi.getForRecruiter(candidate.id);
        if (isMounted) {
          setDetail(response || null);
          setRating(response?.rating ?? null);
          setNotes(Array.isArray(response?.notes) ? response.notes : []);
          setEvents(Array.isArray(response?.events) ? response.events : []);
        }
      } catch (loadError) {
        if (isMounted) {
          setDetail(null);
          setError(loadError.message || 'Failed to load application detail');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadApplicationDetail();

    return () => {
      isMounted = false;
    };
  }, [candidate?.id]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (showRejectModal && rejectForm.reason) {
      setRejectForm((prev) => ({
        ...prev,
        emailBody: prev.emailBody || DEFAULT_REJECTION_TEMPLATES[prev.reason] || DEFAULT_REJECTION_TEMPLATES.Other,
      }));
    }
  }, [showRejectModal]);

  const source = detail
    ? {
        ...candidate,
        id: detail.id,
        candidateId: detail.candidateId,
        jobPostId: detail.jobPostId,
        applicationDate: detail.applicationDate,
        status: detail.status,
        name: detail.candidateName,
        email: detail.candidateEmail,
        phone: detail.candidatePhone,
        jobTitle: detail.jobTitle,
        department: detail.companyName,
        cvFileName: detail.cvFileName,
      }
    : candidate;

  const candidateName = source?.name || 'Unknown Candidate';
  const candidateJobTitle = source?.jobTitle || 'Unknown Position';
  const candidateEmail = source?.email || 'No email available';
  const candidatePhone = source?.phone || 'No phone available';
  const candidateAppliedDate = formatMessageTime(source?.applicationDate) || 'N/A';
  const normalizedStatus = (source?.status || 'applied').toLowerCase();
  const candidateStatus = STATUS_VALUES.has(normalizedStatus) ? normalizedStatus : 'applied';
  const initials = getInitials(candidateName);
  const cvFileName = source?.cvFileName || 'No CV attached';
  const canPreviewCv = Boolean(source?.id && source?.cvFileName);
  const currentStatusMeta = STATUS_OPTIONS.find((o) => o.value === candidateStatus) || STATUS_OPTIONS[0];

  const refreshWorkflow = async () => {
    if (!source?.id) return;
    const refreshed = await applicationsApi.getForRecruiter(source.id);
    setDetail(refreshed || null);
    setRating(refreshed?.rating ?? null);
    setNotes(Array.isArray(refreshed?.notes) ? refreshed.notes : []);
    setEvents(Array.isArray(refreshed?.events) ? refreshed.events : []);
  };

  const candidateHeader = useMemo(() => ({
    name: candidateName,
    jobTitle: candidateJobTitle,
    email: candidateEmail,
    phone: candidatePhone,
  }), [candidateName, candidateJobTitle, candidateEmail, candidatePhone]);

  const applyOptimisticStatus = async (runner, optimisticStatus, successMessage) => {
    if (!source?.id) return;

    const previousStatus = candidateStatus;
    setIsUpdatingStatus(true);
    setError('');
    setPreviewError('');
    setDetail((prev) => (prev ? { ...prev, status: optimisticStatus } : prev));

    try {
      const response = await runner();
      const nextStatus = response?.status || optimisticStatus;
      setDetail((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      await refreshWorkflow();
      showSuccess(successMessage);
      return response;
    } catch (err) {
      setDetail((prev) => (prev ? { ...prev, status: previousStatus } : prev));
      showError(err.message || 'Failed to update status');
      throw err;
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const updateStatus = async (nextStatus) => {
    if (!source?.id || nextStatus === candidateStatus) return;

    if (nextStatus === 'scheduled_interview') {
      setShowScheduleModal(true);
      return;
    }

    if (nextStatus === 'rejected') {
      setShowRejectModal(true);
      return;
    }

    if (nextStatus === 'accepted') {
      setOfferForm({
        subject: `Offer Extended - ${candidateJobTitle}`,
        content: DEFAULT_OFFER_TEMPLATE(candidateName, candidateJobTitle),
      });
      setShowOfferModal(true);
      return;
    }

    await applyOptimisticStatus(
      () => applicationsApi.updateStatus(source.id, nextStatus),
      nextStatus,
      'Status updated successfully'
    );
  };

  const handleRatingChange = async (nextRating) => {
    if (!source?.id) return;

    try {
      setIsSavingRating(true);
      const updated = await applicationsApi.updateRating(source.id, nextRating);
      setRating(updated.rating);
      showSuccess("Rating updated");
      await refreshWorkflow();
    } catch (err) {
      showError(err.message || "Failed to update rating");
    } finally {
      setIsSavingRating(false);
    }
  };

  const handleAddNote = async () => {
    const note = newNote.trim();
    if (!source?.id || !note) return;

    try {
      setIsSavingNote(true);
      const created = await applicationsApi.addNote(source.id, { note });
      setNotes((current) => [created, ...current]);
      setNewNote("");
      showSuccess("Note saved");
      await refreshWorkflow();
    } catch (err) {
      showError(err.message || "Failed to save note");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handlePreviewCv = async () => {
    if (!source?.id) return;
    try {
      setPreviewLoading(true);
      setPreviewError('');
      const fileBlob = await applicationsApi.getRecruiterCvFile(source.id);
      const nextPreviewUrl = URL.createObjectURL(fileBlob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(nextPreviewUrl);
    } catch (loadError) {
      setPreviewError(loadError.message || 'Unable to preview CV');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadCv = async () => {
    if (!source?.id) return;
    try {
      const fileBlob = await applicationsApi.getRecruiterCvFile(source.id);
      const downloadUrl = URL.createObjectURL(fileBlob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = cvFileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);
      showSuccess('Đã tải CV xuống');
    } catch (loadError) {
      setPreviewError(loadError.message || 'Unable to download CV');
    }
  };

  const openMessageModal = () => {
    if (!source?.candidateId) return;

    setMessageForm({
      subject: `Regarding your application for ${candidateJobTitle}`,
      content: `Hi ${candidateName},\n\nI am reaching out regarding your application for ${candidateJobTitle}.`,
    });
    setShowMessageModal(true);
  };

  const handleMessageSubmit = async (event) => {
    event.preventDefault();
    if (!source?.id || !source?.candidateId) return;

    const subject = messageForm.subject.trim();
    const content = messageForm.content.trim();

    if (!subject || !content) return;

    try {
      setIsSendingMessage(true);
      await messagesApi.send({
        receiverCandidateId: source.candidateId,
        subject,
        content,
        jobPostId: source.jobPostId,
        applicationId: source.id,
      });
      setShowMessageModal(false);
      await refreshWorkflow();
      showSuccess('Đã gửi thư đến candidate');
    } catch (err) {
      showError(err.message || 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleScheduleSubmit = async (event) => {
    event.preventDefault();
    if (!source?.id) return;

    const meetLink = scheduleForm.mode === 'online'
      ? (scheduleForm.meetLink || buildMeetLink())
      : scheduleForm.meetLink;

    await applyOptimisticStatus(
      () => interviewsApi.create({
        applicationId: source.id,
        interviewDateTime: scheduleForm.interviewDateTime,
        interviewerName: scheduleForm.interviewerName,
        mode: scheduleForm.mode,
        meetLink,
        location: scheduleForm.location,
        notes: scheduleForm.notes,
      }),
      'scheduled_interview',
      'Interview scheduled successfully'
    );

    setShowScheduleModal(false);
    await refreshWorkflow();
    setScheduleForm({
      interviewDateTime: '',
      interviewerName: '',
      mode: 'online',
      meetLink: '',
      location: '',
      notes: '',
    });
  };

  const handleRejectSubmit = async (event) => {
    event.preventDefault();
    if (!source?.id) return;

    await applyOptimisticStatus(
      () => applicationsApi.reject(source.id, {
        reason: rejectForm.reason,
        emailBody: rejectForm.emailBody,
      }),
      'rejected',
      'Application rejected successfully'
    );

    setShowRejectModal(false);
    await refreshWorkflow();
  };

  const handleOfferSubmit = async (event) => {
    event.preventDefault();
    if (!source?.id || !source?.candidateId) return;

    const subject = offerForm.subject.trim();
    const content = offerForm.content.trim();

    if (!subject || !content) return;

    try {
      setIsSendingMessage(true);
      await applicationsApi.offer(source.id, {
        subject,
        content,
      });

      setShowOfferModal(false);
      setDetail((prev) => (prev ? { ...prev, status: 'accepted' } : prev));
      await refreshWorkflow();
      showSuccess('Đã gửi offer và cập nhật trạng thái');
    } catch (err) {
      showError(err.message || 'Failed to send offer');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getAvatarColor = () => {
    const colors = [
      'bg-emerald-100 text-emerald-700',
      'bg-blue-100 text-blue-700',
      'bg-purple-100 text-purple-700',
      'bg-orange-100 text-orange-700',
      'bg-pink-100 text-pink-700',
      'bg-teal-100 text-teal-700',
    ];
    const index = candidateName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const avatarColor = getAvatarColor();
  const isBusy = isUpdatingStatus || previewLoading;

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-medium transition-colors"
          >
            <FaArrowLeft size={18} />
            Back to Applications
          </button>
        </div>

        {(error || previewError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {error || previewError}
          </div>
        )}

        <div className="flex gap-6">
          <div className="flex-[3] flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden min-h-[600px]">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">CV: {cvFileName}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadCv}
                    disabled={!canPreviewCv || isBusy}
                    className="text-sm text-emerald-600 hover:underline font-medium disabled:text-gray-400 disabled:no-underline"
                  >
                    Download
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-gray-100 flex items-center justify-center m-4 rounded-xl border border-dashed border-gray-300 overflow-hidden">
                {previewUrl ? (
                  <iframe title="CV Preview" src={previewUrl} className="w-full h-full bg-white" />
                ) : (
                  <div className="text-center px-6">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaEye size={24} className="text-gray-400" />
                    </div>
                    {previewError ? (
                      <p className="text-sm text-red-500">{previewError}</p>
                    ) : (
                      <>
                        <button
                          onClick={handlePreviewCv}
                          disabled={!canPreviewCv || previewLoading}
                          className="px-4 py-2 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-sm font-medium disabled:text-gray-400 disabled:border-gray-200 disabled:hover:bg-transparent"
                        >
                          {previewLoading ? 'Loading...' : 'Click to Preview CV'}
                        </button>
                        {!canPreviewCv && <p className="mt-3 text-sm text-gray-400">No CV file attached to this application.</p>}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-800 mb-3">Cover Letter</h3>
              {source?.coverLetter ? (
                <p className="text-sm text-gray-600 leading-7 whitespace-pre-wrap">{source.coverLetter}</p>
              ) : (
                <p className="text-sm text-gray-400">No cover letter was included with this application.</p>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4">Timeline</h3>
              {events.length === 0 ? (
                <p className="text-sm text-gray-500">No activity yet.</p>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="mt-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{event.title}</p>
                        {event.description && <p className="text-sm text-gray-500 mt-1">{event.description}</p>}
                        <p className="text-xs text-gray-400 mt-1">{formatMessageTime(event.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-[2] flex flex-col gap-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold ${avatarColor}`}>
                  {initials}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{candidateHeader.name}</h2>
                  <p className="text-sm text-emerald-600 font-medium mt-0.5">{candidateHeader.jobTitle}</p>
                  <div className="mt-2 space-y-1 text-sm text-gray-500">
                    <p>{candidateHeader.email}</p>
                    <p>{candidatePhone !== 'No phone available' ? candidatePhone : ''}</p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-400">Applied on {candidateAppliedDate}</div>

              <div className="mt-5 pt-5 border-t border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Application Status</label>
                <select
                  value={candidateStatus}
                  onChange={(e) => updateStatus(e.target.value)}
                  disabled={isBusy}
                  className={`w-full border rounded-xl px-4 py-2.5 font-semibold text-sm focus:ring-2 focus:ring-emerald-200 outline-none transition-all cursor-pointer ${currentStatusMeta.color} border-current`}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="text-gray-800 bg-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
                {isUpdatingStatus && <p className="text-xs text-gray-400 mt-1">Updating...</p>}
              </div>

              <div className="mt-5 pt-5 border-t border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Recruiter Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      disabled={isSavingRating}
                      onClick={() => handleRatingChange(value)}
                      className={`w-9 h-9 rounded-lg border text-sm font-bold ${
                        rating >= value
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  {rating && (
                    <button type="button" onClick={() => handleRatingChange(null)} className="text-xs text-gray-400 hover:text-red-500">
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => updateStatus('accepted')}
                  disabled={isBusy || candidateStatus === 'accepted'}
                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-medium text-sm hover:bg-emerald-100 transition-colors disabled:opacity-60"
                >
                  <FaCheckCircle size={16} />
                  Offer Extended
                </button>
                <button
                  onClick={() => updateStatus('reviewed')}
                  disabled={isBusy}
                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-medium text-sm hover:bg-emerald-100 transition-colors disabled:opacity-60"
                >
                  <FaMailBulk size={16} />
                  Move to Interview Stage
                </button>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  disabled={isBusy}
                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-medium text-sm hover:bg-blue-100 transition-colors disabled:opacity-60"
                >
                  <FaRegCalendarAlt size={16} />
                  Schedule Interview
                </button>
                <button
                  onClick={openMessageModal}
                  disabled={isBusy}
                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-slate-50 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-100 transition-colors disabled:opacity-60"
                >
                  <FaEnvelope size={16} />
                  Send Message
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isBusy}
                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium text-sm hover:bg-red-100 transition-colors disabled:opacity-60"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject Application
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4">Internal Notes</h3>
              <textarea
                rows="4"
                value={newNote}
                onChange={(event) => setNewNote(event.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none resize-none text-sm"
                placeholder="Add a private note about this candidate..."
              />
              <button
                type="button"
                onClick={handleAddNote}
                disabled={isSavingNote || !newNote.trim()}
                className="mt-3 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors disabled:bg-gray-300"
              >
                {isSavingNote ? "Saving..." : "Save Note"}
              </button>
              <div className="mt-4 space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
                    <p className="text-xs text-gray-400 mt-2">{formatMessageTime(note.createdAt)}</p>
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-sm text-gray-400">No internal notes yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Schedule Interview</h3>
                <p className="text-sm text-gray-500">Create an interview slot for this candidate.</p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-700">×</button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Interview Date & Time</span>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleForm.interviewDateTime}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, interviewDateTime: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Interviewer</span>
                  <input
                    type="text"
                    required
                    value={scheduleForm.interviewerName}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, interviewerName: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="HR / Hiring Manager name"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Mode</span>
                  <select
                    value={scheduleForm.mode}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, mode: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Location / Link</span>
                  <input
                    type="text"
                    value={scheduleForm.mode === 'online' ? scheduleForm.meetLink : scheduleForm.location}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (scheduleForm.mode === 'online') {
                        setScheduleForm((prev) => ({ ...prev, meetLink: value }));
                      } else {
                        setScheduleForm((prev) => ({ ...prev, location: value }));
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder={scheduleForm.mode === 'online' ? 'Google Meet link (auto generated if empty)' : 'Interview location'}
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Email Content / Notes</span>
                <textarea
                  rows="4"
                  required
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                  placeholder="This text will be sent to the candidate as the interview email content..."
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" disabled={isUpdatingStatus} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:bg-gray-300">
                  {isUpdatingStatus ? 'Saving...' : 'Save Interview'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Reject Application</h3>
                <p className="text-sm text-gray-500">Choose a reason and edit the rejection email before sending.</p>
              </div>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-700">×</button>
            </div>
            <form onSubmit={handleRejectSubmit} className="p-5 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Reason</span>
                <select
                  value={rejectForm.reason}
                  onChange={(e) => {
                    const reason = e.target.value;
                    setRejectForm((prev) => ({
                      ...prev,
                      reason,
                      emailBody: DEFAULT_REJECTION_TEMPLATES[reason] || prev.emailBody,
                    }));
                  }}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {REJECTION_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Email Template</span>
                <textarea
                  rows="7"
                  value={rejectForm.emailBody}
                  onChange={(e) => setRejectForm((prev) => ({ ...prev, emailBody: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowRejectModal(false)} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" disabled={isUpdatingStatus} className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:bg-gray-300">
                  {isUpdatingStatus ? 'Saving...' : 'Reject & Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Offer Extended</h3>
                <p className="text-sm text-gray-500">Send the offer email before marking the application as accepted.</p>
              </div>
              <button onClick={() => setShowOfferModal(false)} className="text-gray-400 hover:text-gray-700">×</button>
            </div>
            <form onSubmit={handleOfferSubmit} className="p-5 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Subject</span>
                <input
                  type="text"
                  required
                  value={offerForm.subject}
                  onChange={(e) => setOfferForm((prev) => ({ ...prev, subject: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="Offer subject"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Email Body</span>
                <textarea
                  rows="10"
                  required
                  value={offerForm.content}
                  onChange={(e) => setOfferForm((prev) => ({ ...prev, content: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                  placeholder="Write the offer email..."
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowOfferModal(false)} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" disabled={isSendingMessage} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:bg-gray-300">
                  {isSendingMessage ? 'Sending...' : 'Send Offer Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Send Message</h3>
                <p className="text-sm text-gray-500">This message will appear in the candidate inbox.</p>
              </div>
              <button onClick={() => setShowMessageModal(false)} className="text-gray-400 hover:text-gray-700">×</button>
            </div>
            <form onSubmit={handleMessageSubmit} className="p-5 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Subject</span>
                <input
                  type="text"
                  required
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm((prev) => ({ ...prev, subject: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="Write a short subject"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Message</span>
                <textarea
                  rows="8"
                  required
                  value={messageForm.content}
                  onChange={(e) => setMessageForm((prev) => ({ ...prev, content: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                  placeholder="Type your message to the candidate..."
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowMessageModal(false)} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" disabled={isSendingMessage} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:bg-gray-300">
                  {isSendingMessage ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetail;
