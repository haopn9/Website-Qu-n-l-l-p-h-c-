import apiClient from './apiClient';

const classService = {
  getAllClasses() {
    return apiClient.get('/api/lophoc');
  },

  getMyClasses() {
    return apiClient.get('/api/lophoc/cua-toi');
  },

  getClassById(id) {
    return apiClient.get(`/api/lophoc/${id}`);
  },

  getSemesters() {
    return apiClient.get('/api/lophoc/hocky');
  },

  createClass(payload) {
    return apiClient.post('/api/lophoc', payload);
  },

  updateClass(id, payload) {
    return apiClient.put(`/api/lophoc/${id}`, payload);
  },

  joinClass(maLopHoc) {
    return apiClient.post('/api/lophoc/tham-gia', { maLopHoc });
  },

  deleteClass(id) {
    return apiClient.delete(`/api/lophoc/${id}`);
  },

  removeStudentFromClass(maLop, maSinhVien) {
    return apiClient.delete(`/api/lophoc/${maLop}/sinhvien/${maSinhVien}`);
  }
};

export default classService;
