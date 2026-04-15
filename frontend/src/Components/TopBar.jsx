import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const TopBar = ({ userName, userEmail }) => {
  const location = useLocation();

  // 1. Định nghĩa các role hợp lệ mà hệ thống bạn có
  const validRoles = ['candidate', 'recruiters'];

  // 2. Lấy segment đầu tiên từ URL
  const firstSegment = location.pathname.split('/')[1];

  // 3. KIỂM TRA: 
  // Nếu segment đầu tiên nằm trong danh sách hợp lệ thì lấy nó.
  // Nếu không (ví dụ là "jobs" hoặc trống), thì mặc định trả về "candidates".
  const currentRole = validRoles.includes(firstSegment) ? firstSegment : 'candidate';

  const navLinkStyle = (path) => {
    // Kiểm tra active dựa trên path có chứa currentRole hay không
    const isActive = location.pathname.includes(path);
    return isActive
      ? "text-[#188155] font-semibold border-b-2 border-[#188155] pb-1"
      : "text-gray-500 font-medium hover:text-[#188155] pb-1 transition-colors";
  };

  return (
    <header className="bg-[#fbfcfa] border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        <div className="flex items-center gap-10">
          <Link to={`/${currentRole}`} className="text-xl font-bold text-[#116843]">
            Job Tracker
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 mt-1 text-sm tracking-wide">
            {/* Bây giờ currentRole sẽ luôn là 'candidates' hoặc 'recruiters' */}
            <Link to={`/${currentRole}/job`} className={navLinkStyle(`/${currentRole}/job`)}>Find Jobs</Link>
            <Link to={`/${currentRole}/applications`} className={navLinkStyle(`/${currentRole}/applications`)}>Applications</Link>
            <Link to={`/${currentRole}/messages`} className={navLinkStyle(`/${currentRole}/messages`)}>Messages</Link>
            <Link to={`/${currentRole}/saved`} className={navLinkStyle(`/${currentRole}/saved`)}>Saved</Link>
          </nav>
        </div>

        {/* Thông tin User */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">{userName || "Tên Người Dùng"}</p>
            <p className="text-xs text-gray-500">{userEmail || "email@example.com"}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
            {typeof userName === 'string' && userName.length > 0 ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>

      </div>
    </header>
  );
};

export default TopBar;