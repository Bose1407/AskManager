// Auth utility functions
export type UserRole = 'manager' | 'employee' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePhoto?: string;
}

export interface AuthToken {
  token: string;
  user: User;
}

// Simulate JWT token storage (in production, use secure storage)
const AUTH_STORAGE_KEY = 'auth_token';
const USER_STORAGE_KEY = 'user_data';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(AUTH_STORAGE_KEY);
};

export const getStoredUser = (): User | null => {
  const userData = localStorage.getItem(USER_STORAGE_KEY);
  return userData ? JSON.parse(userData) : null;
};

export const saveAuth = (token: string, user: User) => {
  localStorage.setItem(AUTH_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};

export const canAccessDashboard = (): boolean => {
  const user = getStoredUser();
  return user?.role === 'manager' || user?.role === 'admin';
};
