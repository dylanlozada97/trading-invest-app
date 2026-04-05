import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Withdrawal, WithdrawalContextType } from '@/types/withdrawal';
import { useAuth } from './auth-context';
import { getApiBaseUrl } from '@/constants/oauth';

const WithdrawalContext = createContext<WithdrawalContextType | undefined>(undefined);

const STORAGE_KEYS = {
  WITHDRAWALS: 'withdrawals_list',
};

const WITHDRAWAL_INTERVAL_DAYS = 15;
const API_BASE = getApiBaseUrl();

async function trpcCall(path: string, input?: any, method: 'GET' | 'POST' = 'POST') {
  const url = `${API_BASE}/api/trpc/${path}`;
  if (method === 'GET') {
    const encodedInput = input ? `?input=${encodeURIComponent(JSON.stringify({ json: input }))}` : '';
    const response = await fetch(`${url}${encodedInput}`, { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'Error del servidor');
    return data.result?.data?.json;
  }
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ json: input }) });
  const data = await response.json();
  if (data.error) {
    const errorMsg = data.error.json?.message || data.error.message || 'Error del servidor';
    throw new Error(errorMsg);
  }
  return data.result?.data?.json;
}

export function WithdrawalProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  // Load withdrawals from server
  const loadFromServer = useCallback(async () => {
    if (!user) return;
    try {
      const serverWithdrawals = await trpcCall('withdrawals.list', { userId: Number(user.id) }, 'GET');
      if (serverWithdrawals) {
        const mapped: Withdrawal[] = serverWithdrawals.map((w: any) => ({
          id: String(w.id),
          userId: String(w.userId),
          amount: Number(w.amount),
          status: w.status === 'approved' ? 'completed' : w.status,
          bankAccount: w.accountNumber || '',
          requestedAt: w.createdAt,
          processedAt: w.status !== 'pending' ? w.updatedAt : undefined,
        }));
        setWithdrawals(mapped);
      }
    } catch (error) {
      console.error('Error loading withdrawals from server:', error);
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
      if (saved) setWithdrawals(JSON.parse(saved));
    }
  }, [user]);

  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  // Cache locally
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(withdrawals));
  }, [withdrawals]);

  const getWithdrawalsByUserId = (userId: string): Withdrawal[] => {
    return withdrawals.filter((w) => w.userId === userId);
  };

  const getLastWithdrawalDate = (userId: string): string | null => {
    const userWithdrawals = getWithdrawalsByUserId(userId)
      .filter((w) => w.status === 'completed')
      .sort((a, b) => new Date(b.processedAt || '').getTime() - new Date(a.processedAt || '').getTime());
    return userWithdrawals.length > 0 ? userWithdrawals[0].processedAt || null : null;
  };

  const canWithdrawNow = (userId: string): boolean => {
    const lastWithdrawalDate = getLastWithdrawalDate(userId);
    if (!lastWithdrawalDate) return true;
    const lastDate = new Date(lastWithdrawalDate);
    const now = new Date();
    const daysSinceLastWithdrawal = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceLastWithdrawal >= WITHDRAWAL_INTERVAL_DAYS;
  };

  const getNextWithdrawalDate = (userId: string): string | null => {
    const lastWithdrawalDate = getLastWithdrawalDate(userId);
    if (!lastWithdrawalDate) return null;
    const lastDate = new Date(lastWithdrawalDate);
    const nextDate = new Date(lastDate.getTime() + WITHDRAWAL_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
    return nextDate.toISOString();
  };

  const requestWithdrawal = async (userId: string, amount: number, bankAccount: string): Promise<void> => {
    if (!canWithdrawNow(userId)) {
      throw new Error('Solo puedes retirar cada 15 días');
    }
    if (amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    try {
      const result = await trpcCall('withdrawals.create', {
        userId: Number(userId),
        amount,
        bankName: 'Banco',
        accountNumber: bankAccount,
        accountHolder: user?.username || '',
      });

      const newWithdrawal: Withdrawal = {
        id: String(result.id),
        userId,
        amount,
        status: 'pending',
        bankAccount,
        requestedAt: new Date().toISOString(),
      };

      setWithdrawals((prev) => [newWithdrawal, ...prev]);
    } catch (error: any) {
      throw new Error(error.message || 'Error al solicitar retiro');
    }
  };

  const value: WithdrawalContextType = {
    withdrawals,
    lastWithdrawalDate: null,
    canWithdraw: true,
    nextWithdrawalDate: null,
    requestWithdrawal,
    getWithdrawalsByUserId,
    getLastWithdrawalDate,
    getNextWithdrawalDate,
    canWithdrawNow,
  };

  return <WithdrawalContext.Provider value={value}>{children}</WithdrawalContext.Provider>;
}

export function useWithdrawal() {
  const context = useContext(WithdrawalContext);
  if (context === undefined) {
    throw new Error('useWithdrawal debe ser usado dentro de WithdrawalProvider');
  }
  return context;
}
