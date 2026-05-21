import React, { useEffect, useRef, useState } from 'react';
import { FaSearch, FaBell, FaEnvelope } from "react-icons/fa";
import { useLocation } from 'react-router-dom';
import { messagesApi } from '../lib/api';
import { formatMessageTime } from '../utils/format';
import AccountMenu from './AccountMenu';

const TopBarRecruiter = ({
  userName,
  userEmail,
  avatarUrl,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
}) => {
  const isSearchControlled = typeof onSearchChange === "function";
  const location = useLocation();
  const dropdownRef = useRef(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [inboxError, setInboxError] = useState('');

  const firstSegment = location.pathname.split('/')[1];
  const isCandidate = ['candidate', 'recruiter'].includes(firstSegment) 
    ? firstSegment === 'candidate' 
    : true; // Default to candidate

  // Lấy số lượng tin nhắn chưa đọc
  useEffect(() => {
    if (!isCandidate) {
      setUnreadCount(0);
      return;
    }
    let mounted = true;
    messagesApi.unreadCount()
      .then(payload => mounted && setUnreadCount(payload?.unreadCount || 0))
      .catch(() => mounted && setUnreadCount(0));
    return () => { mounted = false; };
  }, [isCandidate]);

  // Xử lý Click Outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Load danh sách tin nhắn
  const loadInbox = async () => {
    try {
      setLoadingInbox(true);
      setInboxError('');
      const payload = await messagesApi.inbox({ limit: 8, offset: 0 });
      setMessages(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setMessages([]);
      setInboxError(error.message || 'Error');
    } finally {
      setLoadingInbox(false);
    }
  };

  const handleBellClick = async () => {
    setIsOpen(!isOpen);
    if (!isOpen) await loadInbox();
  };

  const handleMarkRead = async (message) => {
    if (!message || message.isRead) return;
    try {
      await messagesApi.markRead(message.id);
      setMessages(prev => prev.map(item => 
        item.id === message.id ? { ...item, isRead: true } : item
      ));
      setUnreadCount(prev => Math.max(prev - 1, 0));
    } catch { /* Bỏ qua lỗi để UI phản hồi mượt */ }
  };

  // 2. Gom nhóm logic hiển thị nội dung dropdown
  const renderInboxContent = () => {
    if (loadingInbox) return <div className="px-4 py-8 text-center text-sm text-gray-500">Loading messages...</div>;
    if (inboxError) return <div className="px-4 py-8 text-center text-sm text-red-500">{inboxError}</div>;
    if (messages.length === 0) return <div className="px-4 py-8 text-center text-sm text-gray-500">No messages</div>;
    
    return messages.map((message) => (
      <button
        key={message.id}
        type="button"
        onClick={() => handleMarkRead(message)}
        className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${message.isRead ? 'bg-white' : 'bg-emerald-50/40'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className={`text-sm ${message.isRead ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}>
            {message.subject}
          </p>
          {!message.isRead && <span className="mt-1 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
        </div>
        <p className="text-xs text-gray-500 mt-1">From: {message.senderName || 'Recruiter'}</p>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{message.content}</p>
        <p className="text-[11px] text-gray-400 mt-2">{formatMessageTime(message.createdAt)}</p>
      </button>
    ));
  };

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className={`px-6 lg:px-10 h-20 flex items-center gap-6 ${isSearchControlled ? "justify-between" : "justify-end"}`}>
        {isSearchControlled && (
          <div className="flex-1 min-w-0 max-w-3xl">
            <label className="flex items-center bg-[#eef2ec] border border-[#e4eadf] rounded-2xl px-5 h-11 -translate-y-1">
              <FaSearch className="text-gray-400 mr-3" size={16} />
              <input
                type="text"
                placeholder={searchPlaceholder || "Search candidates, jobs, or applications..."}
                onChange={isSearchControlled ? (e) => onSearchChange(e.target.value) : undefined}
                {...(typeof searchValue === "string" ? { value: searchValue } : {})}
                className="bg-transparent border-none outline-none w-full text-[15px] text-gray-700 placeholder:text-[#9aa59a] focus:ring-0"
              />
            </label>
          </div>
        )}

        <div className="flex items-center gap-5 text-gray-500 shrink-0">
          <button
            type="button"
            className="relative p-1.5 hover:text-emerald-700 transition-colors -translate-y-1"
            aria-label="Messages"
          >
            <FaEnvelope size={18} />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={handleBellClick}
              className="relative p-1.5 hover:text-emerald-700 transition-colors -translate-y-1"
              aria-label="Notifications"
            >
              <FaBell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center font-semibold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-3 w-80 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-800">Messages</p>
                  <p className="text-xs text-gray-500">{unreadCount} Unread</p>
                </div>
                <div className="max-h-96 overflow-auto">
                  {renderInboxContent()}
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-gray-200" />

          <AccountMenu userName={userName || "Recruiter"} userEmail={userEmail} avatarUrl={avatarUrl} />
        </div>
      </div>
    </header>
  );
};

export default TopBarRecruiter;
