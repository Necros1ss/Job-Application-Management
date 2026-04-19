import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { applyFromJob } from "../../lib/api"; 

const FormApply = ({ isOpen, onClose, jobDetail, onSuccess }) => {
  const navigate = useNavigate();
  const [cvFile, setCvFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!cvFile) {
      alert("Vui lòng tải lên CV của bạn.");
      return;
    }

    try {
      setIsLoading(true);
      await applyFromJob(jobDetail?.id, cvFile, coverLetter); 
      alert("Apply thành công.");   
      if (onSuccess) onSuccess();
      onClose(); 
      setTimeout(() => { navigate("/candidate/job"); }, 1000);
    } catch (error) {
      console.error("Lỗi khi apply:", error);
      alert(error.message || "Apply thất bại.");   
    } finally {
      setIsLoading(false);
    } 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-900">Nộp hồ sơ ứng tuyển</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition text-xl"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleApplySubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Vị trí: <span className="font-normal">{jobDetail?.title}</span>
            </label>
          </div>

          {/* Upload CV */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tải lên CV (PDF, DOCX) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Nhấn để tải lên</span> hoặc kéo thả file
                  </p>
                  <p className="text-xs text-gray-500">
                    {cvFile ? cvFile.name : "Chưa có file nào được chọn"}
                  </p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setCvFile(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Thư giới thiệu (Cover Letter)
            </label>
            <textarea 
              rows="4"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none"
              placeholder="Viết đôi lời giới thiệu về bản thân và lý do bạn phù hợp với công việc này..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "Đang gửi..." : "Gửi hồ sơ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormApply;