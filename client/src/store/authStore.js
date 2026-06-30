import { create } from 'zustand';
import api, { clearStoredToken, getStoredToken, getStoredTokenSource, persistToken, setAuthToken } from '../api/client';

let hasLoggedMePayload = false;

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  const companyId = user.companyId
    || user.company?._id
    || (typeof user.company === 'string' ? user.company : null)
    || null;

  const company = user.company && typeof user.company === 'object' ? user.company : null;

  return {
    ...user,
    companyId,
    company,
  };
};

const normalizeAuthPayload = (payload) => {
  const candidateUser = payload?.user || payload?.data || null;
  const candidateCompany = payload?.company || candidateUser?.company || null;
  const normalizedUser = normalizeUser(candidateUser);

  if (!normalizedUser) {
    return null;
  }

  const companyId = normalizedUser.companyId
    || candidateCompany?._id
    || (typeof candidateCompany === 'string' ? candidateCompany : null)
    || null;

  const company = candidateCompany && typeof candidateCompany === 'object' ? candidateCompany : normalizedUser.company;

  return {
    ...normalizedUser,
    companyId,
    company: company || null,
  };
};

const extractToken = (response) => {
  const headerToken = response?.headers?.authorization?.startsWith('Bearer ')
    ? response.headers.authorization.split(' ')[1]
    : null;

  return (
    response?.data?.token
    || response?.data?.data?.token
    || response?.data?.accessToken
    || response?.data?.jwt
    || headerToken
    || null
  );
};

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  initialized: false,
  error: null,

  initializeAuth: async () => {
    const token = getStoredToken();
    const tokenSource = getStoredTokenSource();

    set({ error: null });

    if (!token) {
      setAuthToken(null);
      set({ user: null, isAuthenticated: false, loading: false, initialized: true });
      return null;
    }

    set({ loading: true });
    setAuthToken(token);

    try {
      const response = await api.get('/auth/me');
      const user = normalizeAuthPayload(response.data);
      const serverToken = extractToken(response);

      if (serverToken) {
        persistToken(serverToken, tokenSource === 'local');
        setAuthToken(serverToken);
      }

      set({ user, isAuthenticated: true, loading: false, initialized: true });
      return user;
    } catch {
      clearStoredToken();
      setAuthToken(null);
      set({ user: null, isAuthenticated: false, loading: false, initialized: true });
      return null;
    }
  },

  login: async (email, password, remember = false) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password, remember });
      const token = extractToken(response);

      if (token) {
        persistToken(token, remember);
        setAuthToken(token);
      }

      const user = normalizeAuthPayload(response.data);
      set({ user, isAuthenticated: true, loading: false, initialized: true });
      return { success: true };
    } catch (error) {
      const apiError = {
        message: error.response?.data?.message || 'Login failed',
        errorCode: error.response?.data?.error_code || 'AUTH_ERROR'
      };
      set({ 
        error: apiError, 
        loading: false 
      });
      return { success: false, error: apiError };
    }
  },

  register: async (name, email, password, companyName, companyTaxId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        companyName,
        companyTaxId,
      });
      const token = extractToken(response);
      if (token) {
        persistToken(token, true);
        setAuthToken(token);
        const user = normalizeAuthPayload(response.data);
        set({ user, isAuthenticated: true, loading: false, initialized: true });
      } else {
        clearStoredToken();
        setAuthToken(null);
        set({ user: null, isAuthenticated: false, loading: false, initialized: true });
      }
      return {
        success: true,
        verificationRequired: response.data?.verificationRequired ?? !token,
        message: response.data?.message || 'Registration successful.',
      };
    } catch (error) {
      const apiError = {
        message: error.response?.data?.error || 'Registration failed',
        errorCode: error.response?.data?.error_code || 'REGISTRATION_ERROR'
      };
      set({ 
        error: apiError, 
        loading: false 
      });
      return { success: false, error: apiError };
    }
  },
  setUser: (user) => {
    const normalizedUser = normalizeUser(user);
    set({ user: normalizedUser, isAuthenticated: !!normalizedUser, initialized: true });
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }

    clearStoredToken();
    setAuthToken(null);
    set({ user: null, isAuthenticated: false, error: null, loading: false, initialized: true });
  },

  fetchMe: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/auth/me');
      if (import.meta.env.DEV && !hasLoggedMePayload) {
        console.debug('[auth] /auth/me payload', response.data);
        hasLoggedMePayload = true;
      }
      const user = normalizeAuthPayload(response.data);
      set({ user, isAuthenticated: true, loading: false, initialized: true });
      return user;
    } catch {
      clearStoredToken();
      setAuthToken(null);
      set({ user: null, isAuthenticated: false, loading: false, initialized: true });
      return false;
    }
  },
}));

export default useAuthStore;
