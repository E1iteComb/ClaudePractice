import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);

// Tasks
export const getTasks = () => api.get('/tasks');
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// Schedule
export const generateSchedule = () => api.post('/generate-schedule');
export const getSchedule = () => api.get('/schedule');
export const markSessionComplete = (id, completed) =>
  api.patch(`/sessions/${id}/complete`, { completed });

export default api;
