import axios from 'axios';

const AUTH_TOKEN_LOCAL_KEY = 'auth_token';
const AUTH_TOKEN_SESSION_KEY = 'auth_token_session';

const api = axios.create({
  baseURL: `${(import.meta.env.VITE_API_URL ).replace(/\/$/, '')}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getStoredToken = () => {
  const localToken = localStorage.getItem(AUTH_TOKEN_LOCAL_KEY);
  if (localToken) return localToken;
  return sessionStorage.getItem(AUTH_TOKEN_SESSION_KEY);
};

export const getStoredTokenSource = () => {
  if (localStorage.getItem(AUTH_TOKEN_LOCAL_KEY)) {
    return 'local';
  }

  if (sessionStorage.getItem(AUTH_TOKEN_SESSION_KEY)) {
    return 'session';
  }

  return null;
};

export const persistToken = (token, remember = false) => {
  localStorage.removeItem(AUTH_TOKEN_LOCAL_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_SESSION_KEY);

  if (!token) return;

  if (remember) {
    localStorage.setItem(AUTH_TOKEN_LOCAL_KEY, token);
    return;
  }

  sessionStorage.setItem(AUTH_TOKEN_SESSION_KEY, token);
};

export const clearStoredToken = () => {
  localStorage.removeItem(AUTH_TOKEN_LOCAL_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_SESSION_KEY);
};

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
};

const existingToken = getStoredToken();
if (existingToken) {
  setAuthToken(existingToken);
}

export default api;
