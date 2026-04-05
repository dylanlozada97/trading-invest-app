import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Investment, InvestmentContextType } from '@/types/investment';
import { useAuth } from '@/lib/auth-context';
import { getApiBaseUrl } from '@/constants/oauth';

const InvestmentContext = createContext<InvestmentContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BALANCE: 'investment_balance',
  INVESTMENTS: 'investments_list',
};

const INVESTMENT_GAIN_PERCENTAGE = 0.60;
const INVESTMENT_DURATION_DAYS = 15;

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

export function InvestmentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [totalGains, setTotalGains] = useState(0);

  // Load data from server when user changes
  const loadFromServer = useCallback(async () => {
    if (!user) return;
    try {
      const userId = Number(user.id);

      // Get user profile for balance
      const profile = await trpcCall('appAuth.getProfile', { userId }, 'GET');
      if (profile) {
        setBalance(profile.balance);
      }

      // Get investments
      const serverInvs = await trpcCall('investments.list', { userId }, 'GET');
      if (serverInvs) {
        const mapped: Investment[] = serverInvs.map((inv: any) => {
          const investmentDate = new Date(inv.investmentDate);
          const completionDate = new Date(inv.completionDate);
          const now = new Date();
          const daysElapsed = Math.floor((now.getTime() - investmentDate.getTime()) / (24 * 60 * 60 * 1000));
          const daysRemaining = Math.max(0, INVESTMENT_DURATION_DAYS - daysElapsed);
          const progressPercentage = Math.min(1, daysElapsed / INVESTMENT_DURATION_DAYS);
          const currentGain = Number(inv.amount) * INVESTMENT_GAIN_PERCENTAGE * progressPercentage;
          const status = inv.status === 'claimed' ? 'claimed' : (daysRemaining === 0 ? 'completed' : inv.status);

          return {
            id: String(inv.id),
            amount: Number(inv.amount),
            investmentDate: inv.investmentDate,
            completionDate: inv.completionDate,
            expectedGain: Number(inv.expectedGain),
            status,
            daysRemaining,
            currentGain,
          };
        });
        setInvestments(mapped);
      }
    } catch (error) {
      console.error('Error loading from server:', error);
      // Fallback to local storage
      const savedBalance = await AsyncStorage.getItem(STORAGE_KEYS.BALANCE);
      const savedInvestments = await AsyncStorage.getItem(STORAGE_KEYS.INVESTMENTS);
      if (savedBalance) setBalance(parseFloat(savedBalance));
      if (savedInvestments) setInvestments(JSON.parse(savedInvestments));
    }
  }, [user]);

  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  // Save locally as cache
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.BALANCE, balance.toString());
  }, [balance]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(investments));
  }, [investments]);

  // Update total gains
  useEffect(() => {
    const gains = investments
      .filter((inv) => inv.status === 'claimed')
      .reduce((sum, inv) => sum + inv.expectedGain, 0);
    setTotalGains(gains);
  }, [investments]);

  // Update investments periodically
  const updateInvestments = useCallback(() => {
    setInvestments((prevInvestments) =>
      prevInvestments.map((inv) => {
        if (inv.status === 'completed' || inv.status === 'claimed') return inv;
        const investmentDate = new Date(inv.investmentDate);
        const now = new Date();
        const daysElapsed = Math.floor((now.getTime() - investmentDate.getTime()) / (24 * 60 * 60 * 1000));
        const daysRemaining = Math.max(0, INVESTMENT_DURATION_DAYS - daysElapsed);
        const progressPercentage = Math.min(1, daysElapsed / INVESTMENT_DURATION_DAYS);
        const currentGain = inv.amount * INVESTMENT_GAIN_PERCENTAGE * progressPercentage;
        const newStatus = daysRemaining === 0 ? 'completed' : 'active';
        return { ...inv, daysRemaining, currentGain, status: newStatus };
      })
    );
  }, []);

  useEffect(() => {
    updateInvestments();
    const interval = setInterval(updateInvestments, 60000);
    return () => clearInterval(interval);
  }, [updateInvestments]);

  const addInvestment = useCallback(
    async (amount: number) => {
      if (!user) throw new Error('Debes iniciar sesión');
      if (amount > balance) throw new Error('Saldo insuficiente');

      try {
        // Call backend API
        const result = await trpcCall('investments.create', {
          userId: Number(user.id),
          amount,
        });

        const now = new Date();
        const completionDate = new Date(now.getTime() + INVESTMENT_DURATION_DAYS * 24 * 60 * 60 * 1000);

        const newInvestment: Investment = {
          id: String(result.id),
          amount,
          investmentDate: now.toISOString(),
          completionDate: completionDate.toISOString(),
          expectedGain: amount * INVESTMENT_GAIN_PERCENTAGE,
          status: 'active',
          daysRemaining: INVESTMENT_DURATION_DAYS,
          currentGain: 0,
        };

        setInvestments((prev) => [newInvestment, ...prev]);
        setBalance((prev) => prev - amount);
      } catch (error: any) {
        throw new Error(error.message || 'Error al crear inversión');
      }
    },
    [balance, user]
  );

  const claimGains = useCallback(async (investmentId: string) => {
    if (!user) return;
    try {
      const result = await trpcCall('investments.claim', {
        investmentId: Number(investmentId),
        userId: Number(user.id),
      });

      setInvestments((prev) =>
        prev.map((inv) => {
          if (inv.id === investmentId) {
            return { ...inv, status: 'claimed' };
          }
          return inv;
        })
      );
      setBalance((prev) => prev + result.totalReturn);
    } catch (error: any) {
      throw new Error(error.message || 'Error al reclamar ganancias');
    }
  }, [user]);

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
