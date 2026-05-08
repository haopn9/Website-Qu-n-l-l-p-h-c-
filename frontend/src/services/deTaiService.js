import apiClient from './apiClient';

const deTaiService = {
  // Lấy danh sách đề tài của một lớp
  getDanhSachDeTai: (maLop) => {
    return apiClient.get(`/api/detai/lop/${maLop}`);
  },

  // Tạo đề tài mới (Hỗ trợ upload file)
  taoDeTai: (formData) => {
    return apiClient.post('/api/detai', formData, true); // Thêm cờ isFormData
  },

  // Cập nhật đề tài
  capNhatDeTai: (id, data) => {
    const isFormData = data instanceof FormData;
    return apiClient.put(`/api/detai/${id}`, data, isFormData);
  },

  // Xóa đề tài
  xoaDeTai: (id) => {
    return apiClient.delete(`/api/detai/${id}`);
  },

  // Giảng viên giao đề tài cho nhóm hoặc cập nhật phương thức
  giaoDeTai: (data) => {
    return apiClient.post('/api/detai/cap-nhat-giao', data);
  },

  // Sinh viên đăng ký đề tài
  dangKyDeTai: (data) => {
    return apiClient.post('/api/detai/dang-ky', data);
  }
};

export default deTaiService;
