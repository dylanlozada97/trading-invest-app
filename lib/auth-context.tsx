import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthContextType } from '@/types/auth';
import { getApiBaseUrl } from '@/constants/oauth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: 'current_user',
};

const API_BASE = getApiBaseUrl();

// Helper to call tRPC endpoints
async function trpcCall(path: string, input?: any, method: 'GET' | 'POST' = 'POST') {
  const url = `${API_BASE}/api/trpc/${path}`;

  if (method === 'GET') {
    const encodedInput = input ? `?input=${encodeURIComponent(JSON.stringify({ json: input }))}` : '';
    const response = await fetch(`${url}${encodedInput}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'Error del servidor');
    return data.result?.data?.json;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ json: input }),
  });
  const data = await response.json();
  if (data.error) {
    const errorMsg = data.error.json?.message || data.error.message || 'Error del servidor';
    throw new Error(errorMsg);
  }
  return data.result?.data?.json;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved user on startup
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          // Refresh user data from server
          try {
            const freshData = await trpcCall('appAuth.getProfile', { userId: parsed.id }, 'GET');
            if (freshData) {
              const refreshedUser: User = {
                id: String(freshData.id),
                username: freshData.username,
                email: freshData.email,
                password: '',
                createdAt: freshData.createdAt,
                referralCode: freshData.referralCode,
                referrerUserId: freshData.referrerUserId ? String(freshData.referrerUserId) : undefined,
                balance: freshData.balance,
                totalReferrals: freshData.totalReferrals,
              };
              setUser(refreshedUser);
              await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(refreshedUser));
            } else {
              setUser(parsed);
            }
          } catch {
            // If server is unavailable, use cached data
            setUser(parsed);
          }
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // Save current user to storage
  useEffect(() => {
    if (user) {
      AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [user]);

  const register = async (
    username: string,
    email: string,
    password: string,
    referralCode?: string
  ): Promise<void> => {
    // Call backend API
    const result = await trpcCall('appAuth.register', {
      username,
      email,
      password,
      referralCode: referralCode || undefined,
    });

    const newUser: User = {
      id: String(result.id),
      username: result.username,
      email: result.email,
      password: '',
      createdAt: new Date().toISOString(),
      referralCode: result.referralCode,
      balance: result.balance,
      totalReferrals: result.totalReferrals,
    };

    setUser(newUser);
  };

  const login = async (username: string, password: string): Promise<void> => {
    // Call backend API
    const result = await trpcCall('appAuth.login', { username, password });

    const loggedInUser: User = {
      id: String(result.id),
      username: result.username,
      email: result.email,
      password: '',
      createdAt: new Date().toISOString(),
      referralCode: result.referralCode,
      referrerUserId: result.referrerUserId ? String(result.referrerUserId) : undefined,
      balance: result.balance,
      totalReferrals: result.totalReferrals,
    };

    setUser(loggedInUser);
  };

  const logout = () => {
    setUser(null);
  };

  const getCurrentUser = (): User | null => {
    return user;
  };

  // Refresh user data from server
  const refreshUser = async () => {
    if (!user) return;
    try {
      const freshData = await trpcCall('appAuth.getProfile', { userId: Number(user.id) }, 'GET');
      if (freshData) {
        const refreshedUser: User = {
          ...user,
          balance: freshData.balance,
          totalReferrals: freshData.totalReferrals,
        };
        setUser(refreshedUser);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    register,
    login,
    logout,
    getCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
}
