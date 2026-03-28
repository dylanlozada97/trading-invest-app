import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recharge, RechargeContextType, BankAccount } from '@/types/recharge';
import { useInvestment } from './investment-context';

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

export function RechargeProvider({ children }: { children: React.ReactNode }) {
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const { balance } = useInvestment();

  // Cargar recargas persistidas
  useEffect(() => {
    const loadRecharges = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.RECHARGES);
        if (saved) {
          setRecharges(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading recharges:', error);
      }
    };

    loadRecharges();
  }, []);

  // Guardar recargas
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.RECHARGES, JSON.stringify(recharges));
  }, [recharges]);

  const addRecharge = (amount: number, reference: string, photoUri: string) => {
    const newRecharge: Recharge = {
      id: Date.now().toString(),
      amount,
      reference,
      photoUri,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setRecharges((prev) => [...prev, newRecharge]);
  };

  const approveRecharge = (rechargeId: string) => {
    setRecharges((prev) =>
      prev.map((recharge) => {
        if (recharge.id === rechargeId) {
          return {
            ...recharge,
            status: 'approved',
            approvedAt: new Date().toISOString(),
          };
        }
        return recharge;
      })
    );
  };

  const rejectRecharge = (rechargeId: string, reason: string) => {
    setRecharges((prev) =>
      prev.map((recharge) => {
        if (recharge.id === rechargeId) {
          return {
            ...recharge,
            status: 'rejected',
            rejectionReason: reason,
          };
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
