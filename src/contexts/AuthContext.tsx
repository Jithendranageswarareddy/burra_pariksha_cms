import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiClient } from '../lib/api-client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await apiClient.getMe();
      if (res.authenticated && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (userId: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiClient.login(userId, password);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: 'Login failed: Invalid credentials' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Invalid user ID or password' };
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch {
      // ignore network errors on logout
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword?: string) => {
    try {
      const res = await apiClient.changePassword(currentPassword, newPassword, confirmPassword);
      if (res.success) {
        await checkAuth();
        return { success: true, message: res.message || 'Password changed successfully.' };
      }
      return { success: false, error: res.error || 'Failed to change password.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to change password.' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
