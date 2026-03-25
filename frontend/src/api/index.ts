import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const doctorApi = {
  getAll: (params?: any) => api.get('/doctors', { params }),
  getById: (id: string) => api.get(`/doctors/${id}`),
  getSpecializations: () => api.get('/doctors/specializations'),
  updateProfile: (data: any) => api.put('/doctors/profile', data),
  getMyAvailability: () => api.get('/doctors/availability/my'),
  setAvailability: (slots: any[]) => api.post('/doctors/availability', { slots }),
  getMyPatients: (page?: number) => api.get('/doctors/my-patients', { params: { page } }),
};

export const appointmentApi = {
  create: (data: any) => api.post('/appointments', data),
  getMy: (params?: any) => api.get('/appointments/my', { params }),
  updateStatus: (id: string, status: string) => api.patch(`/appointments/${id}/status`, { status }),
  getSlots: (doctorId: string, date: string) => api.get('/appointments/slots', { params: { doctorId, date } }),
  sendReminders: () => api.post('/appointments/send-reminders'),
};

export const recordApi = {
  create: (data: FormData) => api.post('/records', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMy: (page?: number) => api.get('/records/my', { params: { page } }),
  getForPatient: (patientId: string, page?: number) => api.get(`/records/patient/${patientId}`, { params: { page } }),
  update: (id: string, data: any) => api.put(`/records/${id}`, data),
};

export const chatApi = {
  getConversations: (page?: number) => api.get('/chat/conversations', { params: { page } }),
  getOrCreate: (data: any) => api.post('/chat/conversations', data),
  getMessages: (conversationId: string, page?: number) =>
    api.get(`/chat/conversations/${conversationId}/messages`, { params: { page } }),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getPendingDoctors: (page?: number) => api.get('/admin/doctors/pending', { params: { page } }),
  approveDoctor: (id: string, approve: boolean) => api.patch(`/admin/doctors/${id}/approve`, { approve }),
  toggleUser: (id: string) => api.patch(`/admin/users/${id}/toggle`),
};

export const paymentApi = {
  createCheckout: () => api.post('/payments/checkout'),
  getStatus: () => api.get('/payments/status'),
};

export default api;

export const reviewApi = {
  create: (data: { appointmentId: string; rating: number; comment?: string }) =>
    api.post('/reviews', data),
  getForDoctor: (doctorId: string, page?: number) =>
    api.get(`/reviews/doctor/${doctorId}`, { params: { page } }),
  canReview: (appointmentId: string) =>
    api.get(`/reviews/can-review/${appointmentId}`),
  getMyReview: (appointmentId: string) =>
    api.get(`/reviews/my/${appointmentId}`),
};
