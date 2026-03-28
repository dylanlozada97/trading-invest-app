/**
 * Tipos para sistema de referidos y niveles
 */

export interface ReferralLevel {
  level: number;
  name: string;
  minReferrals: number;
  commissionPercentage: number;
  description: string;
}

export interface Referral {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referredName: string;
  referredEmail: string;
  status: 'pending' | 'active' | 'inactive';
  createdAt: string;
  activatedAt?: string;
  totalEarnings: number;
}

export interface UserReferralInfo {
  userId: string;
  referralCode: string;
  level: number;
  totalReferrals: number;
  activeReferrals: number;
  totalEarningsFromReferrals: number;
  referrals: Referral[];
}

export interface ReferralContextType {
  userReferralInfo: UserReferralInfo | null;
  levels: ReferralLevel[];
  generateReferralCode: (userId: string) => string;
  addReferral: (referrerUserId: string, referredUserId: string, referredName: string, referredEmail: string) => void;
  activateReferral: (referralId: string) => void;
  calculateCommission: (investmentAmount: number, referrerLevel: number) => number;
  getUserLevel: (totalReferrals: number) => number;
  getReferralsByUserId: (userId: string) => Referral[];
}
