import axios from 'axios';
import { BACKEND_URL } from '../utils/constants';

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  const secret = localStorage.getItem('adminSecret');
  if (secret) {
    config.headers['X-Admin-Secret'] = secret;
  }
  return config;
});

// User endpoints
export const analyzeImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  
  try {
    const response = await api.post('/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

// Admin endpoints
export const getAllReports = async (filters = {}) => {
  try {
    const response = await api.get('/admin/reports', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/admin/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

export const updateReportStatus = async (reportId, status) => {
  try {
    const response = await api.patch(`/admin/reports/${reportId}`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
};

export const deleteReport = async (reportId) => {
  try {
    const response = await api.delete(`/admin/reports/${reportId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};

export const getReportById = async (reportId) => {
  try {
    const response = await api.get(`/admin/reports/${reportId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching report:', error);
    throw error;
  }
};

export const getContractors = async () => {
  try {
    const response = await api.get('/admin/contractors');
    return response.data;
  } catch (error) {
    console.error('Error fetching contractors:', error);
    throw error;
  }
};

export const assignReportToContractor = async (reportId, contractorId) => {
  try {
    const response = await api.patch(`/admin/reports/${reportId}/assign`, { contractor_id: contractorId });
    return response.data;
  } catch (error) {
    console.error('Error assigning report to contractor:', error);
    throw error;
  }
};

export default api;