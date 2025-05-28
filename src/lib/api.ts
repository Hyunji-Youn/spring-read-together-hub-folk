import axios from 'axios';

/**
 * Frontend API Service
 * Handles API requests and JWT authentication (RS256)
 */

// Set absolute HTTPS API URL for secure development
const API_URL = 'https://localhost:3000/api';

// Disable API request and response logging (security enhancement)
const DEBUG = false;

// Create API instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Always include cookies
});

// Debug logging function
const logDebug = (message, data) => {
  if (DEBUG) {
    console.log(`[API Debug] ${message}:`, data);
  }
};

/**
 * Request interceptor
 * Adds JWT Bearer token (RS256-signed) to request headers
 */
api.interceptors.request.use(
  (config) => {
    // Get access token from local storage
    const accessToken = localStorage.getItem('accessToken');
    
    // Add token to headers if it exists
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    if (DEBUG) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    if (DEBUG) {
      console.error('[API Request Error]', error);
    }
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handles token refresh when encountering 401 errors
 * Ensures all JWT operations use RS256 algorithm
 */
api.interceptors.response.use(
  (response) => {
    if (DEBUG) {
      console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    if (DEBUG) {
      console.error(`[API Error] ${error.response?.status || 'Network Error'}:`, {
        url: error.config?.url,
        data: error.response?.data
      });
    }
    
    const originalRequest = error.config;
    
    // Handle rate limiting (429) errors
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Server request limit reached.');
      
      error.isRateLimit = true;
      error.retryAfter = error.response.headers['retry-after'] 
        ? parseInt(error.response.headers['retry-after']) * 1000 
        : 60000; // Default to 1 minute if header is missing
      
      return Promise.reject(error);
    }
    
    // Handle authentication failures (401) with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        logDebug('Attempting to refresh token', {
          url: `${API_URL}/auth/refresh`,
          withCredentials: true
        });
        
        // Request new access token using refresh token (from HTTP-only cookie)
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true, // Include cookies
          baseURL: '', // Ignore Axios instance base URL
        });
        
        logDebug('Token refresh response', response.data);
        
        // Extract token from response based on structure
        let accessToken;
        if (response.data.data && response.data.data.accessToken) {
          accessToken = response.data.data.accessToken;
        } else if (response.data.accessToken) {
          accessToken = response.data.accessToken;
        } else {
          throw new Error('Invalid token response format');
        }
        
        // Store new access token
        localStorage.setItem('accessToken', accessToken);
        
        // Update original request headers
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Handle refresh token expiration or other errors
        console.error('Refresh token error:', refreshError);
        localStorage.removeItem('accessToken');
        
        // Redirect to login only in browser context
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 