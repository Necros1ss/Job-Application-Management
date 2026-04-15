import React from 'react';
import { LuSearch, LuBell } from "react-icons/lu";

const TopBarDashboard = ({
  userName,
  userEmail,
  avatarUrl,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
}) => {
  const isSearchControlled = typeof onSearchChange === "function";

  return (
    <header className="w-full flex items-center justify-between mb-8">
      
      {/* KHU VỰC TÌM KIẾM (Bên trái) */}
      <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2.5 w-full max-w-md">
        <LuSearch className="text-gray-400 mr-2" size={18} />
        <input
          type="text"
          placeholder={searchPlaceholder}
          onChange={isSearchControlled ? (event) => onSearchChange(event.target.value) : undefined}
          {...(typeof searchValue === "string" ? { value: searchValue } : {})}
          className="bg-transparent border-none outline-none w-full text-sm text-gray-700 placeholder-gray-400 focus:ring-0"
        />
      </div>

      {/* CÔNG CỤ & AVATAR (Bên phải) */}
      <div className="flex items-center gap-5 text-gray-500">
        <button className="hover:text-emerald-700 transition-colors">
          <LuBell size={20} />
        </button>

        <div className="flex items-center gap-3 ml-2">

          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">{userName || "Tên Người Dùng"}</p>
            <p className="text-xs text-gray-500">{userEmail || "email@example.com"}</p>
          </div>

          <button className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 ml-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="User Avatar" 
                className="w-full h-full object-cover" 
              />
            ) : (
              // Avatar mặc định nếu không có ảnh
              <div className="w-full h-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                {typeof userName === 'string' && userName.length > 0 ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </button>
        </div>
      </div>

    </header>
  );
};

export default TopBarDashboard;