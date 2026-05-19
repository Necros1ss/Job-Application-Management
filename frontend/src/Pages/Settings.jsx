import { useState } from "react";
import { FaEye, FaEyeSlash, FaLock, FaTrashAlt } from "react-icons/fa";
import { tokenStorage } from "../lib/api";
import DeleteAccountModal from "../Components/DeleteAccountModal";
import { showError, showSuccess } from "../utils/toast";

const Settings = () => {
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenStorage.getToken()}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      }).then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to change password");
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        showSuccess("Password changed successfully!");
      });
    } catch (err) {
      showError(err.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="max-w-2xl">
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Settings</h2>
        <p className="text-gray-500">Manage your account preferences and security</p>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <FaLock size={20} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Change Password</h3>
            <p className="text-sm text-gray-500">Update your password to keep your account secure</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Account */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <FaTrashAlt size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Delete Account</h3>
            <p className="text-sm text-gray-500">Permanently delete your account and all associated data</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteAccountModal(true)}
          className="px-5 py-2.5 border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors"
        >
          Delete my Account
        </button>
      </div>

      {showDeleteAccountModal && (
        <DeleteAccountModal setDeleteAccountModal={setShowDeleteAccountModal} />
      )}
    </section>
  );
};

export default Settings;
