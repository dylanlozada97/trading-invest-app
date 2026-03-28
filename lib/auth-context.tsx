import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'users_list',
  CURRENT_USER: 'current_user',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  // Cargar datos persistidos
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
        const savedCurrentUser = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);

        if (savedUsers) {
          setUsers(JSON.parse(savedUsers));
        }
        if (savedCurrentUser) {
          setUser(JSON.parse(savedCurrentUser));
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Guardar usuarios
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  // Guardar usuario actual
  useEffect(() => {
    if (user) {
      AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [user]);

  const generateReferralCode = (username: string): string => {
    return `REF${username.substring(0, 3).toUpperCase()}${Date.now().toString().slice(-4)}`;
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    referralCode?: string
  ): Promise<void> => {
    // Validar que el usuario no exista
    const existingUser = users.find((u) => u.username === username || u.email === email);
    if (existingUser) {
      throw new Error('El usuario o correo ya existe');
    }

    // Validar contraseña
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // Validar correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Correo inválido');
    }

    // Buscar referidor si se proporciona código
    let referrerUserId: string | undefined;
    if (referralCode) {
      const referrer = users.find((u) => u.referralCode === referralCode);
      if (!referrer) {
        throw new Error('Código de referido inválido');
      }
      referrerUserId = referrer.id;
    }

    const newUser: User = {
      id: Date.now().toString(),
      username,
      email,
      password, // En producción, esto debería estar hasheado
      createdAt: new Date().toISOString(),
      referralCode: generateReferralCode(username),
      referrerUserId,
    };

    setUsers((prev) => [...prev, newUser]);
    setUser(newUser);
  };

  const login = async (username: string, password: string): Promise<void> => {
    const foundUser = users.find((u) => u.username === username && u.password === password);

    if (!foundUser) {
      throw new Error('Usuario o contraseña incorrectos');
    }

    setUser(foundUser);
  };

  const logout = () => {
    setUser(null);
  };

  const getCurrentUser = (): User | null => {
    return user;
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
