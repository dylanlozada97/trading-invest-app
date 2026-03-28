import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Investment, InvestmentContextType } from '@/types/investment';

const InvestmentContext = createContext<InvestmentContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BALANCE: 'investment_balance',
  INVESTMENTS: 'investments_list',
};

const INITIAL_BALANCE = 0;
const INVESTMENT_GAIN_PERCENTAGE = 0.60; // 60% gain
const INVESTMENT_DURATION_DAYS = 15;

export function InvestmentProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [totalGains, setTotalGains] = useState(0);

  // Cargar datos persistidos
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedBalance = await AsyncStorage.getItem(STORAGE_KEYS.BALANCE);
        const savedInvestments = await AsyncStorage.getItem(STORAGE_KEYS.INVESTMENTS);

        if (savedBalance) setBalance(parseFloat(savedBalance));
        if (savedInvestments) {
          const parsed = JSON.parse(savedInvestments);
          setInvestments(parsed);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Guardar balance
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.BALANCE, balance.toString());
  }, [balance]);

  // Guardar inversiones
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(investments));
  }, [investments]);

  // Actualizar ganancias totales
  useEffect(() => {
    const gains = investments
      .filter((inv) => inv.status === 'claimed')
      .reduce((sum, inv) => sum + inv.expectedGain, 0);
    setTotalGains(gains);
  }, [investments]);

  // Calcular días restantes y ganancias actuales
  const updateInvestments = useCallback(() => {
    setInvestments((prevInvestments) =>
      prevInvestments.map((inv) => {
        if (inv.status === 'completed' || inv.status === 'claimed') {
          return inv;
        }

        const investmentDate = new Date(inv.investmentDate);
        const completionDate = new Date(investmentDate.getTime() + INVESTMENT_DURATION_DAYS * 24 * 60 * 60 * 1000);
        const now = new Date();

        const daysElapsed = Math.floor((now.getTime() - investmentDate.getTime()) / (24 * 60 * 60 * 1000));
        const daysRemaining = Math.max(0, INVESTMENT_DURATION_DAYS - daysElapsed);

        // Calcular ganancia proporcional
        const progressPercentage = Math.min(1, daysElapsed / INVESTMENT_DURATION_DAYS);
        const currentGain = inv.amount * INVESTMENT_GAIN_PERCENTAGE * progressPercentage;

        const newStatus = daysRemaining === 0 ? 'completed' : 'active';

        return {
          ...inv,
          daysRemaining,
          currentGain,
          status: newStatus,
          completionDate: completionDate.toISOString(),
        };
      })
    );
  }, []);

  // Actualizar inversiones cada minuto
  useEffect(() => {
    updateInvestments();
    const interval = setInterval(updateInvestments, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, [updateInvestments]);

  const addInvestment = useCallback(
    (amount: number) => {
      if (amount > balance) {
        throw new Error('Saldo insuficiente');
      }

      const now = new Date();
      const completionDate = new Date(now.getTime() + INVESTMENT_DURATION_DAYS * 24 * 60 * 60 * 1000);

      const newInvestment: Investment = {
        id: Date.now().toString(),
        amount,
        investmentDate: now.toISOString(),
        completionDate: completionDate.toISOString(),
        expectedGain: amount * INVESTMENT_GAIN_PERCENTAGE,
        status: 'active',
        daysRemaining: INVESTMENT_DURATION_DAYS,
        currentGain: 0,
      };

      setInvestments((prev) => [...prev, newInvestment]);
      setBalance((prev) => prev - amount);
    },
    [balance]
  );

  const claimGains = useCallback((investmentId: string) => {
    setInvestments((prev) =>
      prev.map((inv) => {
        if (inv.id === investmentId && inv.status === 'completed') {
          // Acreditar el monto invertido + ganancias
          setBalance((prevBalance) => prevBalance + inv.amount + inv.expectedGain);
          return { ...inv, status: 'claimed' };
        }
        return inv;
      })
    );
  }, []);

  const value: InvestmentContextType = {
    balance,
    totalGains,
    investments,
    addInvestment,
    claimGains,
    updateInvestments,
  };

  return <InvestmentContext.Provider value={value}>{children}</InvestmentContext.Provider>;
}

export function useInvestment() {
  const context = useContext(InvestmentContext);
  if (context === undefined) {
    throw new Error('useInvestment debe ser usado dentro de InvestmentProvider');
  }
  return context;
}
