import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LuBell } from "react-icons/lu";
import { messagesApi } from '../lib/api';
import { formatMessageTime } from '../utils/format';

const ProfileTopBar = ({ userName, userEmail }) => {
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
    if (!isCandidate) return setInboxError('Tin nhan chi ho tro cho candidate.');
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

  // Gom nhóm logic hiển thị nội dung dropdown
  const renderInboxContent = () => {
    if (loadingInbox) return <div className="px-4 py-8 text-center text-sm text-gray-500">Đang tải tin nhắn...</div>;
    if (inboxError) return <div className="px-4 py-8 text-center text-sm text-red-500">{inboxError}</div>;
    if (messages.length === 0) return <div className="px-4 py-8 text-center text-sm text-gray-500">No messages yet</div>;
    
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
        <p className="text-xs text-gray-500 mt-1">Từ: {message.senderName || 'Recruiter'}</p>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{message.content}</p>
        <p className="text-[11px] text-gray-400 mt-2">{formatMessageTime(message.createdAt)}</p>
      </button>
    ));
  };

  return (
    <header className="bg-[#fbfcfa] border-b border-gray-100 sticky top-0 z-50">
      <div className="w-full mx-auto px-10 h-16 flex items-center justify-between">        
        
        {/* Tiêu đề trang */}
        <div className="flex items-center gap-10 text-xl font-bold text-[25px]">
          Profile
        </div>

        {/* Thông báo & Tài khoản */}
        <div className="flex items-center gap-5 text-gray-500">
          
          {/* Nút chuông thông báo */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={handleBellClick}
              className="relative hover:text-emerald-700 transition-colors"
              aria-label="Open messages"
            >
              <LuBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center font-semibold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown danh sách tin nhắn */}
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

          {/* User Info */}
          <div className="flex items-center gap-3 ml-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">{userName || "Tên Người Dùng"}</p>
              <p className="text-xs text-gray-500">{userEmail || "email@example.com"}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
              {typeof userName === 'string' && userName.length > 0 ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

export default ProfileTopBar;