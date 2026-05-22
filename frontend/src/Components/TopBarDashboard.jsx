import React, { useEffect, useRef, useState } from 'react';
import { FaSearch, FaBell } from "react-icons/fa";
import { useLocation } from 'react-router-dom';
import { messagesApi } from '../lib/api';
import { formatMessageTime } from '../utils/format';
import AccountMenu from './AccountMenu';
import LanguageSwitcher from './LanguageSwitcher';

const TopBarDashboard = ({
  userName,
  userEmail,
  avatarUrl,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,
}) => {
  const isSearchControlled = typeof onSearchChange === "function";
  const location = useLocation();
  const dropdownRef = useRef(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [inboxError, setInboxError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);

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

  useEffect(() => {
    if (!isCandidate) return;

    let mounted = true;
    const refreshUnreadCount = async () => {
      try {
        const payload = await messagesApi.unreadCount();
        if (mounted) {
          setUnreadCount(payload?.unreadCount || 0);
        }
      } catch {
        if (mounted) {
          setUnreadCount(0);
        }
      }
    };

    const intervalId = window.setInterval(refreshUnreadCount, 15000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

  const handleOpenMessage = async (message) => {
    if (!message) return;
    await handleMarkRead(message);
    setSelectedMessage(message);
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
        onClick={() => handleOpenMessage(message)}
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
      <div className={`px-6 lg:px-10 h-20 flex items-center gap-6 ${showSearch ? "justify-between" : "justify-end"}`}>
        {/* KHU VỰC TÌM KIẾM */}
        {showSearch && (
          <div className="flex w-full max-w-md items-center rounded-[10px] border border-[#e5e5e5] bg-white px-3 py-2">
            <FaSearch className="mr-2 text-[#737373]" size={18} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={isSearchControlled ? (e) => onSearchChange(e.target.value) : undefined}
              {...(typeof searchValue === "string" ? { value: searchValue } : {})}
              className="w-full border-none bg-transparent text-sm text-[#0a0a0a] outline-none placeholder:text-[#737373] focus:ring-0"
            />
          </div>
        )}

        {/* TÀI KHOẢN & THÔNG BÁO */}
        <div className="flex items-center gap-5 text-[#737373]">
          <LanguageSwitcher compact />
          
          {/* Chuông thông báo */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={handleBellClick}
              className="relative transition-colors hover:text-black"
            >
              <FaBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 h-[18px] min-w-[18px] rounded-full bg-[#c22b10] px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
    
            {/* Dropdown */}
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

          {selectedMessage && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4">
              <div className="w-full max-w-lg overflow-hidden rounded-[14px] border border-[#e5e5e5] bg-white shadow-[0_0_0_1px_rgba(10,10,10,0.1)]">
                <div className="flex items-start justify-between gap-4 border-b border-[#e5e5e5] px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-[#0a0a0a]">{selectedMessage.subject}</p>
                    <p className="mt-1 text-xs text-[#737373]">From: {selectedMessage.senderName || 'Recruiter'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMessage(null)}
                    className="text-[#737373] hover:text-black"
                    aria-label="Close message detail"
                  >
                    ×
                  </button>
                </div>
                <div className="px-5 py-4">
                  <p className="whitespace-pre-line text-sm leading-6 text-[#0a0a0a]">{selectedMessage.content}</p>
                  <p className="mt-4 text-xs text-[#737373]">{formatMessageTime(selectedMessage.createdAt)}</p>
                </div>
                <div className="flex justify-end border-t border-[#e5e5e5] px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setSelectedMessage(null)}
                    className="rounded-[10px] bg-black px-4 py-2 text-sm font-medium text-white hover:bg-[#0a0a0a]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          <AccountMenu userName={userName} userEmail={userEmail} avatarUrl={avatarUrl} />
        </div>
      </div>
    </header>
  );
};

export default TopBarDashboard;
