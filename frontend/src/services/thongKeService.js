import apiClient from './apiClient';

const thongKeService = {
  // Lấy thống kê cho giảng viên
  getThongKeGiangVien: async () => {
    const response = await apiClient.get('/api/ThongKe/giang-vien');
    return response;
  },

  // Lấy thống kê cho sinh viên
  getThongKeSinhVien: async () => {
    const response = await apiClient.get('/api/ThongKe/sinh-vien');
    return response;
  }
};

export default thongKeService;
