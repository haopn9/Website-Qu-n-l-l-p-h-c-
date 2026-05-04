import apiClient from './apiClient';

const classService = {
  getAllClasses() {
    return apiClient.get('/api/lophoc');
  },

  getSemesters() {
    return apiClient.get('/api/lophoc/hocky');
  },

  joinClass(maLopHoc) {
    return apiClient.post('/api/lophoc/tham-gia', { maLopHoc });
  }
};

export default classService;
