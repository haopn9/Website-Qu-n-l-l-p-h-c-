import apiClient from './apiClient';

const adminService = {
  getDashboardStats() {
    return apiClient.get('/api/admin/thongke');
  }
};

export default adminService;
