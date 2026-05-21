import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaEnvelope, FaEnvelopeOpen, FaTimes } from "react-icons/fa";
import TopBarDashboard from "../../Components/TopBarDashboard";
import { SkeletonCard } from "../../Components/Skeleton";
import { messagesApi, usersApi } from "../../lib/api";
import { showError } from "../../utils/toast";

const PAGE_SIZE = 10;

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const [profile, inbox] = await Promise.all([
          usersApi.me(),
          messagesApi.inbox({ limit: PAGE_SIZE, offset }),
        ]);

        setUserName(profile.name || "");
        setUserEmail(profile.email || "");
        setMessages(Array.isArray(inbox) ? inbox : []);
        setErrorMessage("");
      } catch (error) {
        const message = error.message || "Failed to load messages";
        setErrorMessage(message);
        showError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [offset]);

  const openMessage = async (message) => {
    setSelectedMessage(message);

    if (message.isRead) {
      return;
    }

    try {
      const updated = await messagesApi.markRead(message.id);
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? { ...item, isRead: updated.isRead, readAt: updated.readAt }
            : item
        )
      );
      setSelectedMessage((current) =>
        current?.id === message.id
          ? { ...current, isRead: updated.isRead, readAt: updated.readAt }
          : current
      );
    } catch (error) {
      showError(error.message || "Failed to mark message as read");
    }
  };

  const hasNextPage = messages.length === PAGE_SIZE;
  const pageNumber = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="min-h-screen bg-[#fbfcfa]">
      <TopBarDashboard userName={userName} userEmail={userEmail} />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Messages</h1>
            <p className="text-gray-500">Updates from recruiters about your applications.</p>
          </div>
          <div className="bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Unread</p>
            <p className="text-2xl font-bold text-[#188155]">
              {messages.filter((message) => !message.isRead).length}
            </p>
          </div>
        </div>

        {errorMessage && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100" role="alert">
            {errorMessage}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Array(4).fill(0).map((_, index) => <SkeletonCard key={index} />)}
          </div>
        ) : messages.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {messages.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => openMessage(message)}
                  className="w-full text-left px-6 py-5 hover:bg-emerald-50/40 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      message.isRead ? "bg-gray-100 text-gray-500" : "bg-emerald-100 text-[#188155]"
                    }`}>
                      {message.isRead ? <FaEnvelopeOpen /> : <FaEnvelope />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h2 className={`text-base truncate ${message.isRead ? "font-semibold text-gray-800" : "font-bold text-gray-950"}`}>
                          {message.subject}
                        </h2>
                        <span className="text-xs font-semibold text-gray-400 shrink-0">
                          {formatDateTime(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {message.senderName || "Unknown recruiter"}
                      </p>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {message.content}
                      </p>
                    </div>
                    {!message.isRead && (
                      <span className="mt-2 w-2.5 h-2.5 bg-[#188155] rounded-full shrink-0" aria-label="Unread" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                type="button"
                disabled={offset === 0}
                onClick={() => setOffset((current) => Math.max(current - PAGE_SIZE, 0))}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <FaChevronLeft className="text-xs" />
                Previous
              </button>
              <span className="text-sm font-bold text-gray-500">Page {pageNumber}</span>
              <button
                type="button"
                disabled={!hasNextPage}
                onClick={() => setOffset((current) => current + PAGE_SIZE)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Next
                <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-[#188155] flex items-center justify-center mb-4">
              <FaEnvelope className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">No messages yet</h2>
            <p className="text-sm text-gray-500">Recruiter updates will appear here when they contact you.</p>
          </div>
        )}
      </div>

      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-[#188155] mb-1">
                  {selectedMessage.senderName || "Unknown recruiter"}
                </p>
                <h2 className="text-2xl font-bold text-gray-900">{selectedMessage.subject}</h2>
                <p className="text-xs font-semibold text-gray-400 mt-2">
                  {formatDateTime(selectedMessage.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100"
                aria-label="Close message"
              >
                <FaTimes />
              </button>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm leading-7 text-gray-700 whitespace-pre-wrap">
                {selectedMessage.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
