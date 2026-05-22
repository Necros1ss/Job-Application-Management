import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaEnvelope,
  FaRegEnvelopeOpen,
} from "react-icons/fa";
import TopBarDashboard from "../../Components/TopBarDashboard";
import { SkeletonCard } from "../../Components/Skeleton";
import { messagesApi, usersApi } from "../../lib/api";
import { formatMessageTime } from "../../utils/format";
import { useI18n } from "../../lib/i18n";
import { showError } from "../../utils/toast";

const PAGE_SIZE = 10;

const formatFullDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCompanyInitial = (message) =>
  (message.senderName || "R")
    .trim()
    .charAt(0)
    .toUpperCase();

const getAvatarClass = (name = "") => {
  const palette = [
    "bg-[#f2f2f2] text-[#0a0a0a]",
    "bg-[#0a0a0a] text-white",
    "bg-white text-[#0a0a0a] border border-[#e5e5e5]",
  ];
  const seed = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[seed % palette.length];
};

const Messages = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [offset, setOffset] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const [profile, inbox, unread] = await Promise.all([
          usersApi.me(),
          messagesApi.inbox({ limit: PAGE_SIZE, offset }),
          messagesApi.unreadCount(),
        ]);

        const normalizedMessages = Array.isArray(inbox) ? inbox : [];
        setUserName(profile.name || "");
        setUserEmail(profile.email || "");
        setMessages(normalizedMessages);
        setUnreadCount(Number(unread?.count ?? unread?.unreadCount ?? 0));
        setSelectedMessage((current) => {
          if (!current) return normalizedMessages[0] || null;
          return normalizedMessages.find((item) => item.id === current.id) || normalizedMessages[0] || null;
        });
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

  const visibleMessages = useMemo(() => {
    if (activeTab === "unread") {
      return messages.filter((message) => !message.isRead);
    }
    return messages;
  }, [activeTab, messages]);

  const openMessage = async (message) => {
    setSelectedMessage(message);
    setShowDetailOnMobile(true);

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
      setUnreadCount((current) => Math.max(current - 1, 0));
    } catch (error) {
      showError(error.message || "Failed to mark message as read");
    }
  };

  const hasNextPage = messages.length === PAGE_SIZE;
  const pageNumber = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="min-h-screen bg-white">
      <TopBarDashboard userName={userName} userEmail={userEmail} />

      <div className="mx-auto max-w-7xl px-6 pb-12 pt-6 lg:px-10">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="blueprint-kicker">{t("messages.kicker")}</p>
            <h1 className="mt-1 text-4xl font-semibold text-[#0a0a0a]">{t("messages.title")}</h1>
            <p className="mt-2 text-[#737373]">{t("messages.subtitle")}</p>
          </div>
          <div className="blueprint-card min-w-[140px] px-5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#737373]">{t("messages.unread")}</p>
            <p className="mt-1 text-2xl font-semibold text-[#0a0a0a]">{unreadCount}</p>
          </div>
        </div>

        {errorMessage && (
          <p className="mb-4 rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {errorMessage}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <SkeletonCard />
            </div>
            <div className="lg:col-span-2">
              <SkeletonCard />
            </div>
          </div>
        ) : messages.length > 0 ? (
          <div className="blueprint-card grid min-h-[650px] overflow-hidden p-0 lg:grid-cols-[0.38fr_0.62fr]">
            <aside
              className={`border-r border-[#e5e5e5] bg-white ${
                showDetailOnMobile ? "hidden lg:block" : "block"
              }`}
            >
              <div className="border-b border-[#e5e5e5] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-[#0a0a0a]">{t("messages.inbox")}</h2>
                    <p className="text-sm text-[#737373]">{messages.length} messages on this page</p>
                  </div>
                  <span className="blueprint-tag">{unreadCount} unread</span>
                </div>
                <div className="mt-4 grid grid-cols-2 rounded-full border border-[#e5e5e5] bg-white p-1">
                  {[
                    { id: "all", label: t("messages.all") },
                    { id: "unread", label: t("messages.unread") },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        activeTab === tab.id ? "bg-black text-white" : "text-[#737373] hover:bg-[#f2f2f2]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto">
                {visibleMessages.length > 0 ? (
                  visibleMessages.map((message) => {
                    const isSelected = selectedMessage?.id === message.id;
                    return (
                      <button
                        key={message.id}
                        type="button"
                        onClick={() => openMessage(message)}
                        className={`block w-full border-b border-[#e5e5e5] px-4 py-4 text-left transition ${
                          isSelected
                            ? "border-l-2 border-l-black bg-[#f2f2f2]"
                            : "border-l-2 border-l-transparent hover:bg-[#f2f2f2]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${getAvatarClass(
                              message.senderName
                            )}`}
                          >
                            {getCompanyInitial(message)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h3
                                className={`truncate text-sm ${
                                  message.isRead ? "font-medium text-[#0a0a0a]" : "font-semibold text-black"
                                }`}
                              >
                                {message.subject}
                              </h3>
                              <span className="shrink-0 text-[11px] font-medium text-[#737373]">
                                {formatMessageTime(message.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-xs font-medium text-[#737373]">
                              {message.senderName || "Unknown recruiter"}
                            </p>
                            <p className="mt-2 truncate text-sm text-[#737373]">{message.content}</p>
                          </div>
                          {!message.isRead && (
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-black" aria-label="Unread" />
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-6 py-12 text-center">
                    <FaRegEnvelopeOpen className="mx-auto mb-3 text-2xl text-[#737373]" />
                    <p className="font-semibold text-[#0a0a0a]">{t("messages.noUnreadTitle")}</p>
                    <p className="mt-1 text-sm text-[#737373]">Everything on this page has been read.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[#e5e5e5] bg-[#f2f2f2] px-4 py-3">
                <button
                  type="button"
                  disabled={offset === 0}
                  onClick={() => setOffset((current) => Math.max(current - PAGE_SIZE, 0))}
                  className="inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-white disabled:opacity-40"
                >
                  <FaChevronLeft className="text-xs" />
                  {t("common.previous")}
                </button>
                <span className="text-sm font-semibold text-[#737373]">{t("common.page")} {pageNumber}</span>
                <button
                  type="button"
                  disabled={!hasNextPage}
                  onClick={() => setOffset((current) => current + PAGE_SIZE)}
                  className="inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-white disabled:opacity-40"
                >
                  {t("common.next")}
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </aside>

            <section className={`${showDetailOnMobile ? "block" : "hidden lg:block"} bg-white`}>
              {selectedMessage ? (
                <div className="flex h-full flex-col">
                  <div className="border-b border-[#e5e5e5] p-6">
                    <button
                      type="button"
                      onClick={() => setShowDetailOnMobile(false)}
                      className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] px-3 py-2 text-sm font-semibold text-[#0a0a0a] lg:hidden"
                    >
                      <FaArrowLeft size={12} />
                      {t("common.back")}
                    </button>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#737373]">
                          {t("messages.from")}: {selectedMessage.senderName || "Unknown recruiter"}
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold leading-tight text-[#0a0a0a]">
                          {selectedMessage.subject}
                        </h2>
                      </div>
                      <p className="text-sm font-medium text-[#737373]">
                        {formatFullDateTime(selectedMessage.createdAt)}
                      </p>
                    </div>
                    {(selectedMessage.jobTitle || selectedMessage.jobPostId) && (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {selectedMessage.jobTitle && <span className="blueprint-tag">{selectedMessage.jobTitle}</span>}
                        {selectedMessage.jobPostId && <span className="blueprint-tag">Job #{selectedMessage.jobPostId}</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap text-base leading-8 text-[#0a0a0a]">
                        {selectedMessage.content}
                      </p>
                    </div>
                  </div>

                  {selectedMessage.jobPostId && (
                    <div className="border-t border-[#e5e5e5] p-6">
                      <button
                        type="button"
                        onClick={() => navigate(`/jobs/${selectedMessage.jobPostId}`)}
                        className="blueprint-primary"
                      >
                        {t("messages.viewJob")}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full min-h-[650px] items-center justify-center p-10 text-center">
                  <div>
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f2f2f2] text-[#0a0a0a]">
                      <FaEnvelope />
                    </div>
                    <h2 className="text-lg font-semibold text-[#0a0a0a]">{t("messages.selectTitle")}</h2>
                    <p className="mt-2 text-sm text-[#737373]">{t("messages.selectDescription")}</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="blueprint-card border-dashed p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f2f2f2] text-[#0a0a0a]">
              <FaEnvelope className="h-5 w-5" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-[#0a0a0a]">{t("messages.emptyTitle")}</h2>
            <p className="text-sm text-[#737373]">{t("messages.emptyDescription")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
