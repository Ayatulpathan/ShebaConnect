import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types/index.js';
import { apiClient, setApiAccessToken } from '../services/api.js';
import { initSocket, disconnectSocket } from '../services/socket.js';

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  preferredLanguage?: 'bn' | 'en';
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogle: (idToken: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('shebaconnect_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and verify session on load
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('shebaconnect_token');
      if (savedToken) {
        setApiAccessToken(savedToken);
        initSocket(savedToken);
        try {
          const res = await apiClient.get<{ success: boolean; data: { user: User } }>('/auth/me');
          setUser(res.data.data.user);
        } catch {
          // Token expired or invalid, clear state
          setAccessToken(null);
          setApiAccessToken(null);
          disconnectSocket();
          localStorage.removeItem('shebaconnect_token');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await apiClient.post('/auth/login', { identifier, password });
    const { user: userData, accessToken: token } = res.data.data;

    setUser(userData);
    setAccessToken(token);
    setApiAccessToken(token);
    initSocket(token);
    localStorage.setItem('shebaconnect_token', token);
  };

  const register = async (data: RegisterData) => {
    const res = await apiClient.post('/auth/register', data);
    const { user: userData, accessToken: token } = res.data.data;

    setUser(userData);
    setAccessToken(token);
    setApiAccessToken(token);
    initSocket(token);
    localStorage.setItem('shebaconnect_token', token);
  };

  const loginWithGoogle = async (idToken: string, role?: UserRole) => {
    const res = await apiClient.post('/auth/google', { idToken, role });
    const { user: userData, accessToken: token } = res.data.data;

    setUser(userData);
    setAccessToken(token);
    setApiAccessToken(token);
    initSocket(token);
    localStorage.setItem('shebaconnect_token', token);
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setAccessToken(null);
      setApiAccessToken(null);
      disconnectSocket();
      localStorage.removeItem('shebaconnect_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
