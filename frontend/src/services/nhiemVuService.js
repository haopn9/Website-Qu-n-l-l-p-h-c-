import apiClient from './apiClient';

const nhiemVuService = {
  // Lấy danh sách task của nhóm
  getTasksByGroup: async (maNhom) => {
    return await apiClient.get(`/api/nhiemvu?maNhom=${maNhom}`);
  },

  // Lấy chi tiết task
  getTaskById: async (id) => {
    return await apiClient.get(`/api/nhiemvu/${id}`);
  },

  // Tạo task mới
  createTask: async (data) => {
    return await apiClient.post('/api/nhiemvu', data);
  },

  // Cập nhật task
  updateTask: async (id, data) => {
    return await apiClient.put(`/api/nhiemvu/${id}`, data);
  },

  // Xóa task
  deleteTask: async (id) => {
    return await apiClient.delete(`/api/nhiemvu/${id}`);
  },

  // Sinh viên nộp bài
  submitTask: async (id, data) => {
    return await apiClient.put(`/api/nhiemvu/${id}/nop`, data);
  },

  // Nhóm trưởng duyệt task
  approveTask: async (id, data) => {
    return await apiClient.put(`/api/nhiemvu/${id}/duyet`, data);
  },

  // Nhóm trưởng yêu cầu làm lại
  rejectTask: async (id, data) => {
    return await apiClient.put(`/api/nhiemvu/${id}/lam-lai`, data);
  }
};

export default nhiemVuService;
