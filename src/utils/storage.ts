import type { UserInfo } from '../api/types/auth.types';

// Helper functions cho localStorage
export const storage = {
  // Token
  setAccessToken: (token: string) => {
    localStorage.setItem('accessToken', token);
  },

  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },

  // User
  setUser: (user: UserInfo) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser: (): UserInfo | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get full name
  getFullName: (): string => {
    const user = storage.getUser();
    if (!user?.userInfo) return '';
    return user.userInfo.fullName || `${user.userInfo.lastName} ${user.userInfo.firstName}`.trim();
  },

  // Check roles
  hasRole: (role: string): boolean => {
    const user = storage.getUser();
    return user?.roles?.includes(role) || false;
  },

  // Check permissions
  hasPermission: (permission: string): boolean => {
    const user = storage.getUser();
    return user?.permissions?.includes(permission) || false;
  },

  // Check if user is customer
  isCustomer: (): boolean => {
    return storage.hasRole('ROLE_CUSTOMER');
  },

  // Check if user is admin
  isAdmin: (): boolean => {
    return storage.hasRole('ROLE_ADMIN');
  },

  // Clear all
  clear: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },
};