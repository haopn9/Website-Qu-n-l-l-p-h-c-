import apiClient from './apiClient';

const userService = {
  getAllUsers() {
    return apiClient.get('/api/nguoidung');
  },

  getAllLopSinhViens() {
    return apiClient.get('/api/lopsinhvien');
  },

  createUser(payload) {
    return apiClient.post('/api/nguoidung', payload);
  },

  updateUser(id, payload) {
    return apiClient.put(`/api/nguoidung/${id}`, payload);
  },

  toggleUserStatus(id) {
    return apiClient.put(`/api/nguoidung/${id}/trangthai`, {});
  }
};

export default userService;
