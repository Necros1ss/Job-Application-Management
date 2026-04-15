import React from 'react';

const StatCard = ({ title, value, trend }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <p className="text-sm text-gray-500 font-medium">{title}</p>
    <div className="flex items-baseline mt-2">
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      {trend && <span className="ml-2 text-xs font-medium text-green-600">{trend}</span>}
    </div>
  </div>
);

const RecruiterDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Bảng điều khiển</h2>
            <p className="text-gray-500">Chào buổi chiều, đây là cập nhật hôm nay của bạn.</p>
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            + Đăng tin mới
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Tin đang mở" value="12" />
          <StatCard title="Ứng viên mới" value="48" trend="+12% hôm nay" />
          <StatCard title="Lịch phỏng vấn" value="6" />
          <StatCard title="Hồ sơ đã duyệt" value="156" />
        </div>

        {/* Recent Applicants Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-bottom border-gray-100">
            <h3 className="font-bold text-gray-800">Ứng viên gần đây</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-sm uppercase">
                <th className="px-6 py-4 font-medium">Họ tên</th>
                <th className="px-6 py-4 font-medium">Vị trí</th>
                <th className="px-6 py-4 font-medium">Ngày nộp</th>
                <th className="px-6 py-4 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Dữ liệu mẫu */}
              <tr>
                <td className="px-6 py-4 font-medium">Nguyễn Văn A</td>
                <td className="px-6 py-4">Frontend Developer</td>
                <td className="px-6 py-4">2 giờ trước</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Đang chờ</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default RecruiterDashboard;