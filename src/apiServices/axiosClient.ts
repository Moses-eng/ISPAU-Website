// src/apiServices/axiosClient.ts

import axios from 'axios';
import authStore from './systemUserAuthStore';
import { BASE_URL } from './env';

const axiosClient = axios.create({
baseURL: BASE_URL,
timeout: 30000,
headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
},
});


axiosClient.interceptors.request.use((config) => {
const token = authStore.getToken();
if (token) {
    config.headers.Authorization = `Bearer ${token}`;
}
return config;
});

axiosClient.interceptors.response.use(
(res) => res,
(error) => {
    if (error.response?.status === 401) {
    authStore.clear();
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
    }
    return Promise.reject(error);
}
);

export default axiosClient;
