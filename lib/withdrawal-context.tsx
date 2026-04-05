import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Withdrawal, WithdrawalContextType } from '@/types/withdrawal';

const WithdrawalContext = createContext<WithdrawalContextType | undefined>(undefined);

const STORAGE_KEYS = {
  WITHDRAWALS: 'withdrawals_list',
};

const WITHDRAWAL_INTERVAL_DAYS = 15;

export function WithdrawalProvider({ children }: { children: React.ReactNode }) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  // Cargar datos persistidos
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedWithdrawals = await AsyncStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
        if (savedWithdrawals) {
          setWithdrawals(JSON.parse(savedWithdrawals));
        }
      } catch (error) {
        console.error('Error loading withdrawal data:', error);
      }
    };

    loadData();
  }, []);

  // Guardar datos
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

    if (!lastWithdrawalDate) {
      // Si nunca ha hecho retiro, puede hacerlo
      return true;
    }

    const lastDate = new Date(lastWithdrawalDate);
    const now = new Date();
    const daysSinceLastWithdrawal = Math.floor(
      (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceLastWithdrawal >= WITHDRAWAL_INTERVAL_DAYS;
  };

  const getNextWithdrawalDate = (userId: string): string | null => {
    const lastWithdrawalDate = getLastWithdrawalDate(userId);

    if (!lastWithdrawalDate) {
      return null; // Puede retirar ahora
    }

    const lastDate = new Date(lastWithdrawalDate);
    const nextDate = new Date(lastDate.getTime() + WITHDRAWAL_INTERVAL_DAYS * 24 * 60 * 60 * 1000);

    return nextDate.toISOString();
  };

  const requestWithdrawal = async (
    userId: string,
    amount: number,
    bankAccount: string
  ): Promise<void> => {
    if (!canWithdrawNow(userId)) {
      throw new Error('Solo puedes retirar cada 15 días');
    }

    if (amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    const newWithdrawal: Withdrawal = {
      id: Date.now().toString(),
      userId,
      amount,
      status: 'pending',
      bankAccount,
      requestedAt: new Date().toISOString(),
    };

    setWithdrawals((prev) => [...prev, newWithdrawal]);
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

  return (
    <WithdrawalContext.Provider value={value}>{children}</WithdrawalContext.Provider>
  );
}

export function useWithdrawal() {
  const context = useContext(WithdrawalContext);
  if (context === undefined) {
    throw new Error('useWithdrawal debe ser usado dentro de WithdrawalProvider');
  }
  return context;
}
