'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AuthTokens, UserRole } from '@distributed-compute/shared-types';

interface AuthContextType {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const refreshProfile = async () => {
    try {
      const storedTokens = localStorage.getItem('dc_tokens');
      if (storedTokens) {
        const parsed = JSON.parse(storedTokens);
        const res = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${parsed.accessToken}` },
        });
        if (res.ok) {
          const profile = await res.json();
          setUser(profile);
          localStorage.setItem('dc_user', JSON.stringify(profile));
        }
      }
    } catch {}
  };

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('dc_user');
      const storedTokens = localStorage.getItem('dc_tokens');
      if (storedUser && storedTokens) {
        setUser(JSON.parse(storedUser));
        setTokens(JSON.parse(storedTokens));
      }
    } catch {
      // Ignore parse errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await res.json();
    setUser(data.user);
    setTokens(data.tokens);
    localStorage.setItem('dc_user', JSON.stringify(data.user));
    localStorage.setItem('dc_tokens', JSON.stringify(data.tokens));
  };

  const register = async (email: string, password: string, role: UserRole) => {
    const res = await fetch(`${apiUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed');
    }

    const data = await res.json();
    setUser(data.user);
    setTokens(data.tokens);
    localStorage.setItem('dc_user', JSON.stringify(data.user));
    localStorage.setItem('dc_tokens', JSON.stringify(data.tokens));
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('dc_user');
    localStorage.removeItem('dc_tokens');
  };

  return (
    <AuthContext.Provider value={{ user, tokens, isLoading, login, register, logout, refreshProfile }}>
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
