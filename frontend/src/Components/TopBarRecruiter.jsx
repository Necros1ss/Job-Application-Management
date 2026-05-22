import React, { useEffect, useRef, useState } from 'react';
import { FaSearch, FaBell, FaEnvelope } from "react-icons/fa";
import { useLocation } from 'react-router-dom';
import { messagesApi } from '../lib/api';
import { formatMessageTime } from '../utils/format';
import AccountMenu from './AccountMenu';
import LanguageSwitcher from './LanguageSwitcher';

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
    if (loadingInbox) return <div className="px-4 py-8 text-center text-sm text-[#737373]">Loading messages...</div>;
    if (inboxError) return <div className="px-4 py-8 text-center text-sm text-[#c22b10]">{inboxError}</div>;
    if (messages.length === 0) return <div className="px-4 py-8 text-center text-sm text-[#737373]">No messages</div>;
    
    return messages.map((message) => (
      <button
        key={message.id}
        type="button"
        onClick={() => handleMarkRead(message)}
        className={`w-full border-b border-[#e5e5e5] px-4 py-3 text-left transition-colors hover:bg-[#f2f2f2] ${message.isRead ? 'bg-white' : 'bg-[#f2f2f2]'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className={`text-sm ${message.isRead ? 'font-medium text-[#737373]' : 'font-semibold text-[#0a0a0a]'}`}>
            {message.subject}
          </p>
          {!message.isRead && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-black" />}
        </div>
        <p className="mt-1 text-xs text-[#737373]">From: {message.senderName || 'Recruiter'}</p>
        <p className="mt-1 line-clamp-2 text-sm text-[#0a0a0a]">{message.content}</p>
        <p className="mt-2 text-[11px] text-[#737373]">{formatMessageTime(message.createdAt)}</p>
      </button>
    ));
  };

  return (
    <header className="w-full border-b border-[#e5e5e5] bg-white">
      <div className={`px-6 lg:px-10 h-20 flex items-center gap-6 ${isSearchControlled ? "justify-between" : "justify-end"}`}>
        {isSearchControlled && (
          <div className="flex-1 min-w-0 max-w-3xl">
            <label className="flex h-10 items-center rounded-[10px] border border-[#e5e5e5] bg-white px-3">
              <FaSearch className="mr-3 text-[#737373]" size={16} />
              <input
                type="text"
                placeholder={searchPlaceholder || "Search candidates, jobs, or applications..."}
                onChange={isSearchControlled ? (e) => onSearchChange(e.target.value) : undefined}
                {...(typeof searchValue === "string" ? { value: searchValue } : {})}
                className="w-full border-none bg-transparent text-sm text-[#0a0a0a] outline-none placeholder:text-[#737373] focus:ring-0"
              />
            </label>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-5 text-[#737373]">
          <LanguageSwitcher compact />

          <button
            type="button"
            className="relative p-1.5 transition-colors hover:text-black"
            aria-label="Messages"
          >
            <FaEnvelope size={18} />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={handleBellClick}
              className="relative p-1.5 transition-colors hover:text-black"
              aria-label="Notifications"
            >
              <FaBell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-1.5 h-[18px] min-w-[18px] rounded-full bg-[#c22b10] px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isOpen && (
              <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-[14px] border border-[#e5e5e5] bg-white shadow-[0_0_0_1px_rgba(10,10,10,0.1)]">
                <div className="border-b border-[#e5e5e5] bg-[#f2f2f2] px-4 py-3">
                  <p className="text-sm font-medium text-[#0a0a0a]">Messages</p>
                  <p className="text-xs text-[#737373]">{unreadCount} Unread</p>
                </div>
                <div className="max-h-96 overflow-auto">
                  {renderInboxContent()}
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-[#e5e5e5]" />

          <AccountMenu userName={userName || "Recruiter"} userEmail={userEmail} avatarUrl={avatarUrl} />
        </div>
      </div>
    </header>
  );
};

export default TopBarRecruiter;
