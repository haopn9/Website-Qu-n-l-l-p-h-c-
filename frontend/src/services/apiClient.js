const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5186';

const buildHeaders = (extraHeaders = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const request = async (path, options = {}, isFormData = false) => {
  const headers = buildHeaders(options.headers);
  if (isFormData) {
    delete headers['Content-Type']; // Để trình duyệt tự set boundary cho FormData
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: isFormData ? options.body : (options.body ? options.body : null)
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.thongBao || payload?.message || 'Có lỗi xảy ra khi gọi API';
    throw new Error(message);
  }

  return payload;
};

const apiClient = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body, isFormData = false) => 
    request(path, { method: 'POST', body: isFormData ? body : JSON.stringify(body) }, isFormData),
  put: (path, body, isFormData = false) => 
    request(path, { method: 'PUT', body: isFormData ? body : JSON.stringify(body) }, isFormData),
  delete: (path) => request(path, { method: 'DELETE' })
};

export default apiClient;
