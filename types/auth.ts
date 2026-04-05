/**
 * Tipos para autenticación de usuarios
 */

export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // En producción, esto debería estar hasheado
  createdAt: string;
  referralCode: string;
  referrerUserId?: string;
  balance?: number;
  totalReferrals?: number;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (username: string, email: string, password: string, referralCode?: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  getCurrentUser: () => User | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
}
