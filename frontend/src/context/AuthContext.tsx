import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types';
import { authApi } from '../api/endpoints';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isInboundStaff: boolean;
  isOutboundStaff: boolean;
  isAuditor: boolean;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const normalizeRole = (r: any): UserRole => {
  if (typeof r === 'number') {
    const map: UserRole[] = ['ADMIN', 'MANAGER', 'INBOUND_STAFF', 'OUTBOUND_STAFF', 'AUDITOR', 'WAREHOUSE_STAFF'];
    return map[r] || 'WAREHOUSE_STAFF';
  }
  const str = String(r || '').toUpperCase();
  const valid: UserRole[] = ['ADMIN', 'MANAGER', 'INBOUND_STAFF', 'OUTBOUND_STAFF', 'AUDITOR', 'WAREHOUSE_STAFF'];
  return valid.includes(str as UserRole) ? (str as UserRole) : 'WAREHOUSE_STAFF';
};

const formatUserProfile = (u: any): UserProfile => {
  if (!u) return u;
  const normalizedRole = normalizeRole(u.role);
  return {
    ...u,
    role: normalizedRole,
    roleName: u.roleName || normalizedRole,
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('wms_user');
    if (!saved) return null;
    try {
      return formatUserProfile(JSON.parse(saved));
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('wms_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('wms_token');
      if (savedToken) {
        try {
          const res = await authApi.getCurrentUser();
          if (res.success && res.data) {
            const formatted = formatUserProfile(res.data);
            setUser(formatted);
            localStorage.setItem('wms_user', JSON.stringify(formatted));
          }
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken: string, newUser: UserProfile) => {
    const formatted = formatUserProfile(newUser);
    localStorage.setItem('wms_token', newToken);
    localStorage.setItem('wms_user', JSON.stringify(formatted));
    setToken(newToken);
    setUser(formatted);
  };

  const logout = () => {
    localStorage.removeItem('wms_token');
    localStorage.removeItem('wms_user');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await authApi.getCurrentUser();
      if (res.success && res.data) {
        const formatted = formatUserProfile(res.data);
        setUser(formatted);
        localStorage.setItem('wms_user', JSON.stringify(formatted));
      }
    } catch {
      // Ignored
    }
  };

  const currentRole = user?.role || 'WAREHOUSE_STAFF';
  const isAdmin = currentRole === 'ADMIN';
  const isManager = currentRole === 'ADMIN' || currentRole === 'MANAGER';
  const isInboundStaff = ['ADMIN', 'MANAGER', 'INBOUND_STAFF', 'WAREHOUSE_STAFF'].includes(currentRole);
  const isOutboundStaff = ['ADMIN', 'MANAGER', 'OUTBOUND_STAFF', 'WAREHOUSE_STAFF'].includes(currentRole);
  const isAuditor = ['ADMIN', 'MANAGER', 'AUDITOR'].includes(currentRole);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isAdmin,
    isManager,
    isInboundStaff,
    isOutboundStaff,
    isAuditor,
    isLoading,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
