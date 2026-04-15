import React from 'react';

const CreateJob = ({ isOpen, onClose }) => {
  if (!isOpen) return null; // Không render gì nếu modal đóng

  return (
    // Overlay nền mờ
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      
      {/* Box nội dung Modal */}
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-800">Tạo tin tuyển dụng mới</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 font-bold text-xl">
            &times;
          </button>
        </div>

        {/* Body (Form) có thể cuộn */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí cần tuyển *</label>
            <input type="text" placeholder="VD: Frontend Developer" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mức lương</label>
              <input type="text" placeholder="VD: 15,000,000 - 25,000,000 VND" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại hình</label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                <option>Toàn thời gian (Full-time)</option>
                <option>Bán thời gian (Part-time)</option>
                <option>Làm việc từ xa (Remote)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả công việc</label>
            <textarea rows="4" placeholder="Nhập chi tiết công việc, quyền lợi..." className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"></textarea>
          </div>
        </div>

        {/* Footer chứa nút bấm */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">
            Hủy bỏ
          </button>
          <button className="px-5 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
            Đăng tin ngay
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateJob;