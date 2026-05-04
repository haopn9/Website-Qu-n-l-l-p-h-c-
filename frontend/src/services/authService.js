import apiClient from './apiClient';

const authService = {
  async login(tenDangNhap, matKhau) {
    const data = await apiClient.post('/api/xacthuc/dangnhap', { tenDangNhap, matKhau });
    localStorage.setItem('token', data.token);
    localStorage.setItem('userInfo', JSON.stringify(data));
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
  },

  getCurrentUser() {
    const raw = localStorage.getItem('userInfo');
    return raw ? JSON.parse(raw) : null;
  }
};

export default authService;
