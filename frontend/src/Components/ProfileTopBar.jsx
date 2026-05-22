import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FaBell } from "react-icons/fa";
import { messagesApi } from '../lib/api';
import { formatMessageTime } from '../utils/format';
import LanguageSwitcher from './LanguageSwitcher';

const ProfileTopBar = ({ userName, userEmail }) => {
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
    if (!isCandidate) return;

    let mounted = true;
    const refreshUnreadCount = async () => {
      try {
        if (document.visibilityState !== 'visible') return;
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

    refreshUnreadCount();
    const intervalId = window.setInterval(refreshUnreadCount, 60000);
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

  // Gom nhóm logic hiển thị nội dung dropdown
  const renderInboxContent = () => {
    if (loadingInbox) return <div className="px-4 py-8 text-center text-sm text-[#737373]">Loading messages...</div>;
    if (inboxError) return <div className="px-4 py-8 text-center text-sm text-[#c22b10]">{inboxError}</div>;
    if (messages.length === 0) return <div className="px-4 py-8 text-center text-sm text-[#737373]">No messages yet</div>;
    
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
    <header className="mb-8 flex w-full items-center justify-between border-b border-[#e5e5e5] bg-white">
      <div className="w-full mx-auto px-10 h-16 flex items-center justify-between">        
        
        {/* Tiêu đề trang */}
        <div className="flex items-center gap-10 text-[28px] font-semibold text-black">
          Profile
        </div>

        {/* Thông báo & Tài khoản */}
        <div className="flex items-center gap-5 text-[#737373]">
          <LanguageSwitcher compact />
          
          {/* Nút chuông thông báo */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={handleBellClick}
              className="relative transition-colors hover:text-black"
              aria-label="Open messages"
            >
              <FaBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 h-[18px] min-w-[18px] rounded-full bg-[#c22b10] px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown danh sách tin nhắn */}
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

          {/* User Info */}
          <div className="flex items-center gap-3 ml-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-[#0a0a0a]">{userName || "User Name"}</p>
              <p className="text-xs text-[#737373]">{userEmail || "email@example.com"}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e5e5] bg-[#f2f2f2] font-semibold text-black">
              {typeof userName === 'string' && userName.length > 0 ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

export default ProfileTopBar;
