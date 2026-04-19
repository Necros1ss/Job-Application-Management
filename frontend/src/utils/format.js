export const parseBulletPoints = (text) => {
  if (!text) return [];
  
  return text
    .split('\n') // Tách thành từng dòng
    .filter((line) => line.trim() !== '') // Loại bỏ các dòng trống
    .map((line) => line.replace(/^[-*]\s*/, '').trim()); // Xóa dấu '-' hoặc '*' ở đầu mỗi dòng
};

export const formatMessageTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString("vi-VN");
};

export const calculateAge = (birthDateValue) => {
  if (!birthDateValue) return ''; // Trả về chuỗi rỗng hoặc 0 tùy logic app của bạn

  const birthDate = new Date(birthDateValue);
  
  // Kiểm tra xem dữ liệu truyền vào có phải là ngày tháng hợp lệ không
  if (Number.isNaN(birthDate.getTime())) return '';

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  // Nếu tháng hiện tại nhỏ hơn tháng sinh, 
  // HOẶC bằng tháng sinh nhưng ngày hiện tại nhỏ hơn ngày sinh
  // => Có nghĩa là chưa tới sinh nhật trong năm nay -> Trừ đi 1 tuổi
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};