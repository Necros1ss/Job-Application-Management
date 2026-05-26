import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  FaBell,
  FaCheck,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaShieldAlt,
  FaTrashAlt,
  FaUserCircle,
} from "react-icons/fa";
import DeleteAccountModal from "../Components/DeleteAccountModal";
import { accountApi, tokenStorage, usersApi } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { showError, showSuccess } from "../utils/toast";

const DEFAULT_PREFERENCES = {
  newApplication: true,
  interviewReminder: true,
  statusChanged: true,
  newMessage: true,
};

const SETTINGS_TABS = [
  { id: "security", labelKey: "settings.security", icon: <FaLock /> },
  { id: "notifications", labelKey: "settings.notifications", icon: <FaBell /> },
];

const Toggle = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    className={`relative h-6 w-11 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
      checked ? "bg-black" : "bg-[#e5e5e5]"
    }`}
    aria-pressed={checked}
  >
    <span
      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
        checked ? "left-6" : "left-1"
      }`}
    />
  </button>
);

Toggle.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

const SettingsSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="blueprint-hero-panel p-6">
      <div className="h-4 w-32 rounded-full bg-[#e5e5e5]" />
      <div className="mt-3 h-9 w-64 rounded-full bg-[#e5e5e5]" />
      <div className="mt-3 h-4 w-96 max-w-full rounded-full bg-[#f2f2f2]" />
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="blueprint-card h-28 p-5" />
      ))}
    </div>
    <div className="blueprint-card h-80 p-6" />
  </div>
);

const PasswordField = ({ label, value, setValue, show, setShow, placeholder }) => (
  <div>
    <label className="mb-1.5 block text-sm font-semibold text-[#0a0a0a]">{label}</label>
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="blueprint-input w-full px-3 py-2.5 pr-11"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#0a0a0a]"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
      </button>
    </div>
  </div>
);

PasswordField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  setValue: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  setShow: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

const Settings = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("security");
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [profile, setProfile] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const userRole = tokenStorage.getRole() || localStorage.getItem("userRole") || "";

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const nextProfile = await usersApi.me();
        if (!mounted) return;
        setProfile(nextProfile);
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...(nextProfile.notificationPreferences || {}),
        });
      } catch (error) {
        if (mounted) {
          showError(error.message || "Failed to load account settings");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const notificationOptions = useMemo(
    () =>
      [
        {
          key: "newApplication",
          roles: ["recruiter"],
          label: "New application received",
          description: "Receive email when a candidate applies to one of your jobs.",
        },
        {
          key: "interviewReminder",
          roles: ["recruiter", "candidate"],
          label: "Interview reminder",
          description: "Receive a reminder one day before scheduled interviews.",
        },
        {
          key: "statusChanged",
          roles: ["candidate"],
          label: "Application status changed",
          description: "Receive updates when recruiters change your application status.",
        },
        {
          key: "newMessage",
          roles: ["candidate"],
          label: "New message received",
          description: "Receive email when a recruiter sends you a new message.",
        },
      ].filter((option) => option.roles.includes(userRole)),
    [userRole]
  );

  const enabledNotifications = notificationOptions.filter((option) => preferences[option.key]).length;
  const displayName = profile?.company_name || profile?.full_name || profile?.name || "User Name";
  const displayEmail = profile?.email || "email@example.com";

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentPassword) {
      showError("Please enter your current password.");
      return;
    }
    const newPwdError = validatePassword(newPassword);
    if (newPwdError) {
      showError(newPwdError);
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("New passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      showError("New password must be different from current password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await accountApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showSuccess("Password changed successfully!");
    } catch (err) {
      showError(err.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSavingPreferences(true);
      const response = await usersApi.updateNotificationPreferences(preferences);
      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...(response.notificationPreferences || preferences),
      });
      showSuccess("Notification preferences saved.");
    } catch (error) {
      showError(error.message || "Failed to save notification preferences");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      {isLoading ? (
        <SettingsSkeleton />
      ) : (
        <>
          <div className="blueprint-hero-panel p-5 md:p-6">
            <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="blueprint-kicker">{t("settings.kicker")}</p>
                <h1 className="mt-1 text-3xl font-semibold text-black md:text-4xl">{t("settings.title")}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#737373]">{t("settings.subtitle")}</p>
              </div>
              <div className="blueprint-card flex min-w-0 items-center gap-4 p-4 lg:min-w-[320px]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-black text-lg font-semibold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#0a0a0a]">{displayName}</p>
                  <p className="truncate text-sm text-[#737373]">{displayEmail}</p>
                  <span className="mt-2 inline-flex rounded-full bg-[#f2f2f2] px-2.5 py-1 text-xs font-semibold capitalize text-[#0a0a0a]">
                    {userRole || "account"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="blueprint-card p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f2f2f2] text-black">
                <FaUserCircle />
              </div>
              <p className="text-xs font-semibold uppercase text-[#737373]">Account type</p>
              <p className="mt-1 text-xl font-semibold capitalize text-black">{userRole || "Unknown"}</p>
            </div>
            <div className="blueprint-card p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f2f2f2] text-black">
                <FaShieldAlt />
              </div>
              <p className="text-xs font-semibold uppercase text-[#737373]">Security</p>
              <p className="mt-1 text-xl font-semibold text-black">Password protected</p>
            </div>
            <div className="blueprint-card p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f2f2f2] text-black">
                <FaBell />
              </div>
              <p className="text-xs font-semibold uppercase text-[#737373]">Notifications</p>
              <p className="mt-1 text-xl font-semibold text-black">
                {enabledNotifications}/{notificationOptions.length || 0} enabled
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="h-fit rounded-[14px] border border-[#e5e5e5] bg-white p-2 shadow-[var(--shadow-subtle-2)]">
              {SETTINGS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-[10px] px-4 py-3 text-left text-sm font-semibold transition ${
                    activeTab === tab.id ? "bg-black text-white" : "text-[#737373] hover:bg-[#f2f2f2] hover:text-[#0a0a0a]"
                  }`}
                >
                  <span className="text-sm">{tab.icon}</span>
                  {t(tab.labelKey)}
                </button>
              ))}
            </aside>

            <div className="space-y-6">
              {activeTab === "security" && (
                <>
                  <div className="blueprint-card p-5 md:p-6">
                    <div className="mb-6 flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f2f2f2] text-[#0a0a0a]">
                        <FaLock size={18} />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-[#0a0a0a]">{t("settings.changePassword")}</h2>
                        <p className="mt-1 text-sm text-[#737373]">{t("settings.changePasswordDesc")}</p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="grid gap-4">
                      <PasswordField
                        label={t("settings.currentPassword")}
                        value={currentPassword}
                        setValue={setCurrentPassword}
                        show={showCurrent}
                        setShow={setShowCurrent}
                        placeholder="Enter current password"
                      />
                      <div className="grid gap-4 md:grid-cols-2">
                        <PasswordField
                          label={t("settings.newPassword")}
                          value={newPassword}
                          setValue={setNewPassword}
                          show={showNew}
                          setShow={setShowNew}
                          placeholder="At least 8 characters"
                        />
                        <PasswordField
                          label={t("settings.confirmPassword")}
                          value={confirmPassword}
                          setValue={setConfirmPassword}
                          show={showConfirm}
                          setShow={setShowConfirm}
                          placeholder="Re-enter new password"
                        />
                      </div>

                      <div className="mt-2 flex flex-col gap-3 rounded-[14px] border border-[#e5e5e5] bg-[#f2f2f2] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3 text-sm text-[#737373]">
                          <FaCheck className="mt-1 text-black" />
                          <span>Use at least 8 characters and avoid reusing your current password.</span>
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="blueprint-primary shrink-0 px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmitting ? t("settings.updating") : t("settings.updatePassword")}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="rounded-[14px] border border-red-200 bg-white p-5 shadow-[var(--shadow-subtle-2)] md:p-6">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-red-50 text-red-700">
                        <FaTrashAlt size={18} />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-[#0a0a0a]">{t("settings.deleteAccount")}</h2>
                        <p className="mt-1 text-sm text-[#737373]">{t("settings.deleteAccountDesc")}</p>
                      </div>
                    </div>
                    <div className="rounded-[14px] border border-red-100 bg-red-50 p-4">
                      <p className="text-sm leading-6 text-red-800">{t("settings.deleteWarning")}</p>
                      <button
                        type="button"
                        onClick={() => setShowDeleteAccountModal(true)}
                        className="mt-4 rounded-[10px] border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        {t("settings.deleteAction")}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "notifications" && (
                <div className="blueprint-card p-5 md:p-6">
                  <div className="mb-6 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f2f2f2] text-[#0a0a0a]">
                      <FaBell size={18} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-[#0a0a0a]">{t("settings.emailNotifications")}</h2>
                      <p className="mt-1 text-sm text-[#737373]">{t("settings.emailNotificationsDesc")}</p>
                    </div>
                  </div>

                  {notificationOptions.length > 0 ? (
                    <div className="divide-y divide-[#e5e5e5] rounded-[14px] border border-[#e5e5e5]">
                      {notificationOptions.map((option) => (
                        <div key={option.key} className="flex items-center justify-between gap-6 p-4">
                          <div>
                            <p className="font-semibold text-[#0a0a0a]">{option.label}</p>
                            <p className="mt-1 text-sm leading-6 text-[#737373]">{option.description}</p>
                          </div>
                          <Toggle
                            checked={Boolean(preferences[option.key])}
                            disabled={isSavingPreferences}
                            onChange={() =>
                              setPreferences((current) => ({
                                ...current,
                                [option.key]: !current[option.key],
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-[14px] border border-dashed border-[#e5e5e5] p-6 text-center text-sm text-[#737373]">
                      No notification preferences are available for this role.
                    </p>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSavePreferences}
                      disabled={isSavingPreferences}
                      className="blueprint-primary px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingPreferences ? t("settings.savingNotifications") : t("settings.saveNotifications")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showDeleteAccountModal && (
        <DeleteAccountModal setDeleteAccountModal={setShowDeleteAccountModal} />
      )}
    </section>
  );
};

export default Settings;
