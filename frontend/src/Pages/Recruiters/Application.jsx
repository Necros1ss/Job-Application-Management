import React, { useEffect, useMemo, useState } from 'react';
import ApplicationDetail from './ApplicationDetail';
import { applicationsApi, jobPostsApi, usersApi } from '../../lib/api';
import TopBarRecruiter from "../../Components/TopBarRecruiter";
import Pagination from "../../Components/Pagination";

const stageMetaByStatus = {
  accepted: {
    stage: 'OFFER STAGE',
    stageColor: 'text-emerald-700 bg-emerald-100',
    stageDot: 'bg-emerald-500',
  },
  reviewed: {
    stage: '2ND INTERVIEW',
    stageColor: 'text-blue-700 bg-blue-100',
    stageDot: 'bg-blue-500',
  },
  scheduled_interview: {
    stage: 'SCHEDULED INTERVIEW',
    stageColor: 'text-purple-700 bg-purple-100',
    stageDot: 'bg-purple-500',
  },
  applied: {
    stage: 'CV SCREENING',
    stageColor: 'text-emerald-700 bg-emerald-100',
    stageDot: 'bg-emerald-500',
  },
  rejected: {
    stage: 'REJECTED',
    stageColor: 'text-red-700 bg-red-100',
    stageDot: 'bg-red-500',
  },
};

const actionByStatus = {
  accepted: {
    primaryAction: 'Finalize Hire ->',
    secondaryAction: 'View Dossier',
  },
  reviewed: {
    primaryAction: 'Pass to Final ->',
    secondaryAction: 'Interview Prep',
  },
  scheduled_interview: {
    primaryAction: 'Reschedule',
    secondaryAction: 'Interview Details',
  },
  applied: {
    primaryAction: 'Book Screen',
    secondaryAction: 'Quick View',
  },
  rejected: {
    primaryAction: '-',
    secondaryAction: 'View Reason',
  },
};

const scoreByStatus = {
  accepted: 94,
  reviewed: 82,
  scheduled_interview: 86,
  applied: 78,
  rejected: 45,
};

const PAGE_SIZE = 10;

const toTitleCase = (value) => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const formatAppliedDate = (value) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return `Applied on ${date.toLocaleDateString('en-US')}`;
};

const toDisplayRow = (row) => {
  const normalizedStatus = (row.status || '').toLowerCase();
  const stageMeta = stageMetaByStatus[normalizedStatus] || {
    stage: toTitleCase(normalizedStatus || 'applied'),
    stageColor: 'text-gray-700 bg-gray-100',
    stageDot: 'bg-gray-500',
  };
  const actions = actionByStatus[normalizedStatus] || {
    primaryAction: 'Review ->',
    secondaryAction: 'Quick View',
  };

  return {
    id: row.id,
    jobPostId: row.jobPostId,
    applicationDate: row.applicationDate,
    status: normalizedStatus || 'applied',
    name: row.candidateName || 'Unknown Candidate',
    email: row.candidateEmail || '',
    phone: row.candidatePhone || '',
    ref: `APP-${String(row.id).padStart(5, '0')}`,
    jobTitle: row.jobTitle || 'Unknown Position',
    department: row.companyName || 'Unknown Company',
    stage: stageMeta.stage,
    stageColor: stageMeta.stageColor,
    stageDot: stageMeta.stageDot,
    subtext: formatAppliedDate(row.applicationDate),
    matchScore: scoreByStatus[normalizedStatus] || 70,
    avatar: `https://api.dicebear.com/8.x/notionists/svg?seed=${encodeURIComponent(row.candidateName || row.id)}`,
    primaryAction: actions.primaryAction,
    secondaryAction: actions.secondaryAction,
  };
};

