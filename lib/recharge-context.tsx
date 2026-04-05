import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recharge, RechargeContextType, BankAccount } from '@/types/recharge';
import { useAuth } from './auth-context';
import { getApiBaseUrl } from '@/constants/oauth';

const RechargeContext = createContext<RechargeContextType | undefined>(undefined);

const STORAGE_KEYS = {
  RECHARGES: 'recharges_list',
};

const BANK_ACCOUNT: BankAccount = {
  bankName: 'Banco Colombiano',
  accountHolder: 'Trading Invest Inc',
  accountNumber: '12345678901234567890',
  accountType: 'Corriente',
  documentNumber: '900123456-7',
};

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

export function RechargeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [recharges, setRecharges] = useState<Recharge[]>([]);

  // Load recharges from server
  const loadFromServer = useCallback(async () => {
    if (!user) return;
    try {
      const serverRecharges = await trpcCall('recharges.list', { userId: Number(user.id) }, 'GET');
      if (serverRecharges) {
        const mapped: Recharge[] = serverRecharges.map((r: any) => ({
          id: String(r.id),
          amount: Number(r.amount),
          reference: r.reference || '',
          photoUri: r.proofImageUrl || '',
          status: r.status,
          createdAt: r.createdAt,
          approvedAt: r.updatedAt,
        }));
        setRecharges(mapped);
      }
    } catch (error) {
      console.error('Error loading recharges from server:', error);
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.RECHARGES);
      if (saved) setRecharges(JSON.parse(saved));
    }
  }, [user]);

  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  // Cache locally
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.RECHARGES, JSON.stringify(recharges));
  }, [recharges]);

  const addRecharge = async (amount: number, reference: string, photoUri: string) => {
    if (!user) throw new Error('Debes iniciar sesión');

    try {
      const result = await trpcCall('recharges.create', {
        userId: Number(user.id),
        amount,
        reference,
        proofImageUrl: photoUri,
      });

      const newRecharge: Recharge = {
        id: String(result.id),
        amount,
        reference,
        photoUri,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setRecharges((prev) => [newRecharge, ...prev]);
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear recarga');
    }
  };

  const approveRecharge = (rechargeId: string) => {
    setRecharges((prev) =>
      prev.map((recharge) => {
        if (recharge.id === rechargeId) {
          return { ...recharge, status: 'approved', approvedAt: new Date().toISOString() };
        }
        return recharge;
      })
    );
  };

  const rejectRecharge = (rechargeId: string, reason: string) => {
    setRecharges((prev) =>
      prev.map((recharge) => {
        if (recharge.id === rechargeId) {
          return { ...recharge, status: 'rejected', rejectionReason: reason };
        }
        return recharge;
      })
    );
  };

  const getPendingRecharges = () => {
    return recharges.filter((r) => r.status === 'pending');
  };

  const value: RechargeContextType = {
    bankAccount: BANK_ACCOUNT,
    recharges,
    addRecharge,
    approveRecharge,
    rejectRecharge,
    getPendingRecharges,
  };

  return <RechargeContext.Provider value={value}>{children}</RechargeContext.Provider>;
}

export function useRecharge() {
  const context = useContext(RechargeContext);
  if (context === undefined) {
    throw new Error('useRecharge debe ser usado dentro de RechargeProvider');
  }
  return context;
}
