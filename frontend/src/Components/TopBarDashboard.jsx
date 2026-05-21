import React, { useEffect, useRef, useState } from 'react';
import { FaSearch, FaBell } from "react-icons/fa";
import { useLocation } from 'react-router-dom';
import { messagesApi } from '../lib/api';
import { formatMessageTime } from '../utils/format';
import AccountMenu from './AccountMenu';

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
    if (loadingInbox) return <div className="px-4 py-8 text-center text-sm text-gray-500">Loading messages...</div>;
    if (inboxError) return <div className="px-4 py-8 text-center text-sm text-red-500">{inboxError}</div>;
    if (messages.length === 0) return <div className="px-4 py-8 text-center text-sm text-gray-500">No messages</div>;
    
    return messages.map((message) => (
      <button
        key={message.id}
        type="button"
        onClick={() => handleOpenMessage(message)}
        className={`w-full text-left px-4 py-3 border-b border-white hover:bg-gray-50 transition-colors ${message.isRead ? 'bg-white' : 'bg-emerald-50/40'}`}
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
      <div className={`px-6 lg:px-10 h-20 flex items-center gap-6 ${showSearch ? "justify-between" : "justify-end"}`}>
        {/* KHU VỰC TÌM KIẾM */}
        {showSearch && (
          <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2.5 w-full max-w-md">
            <FaSearch className="text-gray-400 mr-2" size={18} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={isSearchControlled ? (e) => onSearchChange(e.target.value) : undefined}
              {...(typeof searchValue === "string" ? { value: searchValue } : {})}
              className="bg-transparent border-none outline-none w-full text-sm text-gray-700 placeholder-gray-400 focus:ring-0"
            />
          </div>
        )}

        {/* TÀI KHOẢN & THÔNG BÁO */}
        <div className="flex items-center gap-5 text-gray-500">
          
          {/* Chuông thông báo */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={handleBellClick}
              className="relative hover:text-emerald-700 transition-colors"
            >
              <FaBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center font-semibold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
    
            {/* Dropdown */}
            {isOpen && (
              <div className="absolute right-0 mt-3 w-80 rounded-xl border border-white bg-white shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-white bg-gray-50">
                  <p className="text-sm font-semibold text-gray-800">Messages</p>
                  <p className="text-xs text-gray-500">{unreadCount} Unread</p>
                </div>
                <div className="max-h-96 overflow-auto">
                  {renderInboxContent()}
                </div>
              </div>
            )}
          </div>

          {selectedMessage && (
            <div className="fixed inset-0 z-[60] bg-black/35 flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedMessage.subject}</p>
                    <p className="text-xs text-gray-500 mt-1">From: {selectedMessage.senderName || 'Recruiter'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMessage(null)}
                    className="text-gray-400 hover:text-gray-700"
                    aria-label="Close message detail"
                  >
                    ×
                  </button>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-6">{selectedMessage.content}</p>
                  <p className="text-xs text-gray-400 mt-4">{formatMessageTime(selectedMessage.createdAt)}</p>
                </div>
                <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedMessage(null)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
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