const Application = () => {
  // State quản lý việc chuyển đổi giữa màn hình Danh sách và màn hình Chi tiết
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [applications, setApplications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [jobOptions, setJobOptions] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        const [applicationsResult, jobsResult] = await Promise.all([
          applicationsApi.listForRecruiterPaginated({
            page: currentPage,
            limit: PAGE_SIZE,
            jobPostId: selectedJobId,
          }),
          jobPostsApi.listMine(),
        ]);

        const profile = await usersApi.me();
        setUserName(profile.name || "");
        setUserEmail(profile.email || "");

        if (isMounted) {
          const applicationItems = Array.isArray(applicationsResult)
            ? applicationsResult
            : applicationsResult.data || [];
          setApplications(applicationItems);
          setTotalApplications(
            Array.isArray(applicationsResult)
              ? applicationItems.length
              : Number(applicationsResult.total || 0)
          );
          setTotalPages(
            Array.isArray(applicationsResult)
              ? 1
              : Math.max(Number(applicationsResult.totalPages || 1), 1)
          );
          setJobOptions(Array.isArray(jobsResult) ? jobsResult : []);
        }

      } catch (loadError) {
        if (isMounted) {
          setApplications([]);
          setJobOptions([]);
          setError(loadError.message || 'Failed to load applications');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [currentPage, selectedJobId]);

  const filteredApplications = useMemo(() => {
    return [...applications].sort((a, b) => {
      if (selectedJobId === 'all') {
        const titleCompare = (a.jobTitle || '').localeCompare(b.jobTitle || '');
        if (titleCompare !== 0) return titleCompare;
      }

      return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
    });
  }, [applications, selectedJobId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedJobId]);

  const displayApplications = useMemo(
    () => filteredApplications.map(toDisplayRow),
    [filteredApplications]
  );

  const metrics = useMemo(() => {
    const pendingReview = filteredApplications.filter((item) => item.status === 'applied').length;
    const initialScreening = pendingReview;
    const interviewStage = filteredApplications.filter((item) => item.status === 'reviewed' || item.status === 'scheduled_interview').length;
    const offersOut = filteredApplications.filter((item) => item.status === 'accepted').length;

    return {
      pendingReview,
      initialScreening,
      interviewStage,
      offersOut,
    };
  }, [filteredApplications]);

  const selectedJobLabel = useMemo(() => {
    if (selectedJobId === 'all') {
      return 'All Jobs';
    }

    const selected = jobOptions.find((job) => String(job.id) === String(selectedJobId));
    return selected?.title || 'Unknown Position';
  }, [jobOptions, selectedJobId]);

  // Nếu có ứng viên được chọn, render trang Chi tiết (ApplicationDetail)
  if (selectedApplication) {
    return (
      <div className="flex-1">
        <ApplicationDetail candidate={selectedApplication} onBack={() => setSelectedApplication(null)} />
      </div>
    );
  }

  // --- Render Màn hình Danh sách ---
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBarRecruiter 
        userName={userName} 
        userEmail={userEmail}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search jobs by title, company, location..."
      />
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 pb-12">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
            <p className="text-gray-500 mt-1">Streamlining the journey from application to hire.</p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pending Review</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-gray-900">{metrics.pendingReview}</span>
              <span className="text-sm font-semibold text-orange-500">{metrics.pendingReview > 0 ? 'Action Required' : 'Up to date'}</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Initial Screening</p>
            <span className="text-4xl font-extrabold text-gray-900">{metrics.initialScreening}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Interview Stage</p>
            <span className="text-4xl font-extrabold text-gray-900">{metrics.interviewStage}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Offers Out</p>
            <span className="text-4xl font-extrabold text-gray-900">{metrics.offersOut}</span>
          </div>
        </div>

        {/* Toolbar (Filters & View Toggle) */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-lg">
              <span>Active Job:</span>
              <select
                value={selectedJobId}
                onChange={(event) => setSelectedJobId(event.target.value)}
                className="bg-transparent text-emerald-700 font-semibold outline-none cursor-pointer"
              >
                <option value="all">All Jobs</option>
                {jobOptions.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-lg cursor-pointer">
              Funnel Stage: <span className="text-emerald-700">All Stages</span>
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="px-6 py-10 text-center text-gray-500">Loading applications...</div>
          ) : error ? (
            <div className="px-6 py-10 text-center text-red-500">{error}</div>
          ) : (
          <table className="w-full text-left">
            <thead className="bg-white border-b border-gray-100">
              <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-5">Candidate & Application</th>
                <th className="px-6 py-5">Applied Job</th>
                <th className="px-6 py-5">Recruitment Funnel Stage</th>
                <th className="px-6 py-5">Match Score</th>
                <th className="px-6 py-5 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayApplications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                  
                  {/* Cột 1: Thông tin ứng viên */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <img src={app.avatar} alt="avatar" className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200" />
                      <div>
                        <p className="font-bold text-gray-900">{app.name}</p>
                        <p className="text-xs font-medium text-gray-400 mt-0.5">REF: {app.ref}</p>
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: Vị trí ứng tuyển */}
                  <td className="px-6 py-5">
                    <p className="font-bold text-gray-900">{app.jobTitle}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{app.department}</p>
                  </td>

                  {/* Cột 3: Trạng thái (Stage) */}
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${app.stageColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${app.stageDot}`}></span>
                      {app.stage}
                    </span>
                    <p className={`text-xs mt-2 font-medium ${app.subtextColor || 'text-gray-500'}`}>{app.subtext}</p>
                  </td>

                  {/* Cột 4: Mức độ phù hợp (Match Score) */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${app.matchScore >= 80 ? 'bg-emerald-600' : app.matchScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${app.matchScore}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-bold ${app.matchScore >= 80 ? 'text-emerald-700' : 'text-gray-600'}`}>
                        {app.matchScore}%
                      </span>
                    </div>
                  </td>

                  {/* Cột 5: Hành động */}
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setSelectedApplication(app)} // Kích hoạt sự kiện mở chi tiết
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {app.secondaryAction}
                      </button>
                      {app.primaryAction !== '-' ? (
                        <button className="px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors">
                          {app.primaryAction}
                        </button>
                      ) : (
                        <button className="px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                          {app.primaryAction}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {displayApplications.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No applications found for your job posts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}

          {/* Footer / Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>
              Showing {displayApplications.length} of {totalApplications} applications
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Application;
