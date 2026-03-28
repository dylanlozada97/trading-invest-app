import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Referral, ReferralLevel, UserReferralInfo, ReferralContextType } from '@/types/referral';

const ReferralContext = createContext<ReferralContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER_REFERRAL_INFO: 'user_referral_info',
  REFERRALS: 'referrals_list',
};

// Definir los niveles de referidos
const REFERRAL_LEVELS: ReferralLevel[] = [
  {
    level: 1,
    name: 'Bronze',
    minReferrals: 0,
    commissionPercentage: 10,
    description: 'Gana 10% de comisión',
  },
  {
    level: 2,
    name: 'Silver',
    minReferrals: 5,
    commissionPercentage: 15,
    description: 'Gana 15% de comisión con 5+ referidos',
  },
  {
    level: 3,
    name: 'Gold',
    minReferrals: 15,
    commissionPercentage: 20,
    description: 'Gana 20% de comisión con 15+ referidos',
  },
  {
    level: 4,
    name: 'Platinum',
    minReferrals: 30,
    commissionPercentage: 25,
    description: 'Gana 25% de comisión con 30+ referidos',
  },
  {
    level: 5,
    name: 'Diamond',
    minReferrals: 50,
    commissionPercentage: 30,
    description: 'Gana 30% de comisión con 50+ referidos',
  },
];

export function ReferralProvider({ children }: { children: React.ReactNode }) {
  const [userReferralInfo, setUserReferralInfo] = useState<UserReferralInfo | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  // Cargar datos persistidos
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedUserInfo = await AsyncStorage.getItem(STORAGE_KEYS.USER_REFERRAL_INFO);
        const savedReferrals = await AsyncStorage.getItem(STORAGE_KEYS.REFERRALS);

        if (savedUserInfo) {
          setUserReferralInfo(JSON.parse(savedUserInfo));
        }
        if (savedReferrals) {
          setReferrals(JSON.parse(savedReferrals));
        }
      } catch (error) {
        console.error('Error loading referral data:', error);
      }
    };

    loadData();
  }, []);

  // Guardar datos
  useEffect(() => {
    if (userReferralInfo) {
      AsyncStorage.setItem(STORAGE_KEYS.USER_REFERRAL_INFO, JSON.stringify(userReferralInfo));
    }
  }, [userReferralInfo]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.REFERRALS, JSON.stringify(referrals));
  }, [referrals]);

  const generateReferralCode = (userId: string): string => {
    // Generar código único basado en userId
    const code = `REF${userId.substring(0, 4).toUpperCase()}${Date.now().toString().slice(-4)}`;
    return code;
  };

  const getUserLevel = (totalReferrals: number): number => {
    for (let i = REFERRAL_LEVELS.length - 1; i >= 0; i--) {
      if (totalReferrals >= REFERRAL_LEVELS[i].minReferrals) {
        return REFERRAL_LEVELS[i].level;
      }
    }
    return 1;
  };

  const calculateCommission = (investmentAmount: number, referrerLevel: number): number => {
    const level = REFERRAL_LEVELS.find((l) => l.level === referrerLevel);
    if (!level) return 0;
    return (investmentAmount * level.commissionPercentage) / 100;
  };

  const addReferral = (
    referrerUserId: string,
    referredUserId: string,
    referredName: string,
    referredEmail: string
  ) => {
    const newReferral: Referral = {
      id: Date.now().toString(),
      referrerUserId,
      referredUserId,
      referredName,
      referredEmail,
      status: 'pending',
      createdAt: new Date().toISOString(),
      totalEarnings: 0,
    };

    setReferrals((prev) => [...prev, newReferral]);

    // Actualizar info del usuario referidor
    if (userReferralInfo && userReferralInfo.userId === referrerUserId) {
      const newLevel = getUserLevel(userReferralInfo.totalReferrals + 1);
      setUserReferralInfo({
        ...userReferralInfo,
        totalReferrals: userReferralInfo.totalReferrals + 1,
        level: newLevel,
      });
    }
  };

  const activateReferral = (referralId: string) => {
    setReferrals((prev) =>
      prev.map((ref) => {
        if (ref.id === referralId) {
          return {
            ...ref,
            status: 'active',
            activatedAt: new Date().toISOString(),
          };
        }
        return ref;
      })
    );
  };

  const getReferralsByUserId = (userId: string): Referral[] => {
    return referrals.filter((ref) => ref.referrerUserId === userId);
  };

  const value: ReferralContextType = {
    userReferralInfo,
    levels: REFERRAL_LEVELS,
    generateReferralCode,
    addReferral,
    activateReferral,
    calculateCommission,
    getUserLevel,
    getReferralsByUserId,
  };

  return <ReferralContext.Provider value={value}>{children}</ReferralContext.Provider>;
}

export function useReferral() {
  const context = useContext(ReferralContext);
  if (context === undefined) {
    throw new Error('useReferral debe ser usado dentro de ReferralProvider');
  }
  return context;
}
