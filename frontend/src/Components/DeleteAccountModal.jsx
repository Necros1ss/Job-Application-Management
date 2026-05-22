import React from "react";
import { useNavigate } from "react-router-dom";
import { accountApi, authApi, tokenStorage } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { showError, showSuccess } from "../utils/toast";

const DeleteAccountModal = ({ setDeleteAccountModal }) => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleDelete = async () => {
    try {
      await accountApi.deleteMe();
      await authApi.logout().catch(() => undefined);
      tokenStorage.clearSession();
      setDeleteAccountModal(false);
      showSuccess(t("settings.accountDeleted"));
      navigate("/login");
    } catch (err) {
      showError(err.message || t("settings.deleteFailed"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{t("settings.deleteAccount")}</h3>
        <p className="text-gray-500 text-center mb-6 leading-relaxed">
          {t("settings.deleteModalBody")}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteAccountModal(false)}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
          >
            {t("settings.delete")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
