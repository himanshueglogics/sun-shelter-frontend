import axios from 'axios';
import { getSocket } from '../services/socket';
import { logout } from '../utils/auth';

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";
// const API_BASE='https://wagonless-byron-noninclusively.ngrok-free.dev/api' || "http://localhost:5000/api";

const instance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    try {
      const s = getSocket();
      if (s && s.id) {
        config.headers['x-socket-id'] = s.id;
      }
    } catch (_) {}
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      logout();
    }
    return Promise.reject(err);
  }
);

export default instance;
