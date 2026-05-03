/**
 * API Service — centralised HTTP client for all backend communication.
 * Points to the .NET Web API backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';
import { msalInstance } from '../main';
import { apiRequest } from '../authConfig';

/**
 * Generic fetch wrapper with auth token injection and error handling.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  // Try to acquire an access token silently
  let token = null;
  const activeAccount = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
  if (activeAccount) {
    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...apiRequest,
        account: activeAccount
      });
      token = tokenResponse.accessToken;
    } catch (e) {
      console.warn("Silent token failed, trying popup...", e);
      try {
        const tokenResponse = await msalInstance.acquireTokenPopup({
          ...apiRequest,
          account: activeAccount
        });
        token = tokenResponse.accessToken;
      } catch (popupError) {
        console.warn("Popup token also failed", popupError);
      }
    }
  }
  
  const headers = {
    ...options.headers,
  };
  
  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `HTTP ${response.status}`);
  }
  
  // Handle 204 No Content
  if (response.status === 204) return null;
  
  return response.json();
}

// ── Courses ──
export const coursesApi = {
  getAll: () => request('/courses'),
  getById: (id) => request(`/courses/${id}`),
  create: (data) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/courses/${id}`, { method: 'DELETE' }),
};

// ── Videos ──
export const videosApi = {
  getByCourse: (courseId) => request(`/courses/${courseId}/videos`),
  upload: (courseId, formData) => request(`/courses/${courseId}/videos`, {
    method: 'POST',
    body: formData, // FormData with file + metadata
  }),
  delete: (courseId, videoId) => request(`/courses/${courseId}/videos/${videoId}`, { method: 'DELETE' }),
};

// ── Comments ──
export const commentsApi = {
  getByCourse: (courseId) => request(`/courses/${courseId}/comments`),
  create: (courseId, data) => request(`/courses/${courseId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ── Ratings ──
export const ratingsApi = {
  getAverage: (courseId) => request(`/courses/${courseId}/ratings`),
  create: (courseId, data) => request(`/courses/${courseId}/ratings`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ── Enrolments ──
export const enrolmentsApi = {
  enrol: (data) => request('/enrolments', { method: 'POST', body: JSON.stringify(data) }),
  getMy: () => request('/enrolments/my'),
};

// ── Upload ──
export const uploadApi = {
  image: (formData) => request('/upload/image', { method: 'POST', body: formData }),
  video: (formData) => request('/upload/video', { method: 'POST', body: formData }),
};
