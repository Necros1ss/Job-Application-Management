import React, { useState } from 'react';

const initialJobs = [
  { id: 1, title: 'Senior Frontend Engineer', department: 'Engineering • React / TypeScript', status: 'ĐANG MỞ', applicants: 128, closedate: 'Oct 24, 2023', icon: 'brackets' },
  { id: 2, title: 'Product Designer', department: 'Design • UI/UX / Figma', status: 'BẢN NHÁP', applicants: '-', closedate: 'Not set', icon: 'palette' },
  { id: 3, title: 'Growth Marketing Manager', department: 'Marketing • Analytics / Ads', status: 'ĐÃ ĐÓNG', applicants: 412, closedate: 'Sep 12, 2023', icon: 'chart' },
  { id: 4, title: 'Data Scientist', department: 'Analytics • Python / SQL', status: 'ĐANG MỞ', applicants: 54, closedate: 'Nov 05, 2023', icon: 'database' },
];

const jobIcons = {
    brackets: (<svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>),
    palette: (<svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>),
    chart: (<svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>),
    database: (<svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>)
}

const actionIcons = {
    edit: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>),
    view: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>),
    delete: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>)
}

function JobPost() {
  const [jobs, setJobs] = useState(initialJobs);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'ĐANG MỞ': return 'bg-emerald-100 text-emerald-800';
      case 'BẢN NHÁP': return 'bg-blue-100 text-blue-800';
      case 'ĐÃ ĐÓNG': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const NavItem = ({ icon, label, active }) => (
    <a href="#" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'}`}>
      {icon}
      {label}
    </a>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}


      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="relative w-96">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="search" placeholder="Search for jobs, candidates, or applications..." className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none" />
          </div>
          <div className="flex items-center gap-6">
            <button className="text-gray-500 hover:text-gray-700 relative">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className='absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white'></span>
            </button>
             <button className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </button>
            <div className="flex items-center gap-3">
              <img src="https://api.dicebear.com/8.x/notionists/svg?seed=Alex" alt="User avatar" className="w-10 h-10 rounded-full border-2 border-emerald-100" />
              <div>
                <span className="font-semibold text-sm">Alex Sterling</span>
                <span className="block text-xs text-gray-500">HR Director</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-8 flex-1">
          <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold text-emerald-950">Tin tuyển dụng</h1>
                <p className="text-gray-600 mt-1">Manage your active, draft and closed recruitment campaigns.</p>
            </div>
            <div className='flex items-center gap-3'>
                <button className='flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50'>
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    Filters
                </button>
                <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-800 text-white rounded-lg text-sm font-semibold hover:bg-emerald-900 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Create Posting
                </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mb-10">
            {[ { label: 'TOTAL JOBS', value: '24' }, { label: 'APPLICANTS', value: '1,482' }, { label: 'INTERVIEWS', value: '86' }, { label: 'OFFERS SENT', value: '12', color: 'text-emerald-600' } ].map(stat => (
              <div key={stat.label} className={`bg-white p-6 rounded-2xl shadow-sm border ${stat.color ? 'border-emerald-100' : 'border-gray-100'}`}>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</span>
                <span className={`block text-4xl font-extrabold mt-2 ${stat.color || 'text-emerald-950'}`}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="border-b border-gray-100">
                <tr className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                  <th className="px-6 py-4">JOB TITLE</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4 text-center">CANDIDATES</th>
                  <th className="px-6 py-4">CLOSING DATE</th>
                  <th className="px-6 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {jobs.map((job) => (
                  <tr key={job.id} className='hover:bg-emerald-50/30 transition-colors'>
                    <td className="px-6 py-5">
                        <div className='flex items-center gap-4'>
                            <div className='w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center'>{jobIcons[job.icon]}</div>
                            <div>
                                <span className="font-semibold text-gray-950">{job.title}</span>
                                <span className="block text-sm text-gray-500 mt-0.5">{job.department}</span>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusStyle(job.status)}`}>{job.status}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                        <span className='font-semibold text-lg text-gray-900'>{job.applicants}</span>
                        {job.id === 1 && <span className='block text-xs text-emerald-600 mt-0.5'>+12 today</span>}
                        {job.id === 4 && <span className='block text-xs text-emerald-600 mt-0.5'>+2 today</span>}
                    </td>
                    <td className="px-6 py-5 text-gray-600 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {job.closedate}
                    </td>
                    <td className="px-6 py-5 text-right text-gray-400">
                        <div className='flex items-center justify-end gap-2'>
                            <button className='p-2 hover:text-emerald-600 hover:bg-emerald-100 rounded-lg'>{actionIcons.edit}</button>
                            <button className='p-2 hover:text-emerald-600 hover:bg-emerald-100 rounded-lg'>{actionIcons.view}</button>
                            <button className='p-2 hover:text-red-600 hover:bg-red-100 rounded-lg'>{actionIcons.delete}</button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <footer className='p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-sm text-gray-600'>
                <span>Showing 1-4 of 24 jobs</span>
                <div className='flex items-center gap-1.5'>
                    <button className='p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50'><svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                    {[1, 2, 3].map(page => (
                        <button key={page} className={`w-9 h-9 flex items-center justify-center border rounded-lg font-semibold ${page === 1 ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>{page}</button>
                    ))}
                    <button className='p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50'><svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

export default JobPost;