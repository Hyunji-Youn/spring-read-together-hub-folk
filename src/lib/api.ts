import axios from 'axios';

// Get API base URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Setup request interceptor
api.interceptors.request.use(
  (config) => {
    // Get access token from local storage
    const accessToken = localStorage.getItem('accessToken');
    
    // Add token to header if it exists
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Setup response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // For 429 errors (rate limiting), add a timestamp to prevent immediate retry
    if (error.response?.status === 429) {
      // Log the rate limit error
      console.warn('Rate limit exceeded. Server request limit reached.');
      
      // Add information to the error for better handling in components
      error.isRateLimit = true;
      error.retryAfter = error.response.headers['retry-after'] 
        ? parseInt(error.response.headers['retry-after']) * 1000 
        : 60000; // Default to 1 minute if no header
      
      return Promise.reject(error);
    }
    
    // For 401 errors (authentication failure) that haven't been retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Request new access token using refresh token
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {}, {
          withCredentials: true, // Include cookies with request
        });
        
        // Save new access token
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        
        // Update original request header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token is also expired, logout
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 