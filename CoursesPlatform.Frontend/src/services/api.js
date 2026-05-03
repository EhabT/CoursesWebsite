/**
 * API Service — centralised HTTP client for all backend communication.
 * Points to the .NET Web API backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';
import { msalInstance } from '../main';
import { apiRequest } from '../authConfig';

async function getAccessToken(authRequired) {
  const activeAccount = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];

  if (!activeAccount) {
    if (authRequired) throw new Error('No active Microsoft account was found. Please sign in again.');
    return null;
  }

  try {
    const tokenResponse = await msalInstance.acquireTokenSilent({
      ...apiRequest,
      account: activeAccount
    });
    return tokenResponse.accessToken;
  } catch (error) {
    console.warn('Silent token acquisition failed:', error);

    if (authRequired) {
      throw new Error('Could not get an access token for the API. Use Refresh permissions, then sign in again if prompted.');
    }

    return null;
  }
}

/**
 * Generic fetch wrapper with auth token injection and error handling.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const { authRequired = false, ...fetchOptions } = options;
  const token = await getAccessToken(authRequired);
  
  const headers = {
    ...fetchOptions.headers,
  };
  
  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, { ...fetchOptions, headers });
  
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `HTTP ${response.status} from ${url}`);
  }
  
  // Handle 204 No Content
  if (response.status === 204) return null;
  
  return response.json();
}

// ── Courses ──
export const coursesApi = {
  getAll: () => request('/courses'),
  getById: (id) => request(`/courses/${id}`),
  create: (data) => request('/courses', { method: 'POST', body: JSON.stringify(data), authRequired: true }),
  update: (id, data) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data), authRequired: true }),
  delete: (id) => request(`/courses/${id}`, { method: 'DELETE', authRequired: true }),
};

// ── Videos ──
export const videosApi = {
  getByCourse: (courseId) => request(`/courses/${courseId}/videos`),
  upload: (courseId, formData) => request(`/courses/${courseId}/videos`, {
    method: 'POST',
    body: formData, // FormData with file + metadata
    authRequired: true,
  }),
  delete: (courseId, videoId) => request(`/courses/${courseId}/videos/${videoId}`, { method: 'DELETE', authRequired: true }),
};

// ── Comments ──
export const commentsApi = {
  getByCourse: (courseId) => request(`/courses/${courseId}/comments`),
  create: (courseId, data) => request(`/courses/${courseId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
    authRequired: true,
  }),
};

// ── Ratings ──
export const ratingsApi = {
  getAverage: (courseId) => request(`/courses/${courseId}/ratings`),
  create: (courseId, data) => request(`/courses/${courseId}/ratings`, {
    method: 'POST',
    body: JSON.stringify(data),
    authRequired: true,
  }),
};

// ── Enrolments ──
export const enrolmentsApi = {
  enrol: (data) => request('/enrolments', { method: 'POST', body: JSON.stringify(data), authRequired: true }),
  getMy: () => request('/enrolments/my', { authRequired: true }),
};

// ── Upload ──
export const uploadApi = {
  image: (formData) => request('/upload/image', { method: 'POST', body: formData, authRequired: true }),
  video: (formData) => request('/upload/video', { method: 'POST', body: formData, authRequired: true }),
};

// ── Auth / current user ──
export const authApi = {
  getMe: () => request('/me', { authRequired: true }),
};
