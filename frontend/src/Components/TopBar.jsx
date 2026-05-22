import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBell } from "react-icons/fa";

const TopBar = ({ userName, userEmail, roleOverride }) => {
  const location = useLocation();

  const validRoles = ['candidate', 'recruiter'];

  const firstSegment = location.pathname.split('/')[1];

  const pathRole = validRoles.includes(firstSegment) ? firstSegment : 'candidate';
  const currentRole = validRoles.includes(roleOverride) ? roleOverride : pathRole;
  const isRecruiter = currentRole === "recruiter";

  const navLinkStyle = (path) => {
    const isActive = location.pathname.includes(path);
    return isActive
      ? "text-black font-medium border-b-2 border-black pb-1"
      : "text-[#737373] font-medium hover:text-black pb-1 transition-colors";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#e5e5e5] bg-white">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        <div className="flex items-center gap-10">
          <Link to={`/${currentRole}`} className="text-xl font-semibold text-black">
            Job Tracker
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 mt-1 text-sm tracking-wide">
            {isRecruiter ? (
              <>
                <Link to="/recruiter/job" className={navLinkStyle('/recruiter/job')}>Job Post</Link>
                <Link to="/recruiter/application" className={navLinkStyle('/recruiter/application')}>Applications</Link>
              </>
            ) : (
              <>
                <Link to={`/${currentRole}/job`} className={navLinkStyle(`/${currentRole}/job`)}>Find Jobs</Link>
                <Link to={`/${currentRole}/applications`} className={navLinkStyle(`/${currentRole}/applications`)}>Applications</Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative mr-6 flex items-center h-full"> 
            <button
              type="button"
              className="relative flex items-center justify-center p-2 text-[#737373] transition-colors hover:text-black"
            >
              <FaBell size={20} />
            </button>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-[#0a0a0a]">{userName || "User Name"}</p>
            <p className="text-xs text-[#737373]">{userEmail || "email@example.com"}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e5e5] bg-[#f2f2f2] font-semibold text-black">
            {typeof userName === 'string' && userName.length > 0 ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>

      </div>
    </header>
  );
};

export default TopBar;
