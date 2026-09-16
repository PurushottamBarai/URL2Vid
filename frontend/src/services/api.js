import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

export const fetchVideoInfoAPI = async (url, signal) => {
  const response = await api.post('/info', { url }, { signal });
  return response.data;
};

export default api;
