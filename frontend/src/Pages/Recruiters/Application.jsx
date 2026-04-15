import React, { useState } from 'react';
import ApplicationDetail from './ApplicationDetail';

const mockApplications = [
  {
    id: 1,
    name: 'Althea Moretti',
    ref: 'APP-98234',
    jobTitle: 'Principal Brand Designer',
    department: 'Creative Department',
    stage: 'OFFER STAGE',
    stageColor: 'text-emerald-700 bg-emerald-100',
    stageDot: 'bg-emerald-500',
    subtext: 'Waiting for candidate response',
    matchScore: 94,
    avatar: 'https://api.dicebear.com/8.x/notionists/svg?seed=Althea',
    primaryAction: 'Finalize Hire →',
    secondaryAction: 'View Dossier'
  },
  {
    id: 2,
    name: 'Julian De Luca',
    ref: 'APP-98245',
    jobTitle: 'Senior Product Manager',
    department: 'Technology Unit',
    stage: '2ND INTERVIEW',
    stageColor: 'text-blue-700 bg-blue-100',
    stageDot: 'bg-blue-500',
    subtext: 'Scheduled for Tomorrow, 10:00 AM',
    matchScore: 82,
    avatar: 'https://api.dicebear.com/8.x/notionists/svg?seed=Julian',
    primaryAction: 'Pass to Final →',
    secondaryAction: 'Interview Prep'
  },
  {
    id: 3,
    name: 'Sienna Knight',
    ref: 'APP-98251',
    jobTitle: 'Editorial Art Director',
    department: 'Creative Department',
    stage: 'CV SCREENING',
    stageColor: 'text-emerald-700 bg-emerald-100',
    stageDot: 'bg-emerald-500',
    subtext: 'New Application',
    subtextColor: 'text-orange-500',
    matchScore: 88,
    avatar: 'https://api.dicebear.com/8.x/notionists/svg?seed=Sienna',
    primaryAction: 'Book Screen 📅',
    secondaryAction: 'Quick View'
  },
  {
    id: 4,
    name: 'Leo Chen',
    ref: 'APP-98260',
    jobTitle: 'Visual Designer',
    department: 'Creative Department',
    stage: 'REJECTED',
    stageColor: 'text-red-700 bg-red-100',
    stageDot: 'bg-red-500',
    subtext: 'Skillset mismatch',
    matchScore: 45,
    avatar: 'https://api.dicebear.com/8.x/notionists/svg?seed=Leo',
    primaryAction: '↓',
    secondaryAction: 'View Reason'
  }
];

const Application = () => {
  // State quản lý việc chuyển đổi giữa màn hình Danh sách và màn hình Chi tiết
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Nếu có ứng viên được chọn, render trang Chi tiết (ApplicationDetail)
  if (selectedApplication) {
    // Truyền prop onBack để có thể quay lại danh sách
    return (
      <div className="flex-1">

        <ApplicationDetail candidate={selectedApplication} onBack={() => setSelectedApplication(null)} /> 
        
        <div className="p-8">
          <button 
            onClick={() => setSelectedApplication(null)}
            className="mb-4 text-emerald-600 font-medium hover:underline flex items-center gap-2"
          >
            ← Quay lại danh sách
          </button>
          <div className="bg-white p-8 border rounded-xl shadow-sm text-center">
            <h2 className="text-xl font-bold">Trang chi tiết của {selectedApplication.name}</h2>
            <p className="text-gray-500">Giao diện ApplicationDetail.jsx sẽ được hiển thị ở đây.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Render Màn hình Danh sách ---
  return (
    <div className="flex-1 bg-gray-50/50 p-8 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
          <p className="text-gray-500 mt-1">Streamlining the journey from application to hire.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg flex items-center gap-2 hover:bg-gray-200">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            Configure Funnel
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg flex items-center gap-2 hover:bg-emerald-700 shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Bulk Import CVs
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pending Review</p>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-gray-900">124</span>
            <span className="text-sm font-semibold text-orange-500">Action Required</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Initial Screening</p>
          <span className="text-4xl font-extrabold text-gray-900">56</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Interview Stage</p>
          <span className="text-4xl font-extrabold text-gray-900">32</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Offers Out</p>
          <span className="text-4xl font-extrabold text-gray-900">8</span>
        </div>
      </div>

      {/* Toolbar (Filters & View Toggle) */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-lg cursor-pointer">
            Active Job: <span className="text-emerald-700">Principal Brand Designer</span>
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-lg cursor-pointer">
            Funnel Stage: <span className="text-emerald-700">All Stages</span>
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
          <button className="px-4 py-1.5 bg-white text-emerald-700 rounded-md shadow-sm">Table</button>
          <button className="px-4 py-1.5 text-gray-500 hover:text-gray-700">Pipeline</button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
            {mockApplications.map((app) => (
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
                    {app.primaryAction !== '↓' ? (
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
          </tbody>
        </table>

        {/* Footer / Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>Showing <span className="font-medium text-gray-900">1 to 4</span> of 212 active applications</span>
          <div className="flex gap-1.5">
            <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 text-gray-400">&lt;</button>
            <button className="w-8 h-8 flex items-center justify-center bg-emerald-700 text-white rounded font-medium shadow-sm">1</button>
            <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 font-medium">2</button>
            <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 font-medium">3</button>
            <span className="w-8 h-8 flex items-center justify-center text-gray-400">...</span>
            <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 text-gray-400">&gt;</button>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Application;