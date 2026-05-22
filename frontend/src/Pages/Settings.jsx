import { useState } from "react";
import { FaEye, FaEyeSlash, FaLock, FaTrashAlt } from "react-icons/fa";
import { accountApi } from "../lib/api";
import DeleteAccountModal from "../Components/DeleteAccountModal";
import { showError, showSuccess } from "../utils/toast";

const DEFAULT_PREFERENCES = {
  newApplication: true,
  interviewReminder: true,
  statusChanged: true,
  newMessage: true,
};

const SETTINGS_TABS = [
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
];

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-black" : "bg-[#e5e5e5]"}`}
    aria-pressed={checked}
  >
    <span
      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
        checked ? "left-6" : "left-1"
      }`}
    />
  </button>
);

const Settings = () => {
  const [activeTab, setActiveTab] = useState("security");
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const userRole = tokenStorage.getRole() || localStorage.getItem("userRole") || "";

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoadingPreferences(true);
        const profile = await usersApi.me();
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...(profile.notificationPreferences || {}),
        });
      } catch (error) {
        showError(error.message || "Failed to load notification preferences");
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    loadPreferences();
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

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

  const renderPasswordField = ({ label, value, setValue, show, setShow, placeholder }) => (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#0a0a0a]">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="blueprint-input w-full pr-11"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#0a0a0a]"
        >
          {show ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <section className="max-w-3xl">
      <div className="mb-8">
        <p className="blueprint-kicker">Account controls</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#0a0a0a]">Settings</h2>
        <p className="mt-1 text-[#737373]">Manage your account preferences and security</p>
      </div>

      <div className="mb-6 inline-flex rounded-full border border-[#e5e5e5] bg-white p-1">
        {SETTINGS_TABS.map((tab) => (
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

      {activeTab === "security" && (
        <>
          <div className="blueprint-card mb-6 p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f2f2f2] text-[#0a0a0a]">
                <FaLock size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-[#0a0a0a]">Change Password</h3>
                <p className="text-sm text-[#737373]">Update your password to keep your account secure</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {renderPasswordField({
                label: "Current Password",
                value: currentPassword,
                setValue: setCurrentPassword,
                show: showCurrent,
                setShow: setShowCurrent,
                placeholder: "Enter current password",
              })}
              {renderPasswordField({
                label: "New Password",
                value: newPassword,
                setValue: setNewPassword,
                show: showNew,
                setShow: setShowNew,
                placeholder: "At least 8 characters",
              })}
              {renderPasswordField({
                label: "Confirm New Password",
                value: confirmPassword,
                setValue: setConfirmPassword,
                show: showConfirm,
                setShow: setShowConfirm,
                placeholder: "Re-enter new password",
              })}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="blueprint-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-[14px] border border-red-200 bg-white p-6 shadow-[var(--shadow-subtle-2)] md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-red-50 text-red-600">
                <FaTrashAlt size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-[#0a0a0a]">Delete Account</h3>
                <p className="text-sm text-[#737373]">Permanently delete your account and all associated data</p>
              </div>
            </div>
            <p className="mb-4 text-sm text-[#737373]">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteAccountModal(true)}
              className="rounded-[10px] border border-red-200 px-5 py-2.5 font-semibold text-red-700 transition hover:bg-red-50"
            >
              Delete my Account
            </button>
          </div>
        </>
      )}

      {activeTab === "notifications" && (
        <div className="blueprint-card p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f2f2f2] text-[#0a0a0a]">
              <FaBell size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-[#0a0a0a]">Email Notifications</h3>
              <p className="text-sm text-[#737373]">Choose which account events should trigger email updates.</p>
            </div>
          </div>

          {isLoadingPreferences ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-[10px] bg-[#f2f2f2]" />
              ))}
            </div>
          ) : notificationOptions.length > 0 ? (
            <div className="divide-y divide-[#e5e5e5]">
              {notificationOptions.map((option) => (
                <div key={option.key} className="flex items-center justify-between gap-6 py-5">
                  <div>
                    <p className="font-semibold text-[#0a0a0a]">{option.label}</p>
                    <p className="mt-1 text-sm text-[#737373]">{option.description}</p>
                  </div>
                  <Toggle
                    checked={Boolean(preferences[option.key])}
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
            <p className="rounded-[10px] border border-dashed border-[#e5e5e5] p-6 text-center text-sm text-[#737373]">
              No notification preferences are available for this role.
            </p>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={isSavingPreferences || isLoadingPreferences}
              className="blueprint-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingPreferences ? "Saving..." : "Save Notifications"}
            </button>
          </div>
        </div>
      )}

      {showDeleteAccountModal && (
        <DeleteAccountModal setDeleteAccountModal={setShowDeleteAccountModal} />
      )}
    </section>
  );
};

export default Settings;
