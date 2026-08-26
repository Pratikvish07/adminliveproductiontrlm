import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from '../types/auth.types';
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearAuthStorage,
  getStoredToken,
  getStoredUser,
  setStoredUser,
} from '../utils/authStorage';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  updateUser: (updater: User | ((current: User | null) => User | null)) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getStoredToken()));

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    setStoredUser(userData);
  };

  const updateUser = (updater: User | ((current: User | null) => User | null)) => {
    setUser((current) => {
      const nextUser = typeof updater === 'function'
        ? updater(current)
        : updater;

      if (nextUser) {
        setStoredUser(nextUser);
      } else {
        clearAuthStorage();
      }

      return nextUser;
    });
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    clearAuthStorage();
  };

  React.useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
      clearAuthStorage();
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
