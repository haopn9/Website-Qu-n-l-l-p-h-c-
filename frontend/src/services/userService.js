import apiClient from './apiClient';

const userService = {
  getAllUsers() {
    return apiClient.get('/api/nguoidung');
  },

  createUser(payload) {
    return apiClient.post('/api/nguoidung', payload);
  },

  toggleUserStatus(id) {
    return apiClient.put(`/api/nguoidung/${id}/trangthai`, {});
  },

  deleteUser(id) {
    return apiClient.delete(`/api/nguoidung/${id}`);
  }
};

export default userService;
