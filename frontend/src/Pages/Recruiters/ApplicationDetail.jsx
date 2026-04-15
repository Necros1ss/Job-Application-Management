import React from 'react';

const ApplicationDetail = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col h-screen">
      {/* Header điều hướng */}
      <div className="mb-4 flex justify-between items-center">
        <button className="text-gray-500 hover:text-blue-600 font-medium flex items-center gap-2">
          <span>&larr;</span> Quay lại danh sách
        </button>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors">
            Từ chối
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm">
            Chuyển sang Phỏng vấn
          </button>
        </div>
      </div>

      {/* Main Layout: Split Screen */}
      <div className="flex flex-1 gap-6 min-h-0">
        
        {/* Cột trái: PDF Viewer (60%) */}
        <div className="flex-[3] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Hồ sơ đính kèm: CV_NguyenVanA_2026.pdf</h3>
            <button className="text-blue-600 hover:underline text-sm font-medium">Tải xuống</button>
          </div>
          <div className="flex-1 bg-gray-300 flex items-center justify-center m-4 rounded border border-dashed border-gray-400">
            {/* Trong thực tế, bạn sẽ dùng thẻ <iframe src={cvLink}> hoặc thư viện react-pdf ở đây */}
            <p className="text-gray-500 font-medium">Khu vực hiển thị nội dung file PDF</p>
          </div>
        </div>

        {/* Cột phải: Thông tin & Thao tác (40%) */}
        <div className="flex-[2] flex flex-col gap-6 overflow-y-auto pr-2">
          
          {/* Card 1: Thông tin cơ bản */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
                NA
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Nguyễn Văn A</h2>
                <p className="text-blue-600 font-medium text-sm mt-1">Ứng tuyển: Frontend Developer</p>
                <div className="mt-2 text-sm text-gray-500 space-y-1">
                  <p>📧 nguyenwana@example.com</p>
                  <p>📱 0901 234 567</p>
                  <p>📅 Nộp ngày: 13/04/2026</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái hiện tại</label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-yellow-50 text-yellow-800 font-medium">
                <option>Đang xem xét</option>
                <option>Mới nộp</option>
                <option>Phỏng vấn</option>
                <option>Đề nghị nhận việc</option>
              </select>
            </div>
          </div>

          {/* Card 2: Ghi chú đánh giá */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex-1">
            <h3 className="font-bold text-gray-800 mb-4">Ghi chú & Đánh giá nội bộ</h3>
            <textarea 
              rows="5" 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-4"
              placeholder="Nhập nhận xét của bạn về ứng viên này (Ứng viên sẽ không thấy phần này)..."
            ></textarea>
            <button className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors">
              Lưu ghi chú
            </button>
            
            {/* Lịch sử ghi chú */}
            <div className="mt-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-700">Kỹ năng cứng khá ổn, dùng React rất thành thạo. Cần hỏi thêm về cách tối ưu performance.</p>
                <p className="text-xs text-gray-400 mt-2">Bởi HR - 2 giờ trước</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;